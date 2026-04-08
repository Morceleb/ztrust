/**
 * 管理员端 SPA 安全码接口（经 Vite 代理到 identity 服务）
 * POST /identity/admin/spa/users/{userId}/issue
 * POST /identity/admin/spa/users/{userId}/issue?rotate=true
 * POST /identity/admin/spa/users/{userId}/disable
 * POST /identity/admin/spa/users/{userId}/able
 */

import { identityClient, normalizeError } from './axios.js'

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
