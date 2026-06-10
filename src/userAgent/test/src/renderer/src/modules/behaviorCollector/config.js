/**
 * 行为采集器配置
 */

export const BEHAVIOR_CONFIG = {
    // 采样配置
    sampling: {
        mouseInterval: 50,        // 鼠标采样间隔 (ms)
        keyboardInterval: 50,    // 键盘采样间隔 (ms)
        scrollInterval: 100,     // 滚动采样间隔 (ms)
        pageTimingInterval: 1000, // 页面时序采样间隔 (ms)
    },

    // 批次配置
    batch: {
        maxBatchSize: 100,        // 最大批次大小
        flushInterval: 30000,    // 刷新间隔 (ms)
        retryCount: 3,           // 重试次数
        retryDelay: 1000,        // 重试延迟 (ms)
    },

    // 存储配置
    storage: {
        useLocalStorage: true,   // 是否使用 localStorage
        maxStoredRecords: 1000,  // 最大存储记录数
        cleanupInterval: 60000,   // 清理间隔 (ms)
    },

    // 特征配置
    features: {
        collectKeystroke: true,  // 采集按键特征
        collectMouse: true,       // 采集鼠标特征
        collectScroll: true,      // 采集滚动特征
        collectPageTiming: true, // 采集页面时序
        collectDeviceFingerprint: true, // 采集设备指纹
    },

    // 上传配置
    upload: {
        endpoint: '/api/context/process',
        method: 'POST',
        timeout: 10000,
    },
};

export default BEHAVIOR_CONFIG;
