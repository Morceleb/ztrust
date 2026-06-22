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
