import axios from "axios";

const request = axios.create({
    // baseURL 留空或给默认
    timeout: 5000,
    withCredentials: true
});

// 使用请求拦截器动态设置 URL
request.interceptors.request.use(config => {
    const dynamicBase = localStorage.getItem('companyAddress');
    // 如果有动态地址，优先使用；否则使用 Vite Proxy 的 /api
    config.baseURL = dynamicBase || '/api';

    // 确保如果是直接访问 IP 地址，协议是 https
    if (config.baseURL.startsWith('http:')) {
        console.warn('检测到使用了 HTTP 协议，Cookie 可能会失效，建议使用 HTTPS');
    }

    return config;
});

export default request;