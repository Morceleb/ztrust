/**
 * 角色组管理 API
 * 操作表：role_group
 */

import { apiClient, normalizeError } from './axios.js'

export async function listRoleGroups() {
  try {
    const res = await apiClient.get('/policy/admin/role-group/list')
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function getRoleGroupDetail(id) {
  try {
    const res = await apiClient.get(`/policy/admin/role-group/detail/${id}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function saveRoleGroup(data) {
  try {
    const res = await apiClient.post('/policy/admin/role-group/save', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function assignUsersToRoleGroup(data) {
  try {
    const res = await apiClient.post('/policy/admin/role-group/assign-users', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function deleteRoleGroup(id) {
  try {
    const res = await apiClient.delete(`/policy/admin/role-group/delete/${id}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
