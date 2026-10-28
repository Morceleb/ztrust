/**
 * SessionActivityCollector - 会话活动采集器
 *
 * 设计目标：
 *   1. 高频打点（聚焦/失焦/快捷键/资源访问）不直接 POST，先入内存缓冲
 *   2. 满足任一触发条件即 flush 到 /context/process：
 *      - 缓冲达到 MAX_BATCH 条
 *      - 距上次 flush 已过 FLUSH_INTERVAL_MS
 *      - 显式调用 flushNow()（如登出前）
 *   3. flush 失败时本地兜底（保留在 buffer，等下次再试）
 *   4. Tauri 环境下面向 Rust 行为监控；浏览器环境下面向 8900 /context/process
 *
 * 活动 type 枚举（与服务端 sessionStore.js 对齐）：
 *   login | logout | token_refresh | access_attempt | access_granted
 *   access_denied | access_error | idle | active | page_focus | page_blur
 *
 * payload 字段：
 *   - session_id   在 flush 时注入，前端无需逐条带
 *   - device_id    同上
 *   - occurredAt   ISO 时间戳
 *   - payload      自定义上下文（os / browser / screen / resourceId / method / url ...）
 */

import request from '@/utils/request';
import { getSessionId, getCachedDeviceId } from '@/api/auth';

const MAX_BATCH = 20;                  // 缓冲上限
const FLUSH_INTERVAL_MS = 10 * 1000;   // 10 秒
const FLUSH_RETRY_INTERVAL_MS = 3 * 1000; // 失败重试间隔
const MAX_BUFFER_FAILSAFE = 500;       // 极端情况硬上限，避免内存爆炸

class SessionActivityCollector {
    constructor() {
        this.buffer = [];
        this.flushTimer = null;
        this.flushInProgress = false;
        this.lastFlushAt = 0;
        this.flushFailureCount = 0;
    }

    /**
     * 启动周期 flush 定时器（应用启动时调用一次）
     */
    startPeriodicFlush() {
        if (this.flushTimer) return;
        this.flushTimer = setInterval(() => {
            this.flush().catch(() => console.warn('[ActivityCollector] 周期 flush 失败'));
        }, FLUSH_INTERVAL_MS);
        console.log('[ActivityCollector] 周期 flush 已启动 (', FLUSH_INTERVAL_MS, 'ms )');
    }

    /**
     * 停止定时器（应用退出前调用）
     */
    stopPeriodicFlush() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
    }

    /**
     * 记录一条活动
     * @param {object} activity { type, action?, resourceId?, occurredAt?, payload? }
     */
    record(activity) {
        if (!activity || !activity.type) {
            console.warn('[ActivityCollector] 忽略空 activity:', activity);
            return;
        }

        // 自动补充 occurredAt
        const enriched = {
            ...activity,
            occurredAt: activity.occurredAt || new Date().toISOString(),
        };

        this.buffer.push(enriched);

        // 超过硬上限立即 flush
        if (this.buffer.length >= MAX_BUFFER_FAILSAFE) {
            console.warn('[ActivityCollector] buffer 超过硬上限，强制 flush');
            this.flush().catch(() => {});
            return;
        }

        // 达到批量上限立即 flush
        if (this.buffer.length >= MAX_BATCH) {
            this.flush().catch(() => {});
        }
    }

    /**
     * 立即 flush（登出/退出前同步调用）
     */
    async flushNow() {
        return this.flush();
    }

    /**
     * 批量上报到 8900
     */
    async flush() {
        if (this.flushInProgress) return;
        if (this.buffer.length === 0) return;

        const sessionId = getSessionId();
        if (!sessionId) {
            console.warn('[ActivityCollector] 无 session_id，活动暂留 buffer');
            return;
        }

        const deviceId = getCachedDeviceId();
        const batch = this.buffer.splice(0, MAX_BATCH);

        // 给每条活动注入 session_id / device_id（兜底，服务端也会从 header 读）
        const enrichedBatch = batch.map((a) => ({
            ...a,
            session_id: a.session_id || sessionId,
            device_id: a.device_id || deviceId,
        }));

        this.flushInProgress = true;
        try {
            // 同时兼容 data 字段（老协议）和 activities 字段（新协议）
            const response = await request.post('/context/process', {
                session_id: sessionId,
                activities: enrichedBatch,
                data: enrichedBatch,
            });
            this.flushFailureCount = 0;
            this.lastFlushAt = Date.now();
            console.log('[ActivityCollector] flush 成功:', enrichedBatch.length, '条');

            // 即便响应失败也吞掉，按"成功即可清理"对待（失败也不会重复上报，老数据已在 buffer 之外）
            return response;
        } catch (err) {
            this.flushFailureCount += 1;
            console.error('[ActivityCollector] flush 失败:', {
                count: enrichedBatch.length,
                attempt: this.flushFailureCount,
                status: err.response?.status,
                message: err.message,
            });
            // 失败时把数据放回 buffer 头部（下次重试）
            this.buffer = enrichedBatch.concat(this.buffer);
            // 失败超过 3 次后丢弃，避免无意义堆积
            if (this.buffer.length > MAX_BUFFER_FAILSAFE) {
                console.warn('[ActivityCollector] 失败堆积超过硬上限，丢弃老数据');
                this.buffer = this.buffer.slice(-MAX_BUFFER_FAILSAFE);
            }
            throw err;
        } finally {
            this.flushInProgress = false;
        }
    }

    /**
     * 清空 buffer（不推荐，会丢失未上报的活动）
     */
    clear() {
        this.buffer = [];
    }

    /**
     * 获取当前 buffer 长度（调试用）
     */
    size() {
        return this.buffer.length;
    }
}

// 单例
const collector = new SessionActivityCollector();

export default collector;
export { SessionActivityCollector };

/**
 * 从 URL 抽取资源 ID（用于 access_attempt）
 * 形如 /auth/access/r1234 → r1234
 */
export function extractResourceId(url) {
    if (!url) return null;
    const match = String(url).match(/\/auth\/access\/([^/?]+)/);
    return match ? match[1] : null;
}
