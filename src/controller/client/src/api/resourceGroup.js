/**
 * 资源组管理 API
 * 操作表：resource_group、resource_group_match
 */

import { apiClient, normalizeError } from './axios.js'

export async function listResourceGroups() {
  try {
    const res = await apiClient.get('/policy/admin/resource-group/list')
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function saveResourceGroup(data) {
  try {
    const res = await apiClient.post('/policy/admin/resource-group/save', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function bindResourcesToGroup(data) {
  try {
    const res = await apiClient.post('/policy/admin/resource-group/bind-resources', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function deleteResourceGroup(id) {
  try {
    const res = await apiClient.delete(`/policy/admin/resource-group/delete/${id}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
