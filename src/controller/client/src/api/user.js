/**
 * 用户管理 API
 * 操作表：user
 */

import { apiClient, normalizeError } from './axios.js'

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
    const res = await apiClient.post(`/policy/admin/users/${encodeURIComponent(userId)}/issue${rotate ? '?rotate=true' : ''}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function disableSpaToken(userId) {
  try {
    const res = await apiClient.post(`/policy/admin/users/${encodeURIComponent(userId)}/disable`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function enableSpaToken(userId) {
  try {
    const res = await apiClient.post(`/policy/admin/users/${encodeURIComponent(userId)}/able`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
