/**
 * Axios 实例配置
 * 统一管理请求拦截、响应处理和基础配置
 *
 * 所有 /api/policy/admin/** 接口通过 HttpOnly Cookie 携带 Token（浏览器自动管理）
 * 拦截器负责处理 401 响应（跳转登录页）
 */

import axios from 'axios'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  // 允许跨域请求携带 Cookie（后端通过 Set-Cookie 设置 HttpOnly Cookie）
  withCredentials: true
})

const identityClient = axios.create({
  baseURL: '/identity',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
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

// 清除本地登录状态并跳转登录页
function clearAuthAndRedirect() {
  localStorage.removeItem('admin_nickname')
  localStorage.removeItem('admin_logged_in')
  localStorage.removeItem('admin_username')
  localStorage.removeItem('admin_remember_me')
  localStorage.removeItem('admin_id')
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// ============================
// 响应拦截器：处理 401（Cookie 失效/未登录）
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
