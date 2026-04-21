/**
 * 管理员端 SPA 安全码接口（经 Vite 代理到 identity 服务）
 * GET  /identity/admin/spa/users/{userId}/status   - 查询安全码状态
 * POST /identity/admin/spa/users/{userId}/issue
 * POST /identity/admin/spa/users/{userId}/issue?rotate=true
 * POST /identity/admin/spa/users/{userId}/disable
 * POST /identity/admin/spa/users/{userId}/able
 */

import { identityClient, normalizeError } from './axios.js'

/**
 * 查询用户安全码状态
 * @param {string} userId - 用户ID
 * @returns {Promise<number>} 返回 -1:未发放, 0:已禁用, 1:已启用
 */
export async function getSpaStatus(userId) {
  try {
    const res = await identityClient.get(`/admin/spa/users/${encodeURIComponent(userId)}/status`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function issueSpaToken(userId, rotate = false) {
  try {
    const res = await identityClient.post(`/admin/spa/users/${encodeURIComponent(userId)}/issue${rotate ? '?rotate=true' : ''}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function disableSpaToken(userId) {
  try {
    const res = await identityClient.post(`/admin/spa/users/${encodeURIComponent(userId)}/disable`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function enableSpaToken(userId) {
  try {
    const res = await identityClient.post(`/admin/spa/users/${encodeURIComponent(userId)}/able`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
