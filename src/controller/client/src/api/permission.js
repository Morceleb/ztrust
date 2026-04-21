/**
 * 静态权限配置 API
 * 操作表：resource_role_match
 */

import { apiClient, normalizeError } from './axios.js'

export async function listPermissions() {
  try {
    const res = await apiClient.get('/policy/admin/permission/list')
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function grantPermission(data) {
  try {
    const res = await apiClient.post('/policy/admin/permission/grant', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function updatePermission(data) {
  try {
    const res = await apiClient.put('/policy/admin/permission/update', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function deletePermission(data) {
  try {
    const res = await apiClient.delete('/policy/admin/permission/delete', {
      params: {
        role_group_id: data.role_group_id,
        resource_group_id: data.resource_group_id
      }
    })
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
