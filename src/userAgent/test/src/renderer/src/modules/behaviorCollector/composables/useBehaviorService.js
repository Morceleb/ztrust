/**
 * 行为采集服务
 */

import { ref, onMounted, onUnmounted } from 'vue';
import { BEHAVIOR_CONFIG } from '../config';

export function useBehaviorCollector() {
    const isCollecting = ref(false);
    const collectors = ref(new Map());
    const records = ref([]);
    let intervalId = null;
    let flushIntervalId = null;

    // 注册采集器
    const register = (name, collector) => {
        collectors.value.set(name, collector);
    };

    // 注销采集器
    const unregister = (name) => {
        collectors.value.delete(name);
    };

    // 采集所有数据
    const collectAll = () => {
        const snapshot = {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screen: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        collectors.value.forEach((collector, name) => {
            try {
                const data = collector.getData?.();
                if (data) {
                    snapshot[name] = data;
                }
            } catch (e) {
                console.error(`[BehaviorCollector] ${name} 采集失败:`, e);
            }
        });

        return snapshot;
    };

    // 发送数据
    const send = async (payload) => {
        try {
            const response = await fetch(BEHAVIOR_CONFIG.upload.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return await response.json();
        } catch (e) {
            console.error('[BehaviorCollector] 发送失败:', e);
            // 可以在这里添加重试逻辑或本地存储
        }
    };

    // 启动采集
    const start = (intervalMs = 30000) => {
        if (isCollecting.value) return;

        isCollecting.value = true;

        // 立即采集一次
        const firstData = collectAll();
        records.value.push(firstData);
        console.log('[BehaviorCollector] 首次采集:', firstData);

        // 定期采集
        intervalId = setInterval(() => {
            if (!isCollecting.value) return;

            const data = collectAll();
            records.value.push(data);
            console.log('[BehaviorCollector] 采集数据:', data);
        }, intervalMs);

        // 定期刷新
        flushIntervalId = setInterval(() => {
            flush();
        }, BEHAVIOR_CONFIG.batch.flushInterval);
    };

    // 停止采集
    const stop = () => {
        isCollecting.value = false;

        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }

        if (flushIntervalId) {
            clearInterval(flushIntervalId);
            flushIntervalId = null;
        }
    };

    // 刷新数据
    const flush = async () => {
        if (records.value.length === 0) return;

        const batch = records.value.splice(0, BEHAVIOR_CONFIG.batch.maxBatchSize);
        
        try {
            await send({ data: batch });
            console.log(`[BehaviorCollector] 已刷新 ${batch.length} 条记录`);
        } catch (e) {
            console.error('[BehaviorCollector] 刷新失败:', e);
            // 失败时放回队列
            records.value.unshift(...batch);
        }
    };

    // 清空所有采集器
    const clearAll = () => {
        collectors.value.forEach(collector => {
            collector.clear?.();
        });
        records.value = [];
    };

    // 生命周期
    onMounted(() => {
        console.log('[BehaviorCollector] 已挂载');
    });

    onUnmounted(() => {
        stop();
        clearAll();
    });

    return {
        isCollecting,
        records,
        register,
        unregister,
        start,
        stop,
        flush,
        clearAll,
        collectAll,
    };
}

export default useBehaviorCollector;
