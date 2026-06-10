/**
 * API 请求工具
 * 基于 axios 封装，支持拦截器和错误处理
 * 支持浏览器和 Tauri 环境自动适配
 */

import axios from 'axios';
import SecurityConfig from '@/config/security';

// 检测是否是 Tauri 环境
const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;

// 无效的 baseURL 占位符列表
const INVALID_BASE_URLS = [
    'https://your-production-server.com',
    'http://your-production-server.com',
    'your-production-server.com',
    'https://example.com',
    'http://localhost:8080', // 开发环境默认值，不应该在生产中使用
];

// 检查 baseURL 是否有效
const isValidBaseURL = (url) => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!trimmed) return false;
    if (INVALID_BASE_URLS.includes(trimmed)) return false;
    // 检查是否看起来像有效的 URL
    try {
        new URL(trimmed);
        return true;
    } catch {
        // 如果不是完整 URL，但看起来像域名也可以
        return /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/.test(trimmed);
    }
};

// 获取 API 基础 URL
// 优先级：1. 环境变量（必须是有效的） 2. localStorage.companyAddress 3. 空字符串
const getBaseURL = () => {
    // 1. 首先尝试环境变量（只接受有效的）
    const envBaseURL = import.meta.env.VITE_API_BASE_URL;
    if (isValidBaseURL(envBaseURL)) {
        console.log('[Request] 使用环境变量 baseURL:', envBaseURL);
        return envBaseURL;
    }

    // 2. 回退到 localStorage
    const storedAddress = localStorage.getItem('companyAddress');
    if (isValidBaseURL(storedAddress)) {
        console.log('[Request] 使用 localStorage baseURL:', storedAddress);
        return storedAddress;
    }

    // 3. 如果都没有，返回空字符串
    console.log('[Request] 无有效的 baseURL 配置');
    return '';
};

const request = axios.create({
    baseURL: getBaseURL(),
    timeout: SecurityConfig.api.timeout,
    withCredentials: true, // 关键：允许携带跨域 Cookie（HttpOnly Cookie）
    headers: {
        'Content-Type': 'application/json',
    },
});

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        // 动态更新 baseURL（处理用户输入新的公司地址）
        const currentBaseURL = localStorage.getItem('companyAddress');
        const envBaseURL = import.meta.env.VITE_API_BASE_URL;

        // 使用有效的 baseURL
        if (isValidBaseURL(currentBaseURL)) {
            config.baseURL = currentBaseURL;
        } else if (isValidBaseURL(envBaseURL)) {
            config.baseURL = envBaseURL;
        }

        // 添加认证 Token
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        config.headers['X-Request-Time'] = Date.now();

        // 获取公司地址作为租户 ID
        const companyAddress = currentBaseURL || envBaseURL;
        if (companyAddress) {
            config.headers['X-Tenant-ID'] = companyAddress;
        }

        console.log('[Request] 发送请求:', {
            method: config.method,
            url: config.url,
            baseURL: config.baseURL || '(无)',
            hasToken: !!token
        });

        return config;
    },
    (error) => {
        console.error('[Request] 请求配置错误:', error);
        return Promise.reject(error);
    }
);

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        console.log('[Request] 响应成功:', {
            status: response.status,
            url: response.config?.url,
        });
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // 详细记录错误信息
        console.error('[Request] 响应错误:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: originalRequest?.url,
            baseURL: originalRequest?.baseURL,
            message: error.message,
            code: error.code,
            isTauri: isTauri,
        });

        // 处理网络错误（这通常是 "empty response" 的原因）
        if (!error.response) {
            console.error('[Request] 网络错误/无响应 (Empty Response):', {
                message: error.message,
                code: error.code,
                url: originalRequest?.url,
                baseURL: originalRequest?.baseURL,
            });

            // 在 Tauri 环境中，添加额外的诊断信息
            if (isTauri) {
                console.error('[Request] Tauri 环境诊断:');
                console.error('  - window.__TAURI__ 存在:', typeof window.__TAURI__ !== 'undefined');
                console.error('  - 当前 baseURL:', originalRequest?.baseURL);
                console.error('  - localStorage.companyAddress:', localStorage.getItem('companyAddress'));
            }
        }

        // 处理 401 未授权
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            console.log('[Request] 检测到 401，清除认证信息并跳转登录页');

            // 清除认证信息
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user_info');

            // 使用 Vue Router 跳转，避免 window.location.href 导致页面刷新问题
            if (window.__VUE_APP__) {
                window.__VUE_APP__.push('/login');
            } else {
                setTimeout(() => {
                    window.location.href = '/login';
                }, 100);
            }
        }

        // 处理 403 禁止访问
        if (error.response?.status === 403) {
            console.error('[Request] 访问被拒绝:', error.response?.data?.message);
        }

        return Promise.reject(error);
    }
);

// GET 请求
export const get = (url, params = {}, config = {}) => {
    return request.get(url, { params, ...config });
};

// POST 请求
export const post = (url, data = {}, config = {}) => {
    return request.post(url, data, { ...config });
};

// PUT 请求
export const put = (url, data = {}, config = {}) => {
    return request.put(url, data, { ...config });
};

// DELETE 请求
export const del = (url, params = {}, config = {}) => {
    return request.delete(url, { params, ...config });
};

// PATCH 请求
export const patch = (url, data = {}, config = {}) => {
    return request.patch(url, data, { ...config });
};

export default request;
