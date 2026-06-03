/**
 * Axios 实例配置
 * 统一管理请求拦截、响应处理和基础配置
 *
 * 所有 /api/policy/admin/** 接口均需携带 JWT Token
 * 拦截器自动注入 Authorization 头，401 时跳转登录页
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

// 清除登录状态并跳转登录页
function clearAuthAndRedirect() {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_nickname')
  localStorage.removeItem('admin_logged_in')
  localStorage.removeItem('admin_username')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ============================
// 请求拦截器：自动注入 Token
// ============================
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ============================
// 响应拦截器：处理 401
// ============================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuthAndRedirect()
    }
    return Promise.reject(error)
  }
)

identityClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

identityClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuthAndRedirect()
    }
    return Promise.reject(error)
  }
)

export { apiClient, identityClient, normalizeError }
