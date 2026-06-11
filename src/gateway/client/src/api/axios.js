import axios from 'axios'
import { clearAdminSession } from '@/utils/authStorage.js'

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
})

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

function clearAuthAndRedirect() {
  clearAdminSession()
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      clearAuthAndRedirect()
    }
    return Promise.reject(error)
  }
)

export { apiClient, normalizeError, clearAuthAndRedirect }
