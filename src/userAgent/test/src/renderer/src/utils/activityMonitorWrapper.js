/**
 * 行为监控模块 Wrapper
 * 支持浏览器和 Tauri 环境自动切换
 * 
 * 问题排查：empty response
 * - 在 Tauri 中，axios 请求会因为跨域或 HTTPS/HTTP 不匹配导致请求失败
 * - 这个文件处理环境检测，但实际的 API 请求问题需要检查 request/index.js
 */

let activityMonitor;

// 检测是否是 Tauri 环境
const checkIsTauri = () => {
    // 方法1: 检查 window.__TAURI__
    if (typeof window !== 'undefined' && window.__TAURI__) {
        return true;
    }
    
    // 方法2: 检查 URL 协议
    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'tauri:') {
        return true;
    }
    
    // 方法3: 检查 userAgent
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
        const ua = navigator.userAgent.toLowerCase();
        if (ua.includes('android') || ua.includes('linux')) {
            // Tauri 在某些平台上可能不会设置 __TAURI__
            // 这里需要更智能的检测
        }
    }
    
    return false;
};

const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

console.log('[ActivityMonitorWrapper] 环境检测:', {
    isTauri: isTauri,
    hasWindow: typeof window !== 'undefined',
    hasTAURI: typeof window?.__TAURI__ !== 'undefined',
    location: typeof window?.location !== 'undefined' ? window.location.href : 'N/A',
    protocol: typeof window?.location !== 'undefined' ? window.location.protocol : 'N/A',
});

if (isTauri) {
    // Tauri 环境
    console.log('[ActivityMonitorWrapper] 使用 Tauri 实现');
    try {
        // 动态导入 Tauri 实现
        activityMonitor = require('./tauriActivityMonitor.js').default;
        console.log('[ActivityMonitorWrapper] Tauri 监控模块加载成功');
    } catch (e) {
        console.error('[ActivityMonitorWrapper] Tauri 监控模块加载失败:', e);
        // 回退到空实现
        activityMonitor = {
            onTimeout: () => { console.log('[ActivityMonitorWrapper] onTimeout (空实现)'); },
            removeAllListeners: () => { console.log('[ActivityMonitorWrapper] removeAllListeners (空实现)'); },
            setLoginState: () => { console.log('[ActivityMonitorWrapper] setLoginState (空实现)'); },
            start: () => { console.log('[ActivityMonitorWrapper] start (空实现)'); },
            stop: () => { console.log('[ActivityMonitorWrapper] stop (空实现)'); },
            init: () => { console.log('[ActivityMonitorWrapper] init (空实现)'); },
            reset: () => { console.log('[ActivityMonitorWrapper] reset (空实现)'); },
            getStatus: () => { console.log('[ActivityMonitorWrapper] getStatus (空实现)'); },
            getStats: () => { console.log('[ActivityMonitorWrapper] getStats (空实现)'); },
            getDeviceInfo: () => { console.log('[ActivityMonitorWrapper] getDeviceInfo (空实现)'); },
            uploadBatch: () => { console.log('[ActivityMonitorWrapper] uploadBatch (空实现)'); },
            bindDevice: () => { console.log('[ActivityMonitorWrapper] bindDevice (空实现)'); },
            performLogout: () => { console.log('[ActivityMonitorWrapper] performLogout (空实现)'); },
            onReport: () => { console.log('[ActivityMonitorWrapper] onReport (空实现)'); },
            onLogout: () => { console.log('[ActivityMonitorWrapper] onLogout (空实现)'); },
            onDeviceInfo: () => { console.log('[ActivityMonitorWrapper] onDeviceInfo (空实现)'); },
        };
    }
} else {
    // 浏览器环境 - 使用空实现
    console.log('[ActivityMonitorWrapper] 使用浏览器实现（空操作）');
    activityMonitor = {
        onTimeout: () => { console.log('[ActivityMonitorWrapper] onTimeout (浏览器空实现)'); },
        removeAllListeners: () => { console.log('[ActivityMonitorWrapper] removeAllListeners (浏览器空实现)'); },
        setLoginState: () => { console.log('[ActivityMonitorWrapper] setLoginState (浏览器空实现)'); },
        start: () => { console.log('[ActivityMonitorWrapper] start (浏览器空实现)'); },
        stop: () => { console.log('[ActivityMonitorWrapper] stop (浏览器空实现)'); },
        init: () => { console.log('[ActivityMonitorWrapper] init (浏览器空实现)'); },
        reset: () => { console.log('[ActivityMonitorWrapper] reset (浏览器空实现)'); },
        getStatus: () => { console.log('[ActivityMonitorWrapper] getStatus (浏览器空实现)'); },
        getStats: () => { console.log('[ActivityMonitorWrapper] getStats (浏览器空实现)'); },
        getDeviceInfo: () => { console.log('[ActivityMonitorWrapper] getDeviceInfo (浏览器空实现)'); },
        uploadBatch: () => { console.log('[ActivityMonitorWrapper] uploadBatch (浏览器空实现)'); },
        bindDevice: () => { console.log('[ActivityMonitorWrapper] bindDevice (浏览器空实现)'); },
        performLogout: () => { console.log('[ActivityMonitorWrapper] performLogout (浏览器空实现)'); },
        onReport: () => { console.log('[ActivityMonitorWrapper] onReport (浏览器空实现)'); },
        onLogout: () => { console.log('[ActivityMonitorWrapper] onLogout (浏览器空实现)'); },
        onDeviceInfo: () => { console.log('[ActivityMonitorWrapper] onDeviceInfo (浏览器空实现)'); },
    };
}

// 导出环境检测函数，供其他模块使用
activityMonitor.isTauri = isTauri;
activityMonitor.checkIsTauri = checkIsTauri;

export default activityMonitor;
