/**
 * 设备身份服务
 * 负责 device_id 生成/持久化和 device_token 存取
 *
 * device_id 的权威存储：
 *   - Rust 端 Tauri 应用数据目录下的 device_id.txt（app_data_dir/device_id.txt）
 *   - localStorage 里的 ztrust_device_id 只是**只读缓存**，由 Rust 首次拉取后写入
 *   - 前端**不允许**写入 ztrust_device_id；切换设备必须走新的 Rust 命令 reset_device_id
 *
 * device_token 由服务端签发，首次登录成功后存入 localStorage（ztrust_device_token）
 */

const DEVICE_ID_KEY = 'ztrust_device_id';
const DEVICE_TOKEN_KEY = 'ztrust_device_token';

const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

/**
 * 获取 device_id（稳定设备标识）
 *
 * 读取顺序：
 *   1. Tauri Rust 端：invoke('get_device_id') —— 权威
 *      Rust 内部从 app_data_dir/device_id.txt 读，没有就生成新的 64 字符 hex 写入文件
 *   2. localStorage 缓存：仅在 Tauri 不可用时（纯 Web 环境）作为兜底
 *   3. 都不行时，前端生成一个 UUID 作为本地兜底（不会持久化）
 *
 * 历史说明：
 *   - 旧逻辑"先 localStorage 再问 Rust"已被废弃，前端修改 ztrust_device_id 不再生效
 *   - 旧逻辑"先 Rust 再写 localStorage"恢复为唯一权威源
 */
export async function getDeviceId() {
    // 1) Tauri：始终从 Rust 拉取（Rust 是权威，localStorage 只是缓存）
    if (isTauri) {
        try {
            const { invoke } = window.__TAURI__.core;
            const id = await invoke('get_device_id');
            if (id && typeof id === 'string' && id.trim()) {
                localStorage.setItem(DEVICE_ID_KEY, id);
                return id;
            }
        } catch (e) {
            console.warn('[DeviceService] Rust get_device_id 失败, fallback 到 localStorage 缓存:', e);
        }
    }

    // 2) 非 Tauri 或 Rust 失败：localStorage 缓存兜底
    const cached = localStorage.getItem(DEVICE_ID_KEY);
    if (cached && cached.trim()) {
        return cached;
    }

    // 3) 都没有：本地生成一个 64 字符 hex（仅本次会话有效，Tauri 重启后会从 Rust 拉到不同值）
    let generated;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        generated = crypto.randomUUID();
    } else {
        generated = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        try {
            const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(generated.replace(/-/g, '')));
            generated = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (_) { /* fallback to plain */ }
    }
    localStorage.setItem(DEVICE_ID_KEY, generated);
    return generated;
}

/**
 * 注意：已删除 setDeviceId / clearDeviceId
 * device_id 由 Rust 端 device_id.txt 持久化管理，前端不可直接写入
 * 如需切设备：调 invoke('reset_device_id') 重置 Rust 端的 device_id.txt
 */

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
 * 注意：只检查 device_token。device_id 始终由 Rust 提供，不参与"是否需要安全码"的判断。
 */
export function hasTrustedDevice() {
    return !!getDeviceToken();
}

/**
 * 判断 localStorage 里是否有 device_token。
 *
 * 历史：原本同时检查 device_id 和 device_token，现在 device_id 由 Rust 权威提供，
 *   前端无法直接感知，所以此函数只检查 device_token。
 *
 * 用于"打开程序时决定进账号密码页 / 安全码页"：
 *   - 有 device_token → 直接进账号密码页（用户主动登录即可）
 *   - 没有 device_token → 让用户输安全码（首次登录 / 设备被服务端吊销 / 用户主动撤销）
 */
export function hasCompleteDeviceCredentials() {
    const token = localStorage.getItem(DEVICE_TOKEN_KEY);
    return !!(token && token.trim());
}