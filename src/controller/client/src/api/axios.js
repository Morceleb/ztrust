/**
 * Axios 实例配置
 * 统一管理请求拦截、响应处理和基础配置
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

const identityClient = axios.create({
  baseURL: '/identity',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 统一错误处理：将 axios 错误转换为与原 fetch+readBody 一致的 { code, message, data } 结构
function normalizeError(err) {
  if (err.response) {
    const { status, data } = err.response
    if (data && typeof data === 'object' && 'code' in data) {
      return data
    }
    return { code: status, message: data || `请求失败 (${status})`, data: null }
  }
  if (err.request) {
    return { code: -1, message: '网络错误，请检查网络或后端服务', data: null }
  }
  return { code: -1, message: err.message || '请求异常', data: null }
}

export { apiClient, identityClient, normalizeError }
