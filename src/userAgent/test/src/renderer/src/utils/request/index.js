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

    // 如果是完整 URL（带协议）
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            new URL(trimmed);
            return true;
        } catch {
            return false;
        }
    }

    // 支持不带协议的域名/IP + 端口
    // 域名格式: example.com:8080
    if (/^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:\d+)?$/.test(trimmed)) {
        return true;
    }
    // IP + 端口格式: 192.168.1.1:8080 或 192.168.1.1
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(trimmed)) {
        return true;
    }
    return false;
};

// 提取 host 和 port（从 URL 或 host:port 格式）
const extractHostAndPort = (url) => {
    if (!url) return { host: '', port: '' };
    let host = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    let port = '80'; // 默认端口

    const portMatch = host.match(/:(\d+)$/);
    if (portMatch) {
        port = portMatch[1];
        host = host.replace(/:\d+$/, '');
    }

    return { host, port };
};

// 获取完整 baseURL（host:port）
const getBaseURL = () => {
    // 1. 首先尝试环境变量
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

// 从 localStorage 地址提取带端口的 baseURL
const getBaseURLFromStorage = (url) => {
    if (!url) return '';
    const { host, port } = extractHostAndPort(url);
    return `http://${host}:${port}`;
};

// 从环境变量提取带端口的 baseURL
const getBaseURLFromEnv = (url) => {
    if (!url) return '';
    // 如果已有协议，直接返回
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    const { host, port } = extractHostAndPort(url);
    return `http://${host}:${port}`;
};

// 提取纯 host（移除协议和端口，用于 SPA 发送）
const extractHostOnly = (url) => {
    if (!url) return '';
    const { host } = extractHostAndPort(url);
    return host;
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

        // 确定要使用的 baseURL
        let finalBaseURL = '';
        if (isValidBaseURL(currentBaseURL)) {
            finalBaseURL = getBaseURLFromStorage(currentBaseURL);
        } else if (isValidBaseURL(envBaseURL)) {
            finalBaseURL = getBaseURLFromEnv(envBaseURL);
        }

        config.baseURL = finalBaseURL;

        // 添加认证 Token
        const token = sessionStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // 添加请求时间戳
        config.headers['X-Request-Time'] = Date.now();

        // 获取公司地址作为租户 ID（保存完整地址）
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
