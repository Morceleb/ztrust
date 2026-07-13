/**
 * 设备身份服务
 * 负责 device_id 生成/持久化和 device_token 存取
 * device_id 稳定不变，重装 WebView 不丢
 * device_token 由服务端签发，首次登录成功后存入本地
 */

const DEVICE_ID_KEY = 'ztrust_device_id';
const DEVICE_TOKEN_KEY = 'ztrust_device_token';

const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

/**
 * 获取 device_id（稳定标识）
 * 优先从 Rust 侧取（持久化到应用数据目录），兜底 localStorage
 */
export async function getDeviceId() {
    if (isTauri) {
        try {
            const { invoke } = window.__TAURI__.core;
            const id = await invoke('get_device_id');
            if (id) {
                localStorage.setItem(DEVICE_ID_KEY, id);
                return id;
            }
        } catch (e) {
            console.warn('[DeviceService] Rust get_device_id 失败，fallback localStorage:', e);
        }
    }
    // fallback: localStorage
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
        id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(DEVICE_ID_KEY, id);
    }
    return id;
}

/**
 * 获取 device_meta（hostname / cpu / machine_id）
 * 用于上报给 identity 服务端登记设备
 */
export async function getDeviceMeta() {
    if (isTauri) {
        try {
            const { invoke } = window.__TAURI__.core;
            return await invoke('get_device_meta');
        } catch (e) {
            console.warn('[DeviceService] Rust get_device_meta 失败:', e);
        }
    }
    // fallback
    return {
        hostname: window.navigator.userAgent,
        cpu: '',
        machine_id: localStorage.getItem(DEVICE_ID_KEY) || '',
    };
}

/**
 * 保存 device_token（服务端签发的可信设备凭证）
 */
export function saveDeviceToken(token) {
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
}

/**
 * 读取 device_token
 */
export function getDeviceToken() {
    return localStorage.getItem(DEVICE_TOKEN_KEY) || null;
}

/**
 * 清除 device_token（仅在用户主动撤销本设备时调用）
 */
export function clearDeviceToken() {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
}

/**
 * 判断本设备是否已信任（有无 device_token）
 */
export function hasTrustedDevice() {
    return !!getDeviceToken();
}
