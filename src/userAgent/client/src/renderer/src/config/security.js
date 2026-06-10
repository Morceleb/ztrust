/**
 * 全局安全配置
 * 包含行为监控、认证超时、数据存储等安全相关配置
 */

export const SecurityConfig = {
    // ========== 行为监控配置 ==========
    activityMonitor: {
        enabled: true,
        // 本地存储周期（毫秒），每2分钟存入数据库
        saveInterval: 2 * 60 * 1000,
        // 上传周期（毫秒），每3分钟尝试上传
        uploadInterval: 3 * 60 * 1000,
        // 失活超时时间（毫秒），默认6分钟无活动自动注销
        inactivityTimeout: 6 * 60 * 1000,
        // 采样配置
        sampleRates: {
            mouse: 100,           // 鼠标轨迹采样间隔（毫秒），每秒10次
            keyboard: 100,        // 键盘采样间隔（毫秒）
            scroll: 100,          // 滚动采样间隔（毫秒）
        },
    },

    // ========== 数据库配置 ==========
    database: {
        // 是否启用 SQLite 本地存储
        enabled: true,
        // 数据库文件路径（相对于用户数据目录）
        filename: 'activity_monitor.db',
        // 数据保留天数
        retentionDays: 30,
        // 自动清理间隔（毫秒），24小时
        cleanupInterval: 24 * 60 * 60 * 1000,
    },

    // ========== 设备指纹配置 ==========
    deviceFingerprint: {
        enabled: true,
        // 缓存指纹（避免重复计算）
        cacheEnabled: true,
        // 包含 Canvas 指纹
        includeCanvas: true,
        // 包含 WebGL 指纹
        includeWebgl: true,
        // 包含字体列表
        includeFonts: true,
        // 设备绑定接口
        bindUrl: '/api/device/bind',
    },

    // ========== API 接口配置 ==========
    api: {
        // 行为数据上报接口
        activityReportUrl: '/api/activity/report',
        // 批量上报接口
        activityBatchUrl: '/api/activity/batch',
        // 超时注销接口
        timeoutUrl: '/api/auth/timeout',
        // 手动注销接口
        logoutUrl: '/api/auth/logout',
        // 登录接口
        loginUrl: '/api/auth/login',
        // 认证检测接口
        authCheckUrl: '/api/me',
        // 设备绑定接口
        deviceBindUrl: '/api/device/bind',
        // 设备列表接口
        deviceListUrl: '/api/device/list',
    },

    // ========== 认证配置 ==========
    auth: {
        // 会话超时时间（毫秒）
        sessionTimeout: 6 * 60 * 1000,
        // 是否启用会话超时检测
        enableSessionTimeout: true,
        // 登出后重定向地址
        logoutRedirectUrl: '/login',
        // 登录页地址
        loginUrl: '/login',
    },

    // ========== 存储配置 ==========
    storage: {
        trackLastActivity: true,
        lastActivityKey: 'last_activity_time',
        deviceInfoKey: 'device_info',
    }
}

// 快捷配置函数
export const createSecurityConfig = (options = {}) => {
    return {
        activityMonitor: {
            ...SecurityConfig.activityMonitor,
            ...options.activityMonitor
        },
        database: {
            ...SecurityConfig.database,
            ...options.database
        },
        deviceFingerprint: {
            ...SecurityConfig.deviceFingerprint,
            ...options.deviceFingerprint
        },
        api: {
            ...SecurityConfig.api,
            ...options.api
        },
        auth: {
            ...SecurityConfig.auth,
            ...options.auth
        },
        storage: {
            ...SecurityConfig.storage,
            ...options.storage
        }
    }
}

export default SecurityConfig
