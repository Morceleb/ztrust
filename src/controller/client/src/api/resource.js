/**
 * 资源管理 API
 * 操作表：resource、resource_url
 */

import { apiClient, normalizeError } from './axios.js'

export async function listResources(params) {
  try {
    const res = await apiClient.get('/policy/admin/resource/list', {
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

export async function saveResource(data) {
  try {
    const res = await apiClient.post('/policy/admin/resource/save', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function deleteResource(id) {
  try {
    const res = await apiClient.delete(`/policy/admin/resource/delete/${id}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function listResourceUrls(resourceId) {
  try {
    const res = await apiClient.get('/policy/admin/resource-url/list', {
      params: { resource_id: resourceId }
    })
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function saveResourceUrl(data) {
  try {
    const res = await apiClient.post('/policy/admin/resource-url/save', data)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

export async function deleteResourceUrl(id) {
  try {
    const res = await apiClient.delete(`/policy/admin/resource-url/delete/${id}`)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
