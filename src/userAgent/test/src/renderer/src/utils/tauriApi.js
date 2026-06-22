/**
 * Tauri API 适配层
 * 将原有的 electronAPI 适配到 Tauri 2.0
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

// 窗口控制
export const controlWindow = (action) => invoke('window_control', { action });
export const startDragging = () => invoke('window_start_dragging');

// 活动监控
export const initActivityMonitor = (userInfo) => invoke('activity_init', { userInfo });
export const startActivityMonitor = () => invoke('activity_start');
export const stopActivityMonitor = () => invoke('activity_stop');
export const resetActivityMonitor = (userInfo) => invoke('activity_reset', { userInfo });
export const setLoginState = (isLoggedIn, userInfo) => invoke('activity_set_login_state', { isLoggedIn, userInfo });
export const logoutWithReport = (logoutType) => invoke('activity_logout', { logoutType });
export const getActivityStats = () => invoke('activity_get_stats');

// 设备信息
export const getDeviceInfo = () => invoke('get_device_info');
export const scanWifiEnvironment = () => invoke('scan_wifi_environment');
export const getPairedBluetoothDevices = () => invoke('get_paired_bluetooth_devices');

// 数据库操作
export const dbQuery = (sql, params) => invoke('db_query', { sql, params });
export const dbExecute = (sql, params) => invoke('db_execute', { sql, params });
export const clearUserData = () => invoke('db_clear_user_data');

// 系统信息
export const getAppVersion = () => invoke('get_app_version');
export const getPlatformInfo = () => invoke('get_platform_info');

// 权限检查
export const checkPermission = (permission) => invoke('check_permission', { permission });
export const checkAuth = () => invoke('check_auth');

// 事件监听管理
const listeners = new Map();

// 监听超时事件
export const onTimeout = (callback) => {
    return listen('auth:timeout', (event) => callback(event.payload));
};

// 监听行为数据上报
export const onActivityReport = (callback) => {
    return listen('activity:report', (event) => callback(event.payload));
};

// 监听批量上传请求
export const onActivityUploadBatch = (callback) => {
    return listen('activity:upload-batch', (event) => callback(event.payload));
};

// 监听设备信息
export const onDeviceInfo = (callback) => {
    return listen('device:info', (event) => callback(event.payload));
};

// 移除事件监听
export const removeAllListeners = (channel) => {
    const key = `__listener_${channel}`;
    if (listeners.has(key)) {
        listeners.get(key)();
        listeners.delete(key);
    }
};

// 通知批量上传完成
export const notifyBatchUploaded = (batchIds) => invoke('activity_mark_batch_uploaded', { batchIds });

// 活动监控命令
export const activityMarkBatchUploaded = (batchIds) => invoke('activity_mark_batch_uploaded', { batchIds });

// 导出 invoke 供高级用法
export { invoke };

// 导出事件监听函数
export { listen };

export default {
    controlWindow,
    startDragging,
    initActivityMonitor,
    startActivityMonitor,
    stopActivityMonitor,
    resetActivityMonitor,
    setLoginState,
    logoutWithReport,
    getActivityStats,
    getDeviceInfo,
    scanWifiEnvironment,
    getPairedBluetoothDevices,
    dbQuery,
    dbExecute,
    clearUserData,
    getAppVersion,
    getPlatformInfo,
    checkPermission,
    checkAuth,
    onTimeout,
    onActivityReport,
    onActivityUploadBatch,
    onDeviceInfo,
    removeAllListeners,
    notifyBatchUploaded,
    invoke,
    listen,
};
