/**
 * 密钥库服务 - 使用 Windows 凭据管理器存储敏感数据
 * 安全码、用户名、密码都存储在系统密钥库中，不再存储在 localStorage
 */

import { setPassword, getPassword as kringGet, deletePassword } from 'tauri-plugin-keyring-api';

const SERVICE = 'ztrust-client';

export const KeyringKeys = {
    SECURITY_CODE: 'security_code',
    USERNAME: 'username',
    PASSWORD: 'password',
};

/**
 * 保存敏感数据到密钥库
 */
async function storeToKeyring(key, value) {
    try {
        await setPassword(SERVICE, key, value);
        console.log(`[Keyring] 已保存: ${key}`);
        return true;
    } catch (err) {
        console.error(`[Keyring] 保存失败 (${key}):`, err);
        return false;
    }
}

/**
 * 从密钥库读取敏感数据
 */
async function readFromKeyring(key) {
    try {
        const value = await kringGet(SERVICE, key);
        if (value) {
            console.log(`[Keyring] 已读取: ${key}`);
        }
        return value;
    } catch (err) {
        console.error(`[Keyring] 读取失败 (${key}):`, err);
        return null;
    }
}

/**
 * 从密钥库删除敏感数据
 */
async function deleteFromKeyring(key) {
    try {
        await deletePassword(SERVICE, key);
        console.log(`[Keyring] 已删除: ${key}`);
        return true;
    } catch (err) {
        console.error(`[Keyring] 删除失败 (${key}):`, err);
        return false;
    }
}

/**
 * 保存安全码到密钥库
 */
export async function saveSecurityCode(securityCode) {
    return await storeToKeyring(KeyringKeys.SECURITY_CODE, securityCode);
}

/**
 * 读取安全码
 */
export async function getSecurityCode() {
    return await readFromKeyring(KeyringKeys.SECURITY_CODE);
}

/**
 * 删除安全码
 */
export async function deleteSecurityCode() {
    return await deleteFromKeyring(KeyringKeys.SECURITY_CODE);
}

/**
 * 保存用户名（记住我）
 */
export async function saveUsername(username) {
    return await storeToKeyring(KeyringKeys.USERNAME, username);
}

/**
 * 读取用户名
 */
export async function getUsername() {
    return await readFromKeyring(KeyringKeys.USERNAME);
}

/**
 * 保存密码（记住我）
 */
export async function savePassword(password) {
    return await storeToKeyring(KeyringKeys.PASSWORD, password);
}

/**
 * 读取密码
 */
export async function getPassword() {
    return await readFromKeyring(KeyringKeys.PASSWORD);
}

/**
 * 清除所有记住的凭据（用户名、密码，但不删除安全码，安全码在退出登录后仍然保留供下次登录使用）
 */
export async function clearAllCredentials() {
    await Promise.all([
        deleteFromKeyring(KeyringKeys.USERNAME),
        deleteFromKeyring(KeyringKeys.PASSWORD),
    ]);
}

/**
 * 检查是否有保存的安全码
 */
export async function hasSecurityCode() {
    const code = await getSecurityCode();
    return code !== null && code !== undefined;
}

/**
 * 检查是否有记住的用户名
 */
export async function hasUsername() {
    const username = await getUsername();
    return username !== null && username !== undefined;
}

/**
 * 清除 localStorage 中的敏感数据（向后兼容，清理旧数据）
 */
export function clearLocalStorageCredentials() {
    localStorage.removeItem('securityCode');
    localStorage.removeItem('savedUsername');
    localStorage.removeItem('savedPassword');
    localStorage.removeItem('rememberMe');
    console.log('[Keyring] localStorage 敏感数据已清理');
}

/**
 * 通用密钥库删除（供其他地方使用）
 */
export async function keyringDelete(key) {
    return await deleteFromKeyring(key);
}
