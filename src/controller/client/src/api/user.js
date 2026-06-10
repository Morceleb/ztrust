/**
 * 用户管理 API
 * 操作表：user
 */

import { apiClient, identityClient, normalizeError } from './axios.js'

export async function listUsers(params) {
  try {
    const res = await apiClient.get('/policy/admin/users/list', {
      params: {
        page: params.page,
        pageSize: params.pageSize,
        ...(params.keyword ? { keyword: params.keyword } : {})
      }
    })
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

/**
 * 保存用户（新增/编辑）
 * @param {Object} userData - 用户数据
 * @param {string} [userData.id] - 用户ID（编辑时必填，新增时不传）
 * @param {string} userData.name - 用户名（登录名）
 * @param {string} userData.displayName - 显示名称
 * @param {string} [userData.password] - 密码（新增时必填，编辑时不传保持原密码）
 * @param {string} [userData.email] - 邮箱
 * @param {string} [userData.phone] - 手机号
 * @param {string} [userData.avatar] - 头像URL
 * @param {string} [userData.affiliation] - 部门
 */
export async function saveUser(userData) {
  try {
    const res = await apiClient.post('/policy/admin/users/save', userData)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function deleteUser(userId) {
  try {
    const res = await apiClient.delete(`/policy/admin/users/${encodeURIComponent(userId)}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
