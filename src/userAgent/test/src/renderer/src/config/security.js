/**
 * 安全配置
 * 用于零信任访问控制系统的行为监控配置
 */

export const SecurityConfig = {
    // 行为监控配置
    activityMonitor: {
        enabled: true,
        sampleRates: {
            mouse: 100,           // 鼠标轨迹采样间隔（毫秒）
            keyboard: 100,        // 键盘采样间隔（毫秒）
            scroll: 100,          // 滚动采样间隔（毫秒）
        },
        batch: {
            saveInterval: 2 * 60 * 1000,    // 本地存储：每2分钟存入数据库
            uploadInterval: 3 * 60 * 1000,  // 上传：每3分钟尝试上传
            maxBatchRecords: 10000,
        },
        inactivityTimeout: 6 * 60 * 1000,    // 失活超时：6分钟
        inactivityCheckInterval: 1000,        // 失活检测间隔
    },

    // 设备指纹配置
    deviceFingerprint: {
        enabled: true,
        collectBrowserInfo: true,
        collectSystemInfo: true,
        collectScreenInfo: true,
        collectTimezone: true,
    },

    // 会话配置
    session: {
        timeout: 30 * 60 * 1000,           // 30分钟无操作超时
        maxSessionTime: 8 * 60 * 60 * 1000, // 最大会话时间8小时
        rememberMeDuration: 7 * 24 * 60 * 60 * 1000, // 记住我：7天
    },

    // 登录配置
    login: {
        maxFailedAttempts: 5,                // 最大失败尝试次数
        lockoutDuration: 15 * 60 * 1000,   // 锁定时长15分钟
        requireMFA: false,                  // 是否需要多因素认证
    },

    // API 配置
    api: {
        // baseUrl: '', // 不在这里设置，由 request 模块动态处理
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
    },
};

export default SecurityConfig;
