<!-- src/views/LoginPage.vue -->
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'

import './index.css'

import LoginLogo from '@/components/CustomUI/CustomLogo/index.vue'
import LoginInput from '@/components/CustomUI/CustomInput/index.vue'
import LoginButton from '@/components/CustomUI/CustomButton/index.vue'
import LoginDivider from '@/components/CustomUI/CustomDivider/index.vue'
import SocialLogin from '@/components/CustomUI/SocialLogin/index.vue'
import request from '@/utils/request'
import store from '@/store'
import { sendSpaPacket } from '@/utils/spa'

const router = useRouter()

// 步骤控制：'company' | 'login'
const currentStep = ref('company')

// 配置对象 - 支持从后端动态加载
const config = ref({
    logo: { show: true, text: '我的公司', imageUrl: '', showImage: true },
    username: { show: true, label: '用户名', placeholder: '请输入用户名' },
    password: { show: true, label: '密码', placeholder: '请输入密码' },
    loginButton: { show: true, text: '登录' },
    divider: { show: true, text: '' },
    socialLogin: { show: true, providers: ['wechat', 'google'] },
    footerText: '© 2026 我的公司 版权所有',
    reminder: {
        show: true,
        title: '温馨提示',
        content: '为了您的账户安全，请使用公司内部账号登录。如遇登录问题，请联系管理员。'
    }
})

// 公司地址相关
const companyAddress = ref('')
const companyError = ref('')
const isCompanyLoading = ref(false)

// 安全码相关
const securityCode = ref('')
const securityCodeError = ref('')

// 登录表单相关
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const loginError = ref('')

// 表单验证错误
const errors = reactive({
    username: '',
    password: ''
})

// 记住我表单
const rememberMe = ref(false)

// 动态获取密码输入类型
const passwordInputType = computed(() => showPassword.value ? 'text' : 'password')

// 解析地址，提取 host（用于 API 调用）
const extractHost = (address) => {
    let host = address.replace(/^https?:\/\//, '').replace(/\/$/, '')
    // 移除端口
    host = host.replace(/:\d+$/, '')
    return host
}

// 在 Tauri 环境下发送 SPA 报文以打开目标服务器端口
// 该函数为幂等操作：失败仅记录错误，不抛出
const ensureSpaPacketSent = async (rawAddress, securityCodeValue) => {
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    if (!isTauri) return;

    try {
        const parsedHost = extractHost(rawAddress)
        console.log('[Login] 自动发送 SPA 报文以开放端口', { host: parsedHost });

        const deviceInfo = await invoke('get_device_info');
        await sendSpaPacket(
            parsedHost,
            securityCodeValue.trim(),
            deviceInfo.layered.hardware_hash,
            '7f8e3d2a1c9b4e6f5a0d8c2b7e4f1a3c'
        );
        console.log('[Login] SPA 报文自动发送完成');
    } catch (err) {
        console.warn('[Login] SPA 报文自动发送失败（将在登录时重试）:', err);
    }
}

const loadRemoteLoginConfig = async () => {
    try {
        const baseURL = localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL;
        if (!baseURL) return;

        // 提取 host 用于 API 调用
        const apiHost = extractHost(baseURL)
        const res = await fetch(`${apiHost}/api/tenant/login-config`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
            const data = await res.json();
            if (data.config) {
                config.value = { ...config.value, ...data.config };
                console.log('[Login] 登录配置加载成功');
            }
        }
    } catch (err) {
        console.log('[Login] 登录配置加载失败（这可能是正常的）:', err.message);
    }
}

// 加载配置和已保存的公司地址
onMounted(async () => {
    // 检测环境
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    console.log('[Login] 页面加载，环境:', isTauri ? 'Tauri' : 'Browser');

    const savedAddress = localStorage.getItem('companyAddress');
    const savedSecurityCode = localStorage.getItem('securityCode');
    if (savedAddress && savedSecurityCode) {
        companyAddress.value = savedAddress;
        securityCode.value = savedSecurityCode;
        currentStep.value = 'login';
        console.log('[Login] 已加载保存的公司地址:', savedAddress);

        // 恢复已保存的用户名和密码（如果之前勾选了"记住我"）
        const isRememberMe = localStorage.getItem('rememberMe') === 'true';
        if (isRememberMe) {
            const savedUsername = localStorage.getItem('savedUsername');
            const savedPassword = localStorage.getItem('savedPassword');
            if (savedUsername) {
                username.value = savedUsername;
                console.log('[Login] 已恢复保存的用户名');
            }
            if (savedPassword) {
                password.value = savedPassword;
                rememberMe.value = true;
                console.log('[Login] 已恢复保存的密码');
            }
        }

        if (!isTauri) {
            await loadRemoteLoginConfig();
        }
    }
});

// 保存公司地址并切换到登录步骤
const handleCompanySubmit = async () => {
    if (!companyAddress.value.trim()) {
        companyError.value = '请输入公司地址'
        return
    }

    if (!securityCode.value.trim()) {
        securityCodeError.value = '请输入安全码'
        return
    }

    isCompanyLoading.value = true

    // 解析用户输入的地址
    const rawAddress = companyAddress.value.trim()
    let parsedPort = null

    // 检查是否包含端口号（:数字）
    const hostPart = rawAddress.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const portMatch = hostPart.match(/:(\d+)$/)
    if (portMatch) {
        parsedPort = portMatch[1]
    }

    try {
        // 保存到 localStorage（保存完整地址，包括端口）
        localStorage.setItem('companyAddress', rawAddress)
        localStorage.setItem('companyPort', parsedPort || '80')
        localStorage.setItem('securityCode', securityCode.value.trim())

        // 切换到登录步骤
        currentStep.value = 'login'
        await loadRemoteLoginConfig()

    } catch (error) {
        console.error('[Login] 初始化失败:', error);
        companyError.value = `连接失败: ${error.message || error}`;
    } finally {
        isCompanyLoading.value = false
    }
}

const clearCompanyError = () => {
    companyError.value = ''
}

const clearSecurityCodeError = () => {
    securityCodeError.value = ''
}

// 返回修改公司地址
const backToCompany = () => {
    currentStep.value = 'company'
}

// 清除单个字段错误
const clearError = (field) => {
    errors[field] = ''
    loginError.value = ''
}

// 表单验证
const validate = () => {
    let valid = true

    if (!config.value.username?.show) {
        return valid
    }

    if (config.value.username?.show && !username.value.trim()) {
        errors.username = '请输入用户名'
        valid = false
    }
    if (config.value.password?.show && !password.value) {
        errors.password = '请输入密码'
        valid = false
    }
    return valid
}

// 处理登录
const handleLogin = async () => {
    if (!validate()) return

    isLoading.value = true
    loginError.value = ''

    // 检测环境
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    console.log('[Login] 开始登录，环境:', isTauri ? 'Tauri' : 'Browser');
    console.log('[Login] 请求配置:', {
        baseURL: localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL,
        username: username.value
    });

    try {
        // 获取保存的安全码
        const securityCode = localStorage.getItem('securityCode');
        const companyAddress = localStorage.getItem('companyAddress');

        // 在 Tauri 环境下登录前先发送 SPA 报文以打开目标端口（兜底保障）
        if (isTauri && companyAddress && securityCode) {
            await ensureSpaPacketSent(companyAddress, securityCode);
        }

        const response = await request.post('/auth/login', {
            username: username.value,
            password: password.value,
            security_code: securityCode  // 同时发送安全码
        })

        console.log('[Login] 登录响应原始:', JSON.stringify(response));
        console.log('[Login] 响应结构分析:', {
            responseType: typeof response,
            hasData: 'data' in (response || {}),
            responseData: response?.data,
            responseDataKeys: response?.data ? Object.keys(response.data) : [],
            dataDataKeys: response?.data?.data ? Object.keys(response.data.data) : [],
        });

        // 提取 token 和 user
        // 后端返回: { code, message, data: { access_token, refresh_token, expires_in, token_type, user } }
        const rawData = response.data?.data || response.data || {};
        const access_token = rawData.access_token || rawData.token;
        const refresh_token = rawData.refresh_token;
        const user = rawData.user;

        // 如果勾选了"记住我"，保存用户名和密码到 localStorage
        if (rememberMe.value) {
            localStorage.setItem('savedUsername', username.value);
            localStorage.setItem('savedPassword', password.value);
            localStorage.setItem('rememberMe', 'true');
            console.log('[Login] ✓ 已保存用户名和密码');
        } else {
            // 如果没勾选，清除已保存的凭据
            localStorage.removeItem('savedUsername');
            localStorage.removeItem('savedPassword');
            localStorage.removeItem('rememberMe');
        }

        // 保存认证信息到 sessionStorage
        if (access_token) {
            sessionStorage.setItem('auth_token', access_token)
            console.log('[Login] ✓ access_token 已保存，长度:', access_token.length);

            if (isTauri) {
                invoke('save_access_token', { token: access_token }).catch((err) => {
                    console.error('[Login] 保存 access_token 到 Tauri store 失败:', err);
                });
            }
        } else {
            console.error('[Login] ✗ access_token 为空，无法保存！响应结构:', rawData);
        }
        if (refresh_token) {
            sessionStorage.setItem('refresh_token', refresh_token)
            console.log('[Login] ✓ refresh_token 已保存');
        }
        if (user) {
            sessionStorage.setItem('user_info', JSON.stringify(user))
            console.log('[Login] ✓ 用户信息已保存:', user);
        }

        // 登录成功
        await store.dispatch('auth/loginSuccess', user)
        // 用 replace 而非 push，避免后退按钮返回到登录页
        router.replace('/index')
    } catch (err) {
        console.error('[Login] 登录失败:', {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            responseData: err.response?.data,
            isTauri: isTauri
        });

        // 英文消息转中文映射
        const messageMap = {
            // 用户不存在
            'user does not exist': '用户不存在',
            'user not found': '用户不存在',
            'user doesn\'t exist': '用户不存在',
            'user not exist': '用户不存在',
            'no such user': '用户不存在',
            'invalid user': '用户不存在',
            // 用户名或密码错误
            'invalid username or password': '用户名或密码错误',
            'invalid credentials': '用户名或密码错误',
            'invalid username or password: password or code is incorrect': '用户名或密码错误',
            'username or password is incorrect': '用户名或密码错误',
            'incorrect username or password': '用户名或密码错误',
            'wrong username or password': '用户名或密码错误',
            'password is incorrect': '密码错误',
            'password incorrect': '密码错误',
            // 账户状态
            'account is disabled': '账户已被禁用',
            'account disabled': '账户已被禁用',
            'account locked': '账户已被锁定',
            'account is locked': '账户已被锁定',
            'account is inactive': '账户已停用',
            // 登录限制
            'too many login attempts': '登录尝试次数过多',
            'too many failed attempts': '登录失败次数过多',
            'rate limit exceeded': '请求过于频繁，请稍后再试',
            // 授权相关
            'unauthorized': '未授权，请重新登录',
            'access denied': '访问被拒绝',
            'forbidden': '禁止访问',
            'permission denied': '权限不足',
            // Token 相关
            'token is invalid': '登录已过期，请重新登录',
            'token expired': '登录已过期，请重新登录',
            'invalid token': '登录已过期，请重新登录',
            'expired token': '登录已过期，请重新登录',
            'refresh token': '令牌刷新失败',
            // 验证码相关
            'invalid code': '验证码错误',
            'code is incorrect': '验证码错误',
            'incorrect code': '验证码错误',
            'verification code': '验证码错误',
            // 通用错误
            'internal server error': '服务器内部错误，请稍后再试',
            'service unavailable': '服务暂时不可用',
            'bad request': '请求参数错误',
            'validation failed': '数据验证失败'
        };

        // 统一转换为小写进行匹配
        const getChineseMessage = (msg) => {
            if (!msg) return null;
            const lowerMsg = msg.toLowerCase();
            for (const [key, value] of Object.entries(messageMap)) {
                if (lowerMsg.includes(key.toLowerCase())) {
                    // 提取剩余尝试次数
                    const match = msg.match(/(\d+)\s*remaining/i);
                    if (match) {
                        return `${value}，剩余 ${match[1]} 次尝试机会`;
                    }
                    return value;
                }
            }
            return msg; // 未匹配到则返回原始消息
        };

        // 根据 HTTP 状态码返回中文错误提示
        const status = err.response?.status;
        const backendMessage = err.response?.data?.message;

        if (!err.response) {
            // 网络错误 - 通常是 "empty response"
            loginError.value = '网络请求失败，请检查公司地址是否正确配置';
        } else if (status === 401) {
            loginError.value = getChineseMessage(backendMessage) || '用户名或密码错误';
        } else if (status === 403) {
            loginError.value = getChineseMessage(backendMessage) || '账户已被禁用或无访问权限';
        } else if (status === 429) {
            loginError.value = getChineseMessage(backendMessage) || '登录尝试次数过多，请稍后再试';
        } else if (status === 500) {
            loginError.value = backendMessage || '服务器错误，请稍后再试';
        } else {
            loginError.value = getChineseMessage(backendMessage) || '登录失败，请检查用户名和密码';
        }
    } finally {
        isLoading.value = false
    }
}

// 社交登录
const handleSocialClick = (provider) => {
    console.log('第三方登录:', provider)
}

// 处理公司地址输入回车
const handleCompanyKeydown = (e) => {
    if (e.key === 'Enter') {
        handleCompanySubmit()
    }
}

// 处理登录表单回车
const handleLoginKeydown = (e) => {
    if (e.key === 'Enter') {
        handleLogin()
    }
}
</script>

<template>
    <main class="login-container">
        <!-- 左侧温馨提示区域 -->
        <div class="left-content">
            <div v-if="config.reminder?.show" class="reminder">
                <h3 class="reminder-title">{{ config.reminder.title }}</h3>
                <p class="reminder-content">{{ config.reminder.content }}</p>
            </div>
        </div>

        <!-- 右侧登录表单区域 -->
        <div class="login-page">
            <!-- Logo -->
            <LoginLogo v-if="config.logo?.show" :text="config.logo.text" :image-url="config.logo.imageUrl"
                :show-image="config.logo.showImage" />

            <!-- ==================== 步骤一：公司地址输入 ==================== -->
            <div v-if="currentStep === 'company'" class="form-area">
                <div class="form-group" :class="{ 'has-error': companyError }">
                    <label class="form-label">接入地址 / 域名</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                        </div>
                        <input v-model="companyAddress" type="text" class="form-input company-input"
                            placeholder="例如：company.example.com 或 https://company.com" @input="clearCompanyError"
                            @keydown="handleCompanyKeydown" />
                    </div>
                    <p v-if="companyError" class="error-msg">{{ companyError }}</p>
                </div>

                <div class="form-group" :class="{ 'has-error': securityCodeError }">
                    <label class="form-label">安全码</label>
                    <div class="input-wrapper">
                        <div class="input-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <input v-model="securityCode" type="text" class="form-input" placeholder="请输入安全码"
                            @input="clearSecurityCodeError" @keydown="handleCompanyKeydown" />
                    </div>
                    <p v-if="securityCodeError" class="error-msg">{{ securityCodeError }}</p>
                </div>

                <!-- 加载动画替代按钮 -->
                <div v-if="isCompanyLoading" class="login-btn loading">
                    <span class="loading-dots">
                        <span></span><span></span><span></span>
                    </span>
                </div>
                <LoginButton v-else-if="config.loginButton?.show" text="下一步" @click="handleCompanySubmit" />
            </div>

            <!-- ==================== 步骤二：用户登录表单 ==================== -->
            <div v-else class="form-area">
                <!-- 返回修改公司地址 -->
                <button class="back-btn" @click="backToCompany">
                    ← 返回修改接入地址
                </button>

                <p class="login-subtitle">
                    正在登录：{{ companyAddress }}
                </p>

                <!-- 输入框区域 -->
                <LoginInput v-if="config.username?.show" v-model="username" :label="config.username.label"
                    :placeholder="config.username.placeholder" @input="clearError('username')"
                    @keydown="handleLoginKeydown" />

                <!-- 密码输入（带显示/隐藏切换） -->
                <div v-if="config.password?.show" class="input-group" :class="{ 'has-error': errors.password }">
                    <label>{{ config.password.label }}</label>
                    <div class="input-wrapper">
                        <input :type="passwordInputType" v-model="password" :placeholder="config.password.placeholder"
                            class="form-input" @input="clearError('password')" @keydown="handleLoginKeydown" />
                        <button type="button" class="input-toggle" @click="showPassword = !showPassword" tabindex="-1">
                            <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                stroke-linecap="round" stroke-linejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path
                                    d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </svg>
                        </button>
                    </div>
                    <p v-if="errors.password" class="error-msg">{{ errors.password }}</p>
                </div>

                <!-- 记住我 -->
                <div class="form-options">
                    <label class="checkbox-label">
                        <input type="checkbox" v-model="rememberMe" class="checkbox-input" />
                        <span class="checkbox-custom"></span>
                        <span class="checkbox-text">记住我</span>
                    </label>
                    <a href="#" class="forgot-link" @click.prevent>忘记密码?</a>
                </div>

                <!-- 错误提示 -->
                <Transition name="alert-slide">
                    <div v-if="loginError" class="login-error-alert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{{ loginError }}</span>
                    </div>
                </Transition>

                <!-- 加载状态按钮 -->
                <div v-if="isLoading" class="login-btn loading">
                    <span class="loading-dots">
                        <span></span><span></span><span></span>
                    </span>
                </div>
                <LoginButton v-else-if="config.loginButton?.show" :text="config.loginButton.text"
                    @click="handleLogin" />

                <!-- 分割线 -->
                <LoginDivider v-if="config.divider?.show" :text="config.divider.text" />

                <!-- 社交登录 -->
                <SocialLogin v-if="config.socialLogin?.show" :providers="config.socialLogin.providers"
                    @social-click="handleSocialClick" />
            </div>

            <!-- 当没有输入框时显示占位图 -->
            <img v-if="!config.username?.show && !config.password?.show && currentStep === 'login'"
                src="@/assets/placeholder-form.png" class="form-placeholder" alt="表单占位图" />

            <!-- 页脚 -->
            <div v-if="config.footerText" class="footer">
                {{ config.footerText }}
            </div>
        </div>
    </main>
</template>
