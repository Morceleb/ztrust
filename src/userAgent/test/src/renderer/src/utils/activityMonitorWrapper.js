/**
 * 行为监控模块 Wrapper
 * 支持浏览器和 Tauri 环境自动切换
 *
 * 问题排查：empty response
 * - 在 Tauri 中，axios 请求会因为跨域或 HTTPS/HTTP 不匹配导致请求失败
 * - 这个文件处理环境检测，但实际的 API 请求问题需要检查 request/index.js
 */

import tauriActivityMonitor from './tauriActivityMonitor.js'

const createNoopMonitor = (label) => ({
    onTimeout: () => { console.log(`[ActivityMonitorWrapper] onTimeout (${label})`); },
    removeAllListeners: () => { console.log(`[ActivityMonitorWrapper] removeAllListeners (${label})`); },
    setLoginState: () => { console.log(`[ActivityMonitorWrapper] setLoginState (${label})`); },
    start: () => { console.log(`[ActivityMonitorWrapper] start (${label})`); },
    stop: () => { console.log(`[ActivityMonitorWrapper] stop (${label})`); },
    init: () => { console.log(`[ActivityMonitorWrapper] init (${label})`); },
    reset: () => { console.log(`[ActivityMonitorWrapper] reset (${label})`); },
    getStatus: () => { console.log(`[ActivityMonitorWrapper] getStatus (${label})`); },
    getStats: () => { console.log(`[ActivityMonitorWrapper] getStats (${label})`); },
    getDeviceInfo: () => { console.log(`[ActivityMonitorWrapper] getDeviceInfo (${label})`); },
    uploadBatch: () => { console.log(`[ActivityMonitorWrapper] uploadBatch (${label})`); },
    bindDevice: () => { console.log(`[ActivityMonitorWrapper] bindDevice (${label})`); },
    performLogout: () => { console.log(`[ActivityMonitorWrapper] performLogout (${label})`); },
    onReport: () => { console.log(`[ActivityMonitorWrapper] onReport (${label})`); },
    onLogout: () => { console.log(`[ActivityMonitorWrapper] onLogout (${label})`); },
    onDeviceInfo: () => { console.log(`[ActivityMonitorWrapper] onDeviceInfo (${label})`); },
})

// 检测是否是 Tauri 环境
const checkIsTauri = () => {
    if (typeof window !== 'undefined' && window.__TAURI__) {
        return true;
    }

    if (typeof window !== 'undefined' && window.location && window.location.protocol === 'tauri:') {
        return true;
    }

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

const activityMonitor = isTauri
    ? tauriActivityMonitor
    : createNoopMonitor('浏览器空实现')

if (isTauri) {
    console.log('[ActivityMonitorWrapper] 使用 Tauri 实现');
} else {
    console.log('[ActivityMonitorWrapper] 使用浏览器实现（空操作）');
}

activityMonitor.isTauri = isTauri;
activityMonitor.checkIsTauri = checkIsTauri;

export default activityMonitor;
