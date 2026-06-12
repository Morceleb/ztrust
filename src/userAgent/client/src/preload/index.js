const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // ========== 窗口控制 ==========
    controlWindow: (action) => ipcRenderer.send('window-control', action),

    // ========== 行为监控 API ==========

    // 初始化监控（登录成功后调用）
    initActivityMonitor: (userInfo) => ipcRenderer.send('activity:init', userInfo),

    // 启动监控
    startActivityMonitor: () => ipcRenderer.send('activity:start'),

    // 停止监控
    stopActivityMonitor: () => ipcRenderer.send('activity:stop'),

    // 重置监控（重新登录后调用）
    resetActivityMonitor: (userInfo) => ipcRenderer.send('activity:reset', userInfo),

    // 更新监控配置
    updateActivityConfig: (config) => ipcRenderer.send('activity:config', config),

    // 获取监控状态
    getActivityStatus: () => ipcRenderer.invoke('activity:status'),

    // 获取监控统计
    getActivityStats: () => ipcRenderer.invoke('activity:stats'),

    // 获取设备信息
    getDeviceInfo: () => ipcRenderer.invoke('activity:device-info'),

    // 手动注销（发送注销信息）
    logoutWithReport: (type) => ipcRenderer.send('auth:logout', type),

    // 设置登录状态（控制失活计时）
    setLoginState: (isLoggedIn, userInfo) => ipcRenderer.send('auth:set-login-state', isLoggedIn, userInfo),

    // ========== 事件监听 ==========

    // 监听超时事件
    onTimeout: (callback) => {
        ipcRenderer.on('auth:timeout', (event, data) => callback(data));
    },

    // 监听行为数据上报
    onActivityReport: (callback) => {
        ipcRenderer.on('activity:report', (event, data) => callback(data));
    },

    // 监听批量上传
    onActivityUploadBatch: (callback) => {
        ipcRenderer.on('activity:upload-batch', (event, data) => callback(data));
    },

    // 上传成功后通知主进程标记已上传
    notifyBatchUploaded: (batchIds) => ipcRenderer.send('activity:batch-uploaded', batchIds),

    // 监听设备信息
    onDeviceInfo: (callback) => {
        ipcRenderer.on('device:info', (event, data) => callback(data));
    },

    // 移除事件监听
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    },

    // ========== 数据库操作（仅在需要时使用）==========
    dbQuery: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    dbExecute: (sql, params) => ipcRenderer.invoke('db:execute', sql, params)
});
