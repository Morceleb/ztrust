/**
 * 会话凭证管理
 *
 * 字段约定（与 8900 服务端严格对齐）：
 *   - session_id      服务端 /auth/login 响应里返回，必须本地持久化
 *   - auth_strength   登录方式：'password' | 'password+security_code'
 *   - device_id       设备唯一 ID（由 Rust 权威提供，前端只读缓存）
 *
 * 存储位置：
 *   - sessionStorage —— 会话级敏感信息（access_token / refresh_token / user_info）
 *   - localStorage   —— 跨会话持久信息（session_id / auth_strength / device_id）
 *
 * 关键约束：
 *   - device_id 不再使用 `node-machine-id`，由 Rust 通过 device_id.txt 持久化提供权威值
 *   - 前端调用 getDeviceId() 时优先 invoke('get_device_id')，只在 Rust 不可用时 fallback
 *     到 localStorage 缓存
 */

const KEY_SESSION_ID = 'ztrust.session_id';
const KEY_AUTH_STRENGTH = 'ztrust.auth_strength';

/**
 * 登录响应体（与服务端约定保持一致）
 */
export const KEY_DEVICE_ID = 'ztrust_device_id';

/**
 * 写入登录响应凭证
 * @param {object} loginResp 来自 /auth/login 的响应数据
 */
export function saveSession(loginResp) {
    if (!loginResp || typeof loginResp !== 'object') return;

    if (loginResp.session_id) {
        localStorage.setItem(KEY_SESSION_ID, String(loginResp.session_id));
        console.log('[Auth] session_id 已保存');
    }

    if (loginResp.auth_strength) {
        localStorage.setItem(KEY_AUTH_STRENGTH, String(loginResp.auth_strength));
    }

    if (loginResp.device_id) {
        localStorage.setItem(KEY_DEVICE_ID, String(loginResp.device_id));
    }
}

/**
 * 读取 session_id（供 HTTP 拦截器 / 上报打点使用）
 * @returns {string|null}
 */
export function getSessionId() {
    return localStorage.getItem(KEY_SESSION_ID);
}

/**
 * 读取登录强度
 * @returns {'password'|'password+security_code'|null}
 */
export function getAuthStrength() {
    return localStorage.getItem(KEY_AUTH_STRENGTH);
}

/**
 * 清除会话凭证（登出时调用）
 * 注意：device_id / device_token 保留（设备级凭证不与会话绑定）
 */
export function clearSession() {
    localStorage.removeItem(KEY_SESSION_ID);
    localStorage.removeItem(KEY_AUTH_STRENGTH);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user_info');
}

/**
 * 读取 device_id（localStorage 缓存兜底）
 * 真实场景下应使用 deviceService.getDeviceId()，它会优先调用 Rust
 */
export function getCachedDeviceId() {
    return localStorage.getItem(KEY_DEVICE_ID);
}
