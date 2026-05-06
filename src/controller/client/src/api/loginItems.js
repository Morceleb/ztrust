/**
 * 登录页配置 API
 * 操作接口：/api/config/login-items
 */

import { apiClient, normalizeError } from './axios.js'

/**
 * 获取登录项配置
 */
export async function getLoginItems() {
  try {
    const res = await apiClient.get('/config/login-items')
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}

/**
 * 保存登录项配置
 * @param {Array} items - 登录项数组
 */
export async function saveLoginItems(items) {
  try {
    const res = await apiClient.post('/config/login-items', items)
    return res.data
  } catch (err) {
    return normalizeError(err)
  }
}
