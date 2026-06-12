/**
 * Tauri 行为监控客户端适配
 * 适配原有的 activityMonitor 接口到 Tauri
 * 
 * 这个模块处理与 Rust 后端的通信
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { exit } from '@tauri-apps/plugin-process';

class ActivityMonitorClient {
    constructor() {
        this.initialized = false;
        this.deviceInfo = null;
        this.reportHandlers = [];
        this.timeoutHandlers = [];
        this.logoutHandlers = [];
        this.deviceHandlers = [];
        this.unlistenFunctions = [];

        // 初始化事件监听
        this.setupListeners();
    }

    setupListeners() {
        console.log('[ActivityMonitorClient] 设置事件监听...');

        // 监听超时事件
        this.unlistenFunctions.push(
            listen('auth:timeout', (event) => {
                console.log('[ActivityMonitorClient] 收到超时事件:', event.payload);
                this.handleTimeout(event.payload);
            }).catch(err => {
                console.error('[ActivityMonitorClient] 监听超时事件失败:', err);
            })
        );

        // 监听行为数据上报
        this.unlistenFunctions.push(
            listen('activity:report', (event) => {
                console.log('[ActivityMonitorClient] 收到行为记录:', event.payload);
                this.handleReport(event.payload);
            }).catch(err => {
                console.error('[ActivityMonitorClient] 监听行为记录失败:', err);
            })
        );

        // 监听批量上传请求
        this.unlistenFunctions.push(
            listen('activity:upload-batch', (event) => {
                console.log('[ActivityMonitorClient] 收到批量上传请求:', event.payload);
                this.handleBatchUpload(event.payload);
            }).catch(err => {
                console.error('[ActivityMonitorClient] 监听批量上传失败:', err);
            })
        );

        // 监听设备信息
        this.unlistenFunctions.push(
            listen('device:info', (event) => {
                console.log('[ActivityMonitorClient] 收到设备信息:', event.payload);
                this.deviceInfo = event.payload;
                this.handleDeviceInfo(event.payload);
            }).catch(err => {
                console.error('[ActivityMonitorClient] 监听设备信息失败:', err);
            })
        );

        console.log('[ActivityMonitorClient] 事件监听设置完成');
    }

    async init(userInfo) {
        try {
            console.log('[ActivityMonitorClient] 初始化监控，用户信息:', userInfo);
            await invoke('activity_init', { userInfo });
            this.initialized = true;
            console.log('[ActivityMonitorClient] 监控已初始化');
        } catch (error) {
            console.error('[ActivityMonitorClient] 初始化失败:', error);
            console.error('[ActivityMonitorClient] 错误详情:', {
                message: error.message,
                code: error.code,
                stack: error.stack
            });
            throw error;
        }
    }

    async start() {
        try {
            console.log('[ActivityMonitorClient] 启动监控...');
            await invoke('activity_start');
            console.log('[ActivityMonitorClient] 监控已启动');
        } catch (error) {
            console.error('[ActivityMonitorClient] 启动失败:', error);
            throw error;
        }
    }

    async stop() {
        try {
            console.log('[ActivityMonitorClient] 停止监控...');
            await invoke('activity_stop');
            console.log('[ActivityMonitorClient] 监控已停止');
        } catch (error) {
            console.error('[ActivityMonitorClient] 停止失败:', error);
            throw error;
        }
    }

    async setLoginState(isLoggedIn, userInfo) {
        try {
            console.log('[ActivityMonitorClient] 设置登录状态:', { isLoggedIn, userInfo });
            await invoke('activity_set_login_state', { isLoggedIn, userInfo });
            console.log('[ActivityMonitorClient] 登录状态已设置');
        } catch (error) {
            console.error('[ActivityMonitorClient] 设置登录状态失败:', error);
        }
    }

    async reset(userInfo) {
        try {
            console.log('[ActivityMonitorClient] 重置监控:', userInfo);
            await invoke('activity_reset', { userInfo });
            console.log('[ActivityMonitorClient] 监控已重置');
        } catch (error) {
            console.error('[ActivityMonitorClient] 重置失败:', error);
        }
    }

    async updateConfig(config) {
        // Tauri 版本暂不支持动态配置更新
        console.log('[ActivityMonitorClient] 配置更新:', config);
    }

    async getStatus() {
        try {
            return await invoke('activity_get_stats');
        } catch (error) {
            console.error('[ActivityMonitorClient] 获取状态失败:', error);
            return null;
        }
    }

    async getStats() {
        try {
            return await invoke('activity_get_stats');
        } catch (error) {
            console.error('[ActivityMonitorClient] 获取统计失败:', error);
            return null;
        }
    }

    async getDeviceInfo() {
        try {
            console.log('[ActivityMonitorClient] 获取设备信息...');
            const info = await invoke('get_device_info');
            console.log('[ActivityMonitorClient] 设备信息:', info);
            return info;
        } catch (error) {
            console.error('[ActivityMonitorClient] 获取设备信息失败:', error);
            return null;
        }
    }

    // ==================== 数据处理 ====================

    handleTimeout(data) {
        console.log('[ActivityMonitorClient] 处理超时事件:', data);
        this.timeoutHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error('[ActivityMonitorClient] 超时处理器执行失败:', e);
            }
        });
    }

    handleReport(data) {
        console.log('[ActivityMonitorClient] 处理行为报告:', data);
        this.reportHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error('[ActivityMonitorClient] 报告处理器执行失败:', e);
            }
        });
    }

    handleDeviceInfo(data) {
        console.log('[ActivityMonitorClient] 处理设备信息:', data);
        this.deviceHandlers.forEach(handler => {
            try {
                handler(data);
            } catch (e) {
                console.error('[ActivityMonitorClient] 设备信息处理器执行失败:', e);
            }
        });
    }

    async handleBatchUpload(payload) {
        console.log('[ActivityMonitorClient] 处理批量上传...');
        console.log('[ActivityMonitorClient] payload 类型:', typeof payload);
        console.log('[ActivityMonitorClient] payload:', JSON.stringify(payload).substring(0, 500));

        const records = payload?.data || payload;
        if (!records || records.length === 0) {
            console.log('[ActivityMonitorClient] 记录为空，跳过上传');
            return;
        }

        try {
            console.log('[ActivityMonitorClient] 开始上传，记录数量:', records.length);
            const result = await this.uploadBatch(records);
            console.log('[ActivityMonitorClient] 批量上传完成:', result);

            const batchIds = records
                .map(record => record.content?.batchId || record.batch_id)
                .filter(Boolean);

            if (batchIds.length > 0) {
                try {
                    await invoke('activity_mark_batch_uploaded', { batchIds });
                    console.log(`[ActivityMonitorClient] 已通知后端标记 ${batchIds.length} 条记录为已上传`);
                } catch (e) {
                    console.error('[ActivityMonitorClient] 标记已上传失败:', e);
                }
            }
        } catch (error) {
            console.error('[ActivityMonitorClient] 批量上传失败:', error);
        }
    }

    async uploadBatch(records) {
        console.log('[ActivityMonitorClient] 执行批量上传，记录数:', records.length);
        // 这里调用实际的 API 上传
        // 实际实现应该调用后端 API
        return { success: true, count: records.length };
    }

    async bindDevice(deviceInfo) {
        // 设备绑定逻辑
        console.log('[ActivityMonitorClient] 设备绑定:', deviceInfo);
        return { success: true };
    }

    async performLogout(type) {
        try {
            console.log('[ActivityMonitorClient] 报告注销:', type);
            await invoke('activity_logout', { logoutType: type });
        } catch (error) {
            console.error('[ActivityMonitorClient] 注销报告失败:', error);
        }

        // 保留 companyAddress，清除其他 localStorage 数据
        const savedAddress = localStorage.getItem('companyAddress');
        localStorage.clear();
        if (savedAddress) {
            localStorage.setItem('companyAddress', savedAddress);
        }
    }

    // ==================== 回调注册 ====================

    onTimeout(handler) {
        console.log('[ActivityMonitorClient] 注册超时处理器');
        this.timeoutHandlers.push(handler);
    }

    onReport(handler) {
        console.log('[ActivityMonitorClient] 注册报告处理器');
        this.reportHandlers.push(handler);
    }

    onLogout(handler) {
        console.log('[ActivityMonitorClient] 注册注销处理器');
        this.logoutHandlers.push(handler);
    }

    onDeviceInfo(handler) {
        console.log('[ActivityMonitorClient] 注册设备信息处理器');
        this.deviceHandlers.push(handler);
    }

    removeAllListeners() {
        console.log('[ActivityMonitorClient] 移除所有监听器...');
        
        this.unlistenFunctions.forEach(async (unlistenPromise, index) => {
            try {
                const unlisten = await unlistenPromise;
                if (typeof unlisten === 'function') {
                    unlisten();
                    console.log(`[ActivityMonitorClient] 移除监听器 ${index}`);
                }
            } catch (e) {
                console.error(`[ActivityMonitorClient] 移除监听器 ${index} 失败:`, e);
            }
        });
        
        this.unlistenFunctions = [];
        this.reportHandlers = [];
        this.timeoutHandlers = [];
        this.logoutHandlers = [];
        this.deviceHandlers = [];
        
        console.log('[ActivityMonitorClient] 所有监听器已移除');
    }
}

// 单例
const activityMonitor = new ActivityMonitorClient();

export default activityMonitor;
export { ActivityMonitorClient };
