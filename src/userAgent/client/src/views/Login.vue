<template>
    <div class="login-page">
        <!-- 全屏背景品牌区 -->
        <div class="login-brand">
            <div class="brand-content">
                <div class="brand-logo">
                    <div class="brand-logo-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <span class="brand-name">XXX</span>
                </div>
                <div class="brand-tagline">
                    <h1 class="brand-title">零信任安全访问平台</h1>
                    <p class="brand-desc">安全、高效地管理您的资源访问权限，保障企业数据安全</p>
                </div>
                <div class="brand-features">
                    <div class="feature-item">
                        <div class="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                            </svg>
                        </div>
                        <span>端到端加密传输</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <span>多因素身份认证</span>
                    </div>
                    <div class="feature-item">
                        <div class="feature-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <polyline points="12 6 12 12 16 14"/>
                            </svg>
                        </div>
                        <span>实时行为监控审计</span>
                    </div>
                </div>
            </div>
            <!-- 装饰背景图形 -->
            <div class="brand-decoration">
                <div class="deco-circle deco-circle-1"></div>
                <div class="deco-circle deco-circle-2"></div>
                <div class="deco-circle deco-circle-3"></div>
            </div>
        </div>

        <!-- 居中登录表单卡片 -->
        <div class="login-form-panel">
            <div class="login-form-wrapper">
                <div class="login-form-header">
                    <h2 class="form-title">欢迎回来</h2>
                    <p class="form-subtitle">请登录您的账号以继续访问</p>
                </div>

                <form class="login-form" @submit.prevent="handleLogin">
                    <!-- 用户名 -->
                    <div class="form-group" :class="{ 'has-error': errors.username }">
                        <label class="form-label">用户名</label>
                        <div class="input-wrapper">
                            <div class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                    <circle cx="12" cy="7" r="4"/>
                                </svg>
                            </div>
                            <input
                                v-model="form.username"
                                type="text"
                                class="form-input"
                                placeholder="请输入用户名"
                                autocomplete="username"
                                @input="clearError('username')"
                            />
                        </div>
                        <p v-if="errors.username" class="error-msg">{{ errors.username }}</p>
                    </div>

                    <!-- 密码 -->
                    <div class="form-group" :class="{ 'has-error': errors.password }">
                        <label class="form-label">密码</label>
                        <div class="input-wrapper">
                            <div class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                </svg>
                            </div>
                            <input
                                v-model="form.password"
                                :type="showPassword ? 'text' : 'password'"
                                class="form-input"
                                placeholder="请输入密码"
                                autocomplete="current-password"
                                @input="clearError('password')"
                            />
                            <button type="button" class="input-toggle" @click="showPassword = !showPassword" tabindex="-1">
                                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                            </button>
                        </div>
                        <p v-if="errors.password" class="error-msg">{{ errors.password }}</p>
                    </div>

                    <!-- 记住我 & 忘记密码 -->
                    <div class="form-options">
                        <label class="checkbox-label">
                            <input type="checkbox" v-model="form.rememberMe" class="checkbox-input" />
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
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
                            </svg>
                            <span>{{ loginError }}</span>
                        </div>
                    </Transition>

                    <!-- 登录按钮 -->
                    <button type="submit" class="login-btn" :class="{ loading: isLoading }" :disabled="isLoading">
                        <span v-if="!isLoading">登 录</span>
                        <span v-else class="loading-dots">
                            <span></span><span></span><span></span>
                        </span>
                    </button>
                </form>

                <div class="login-footer">
                    <span>© 2025 XXX 零信任平台. All rights reserved.</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = reactive({
    username: '',
    password: '',
    rememberMe: false,
})

const errors = reactive({
    username: '',
    password: '',
})

const showPassword = ref(false)
const isLoading = ref(false)
const loginError = ref('')

const clearError = (field) => {
    errors[field] = ''
    loginError.value = ''
}

const validate = () => {
    let valid = true
    if (!form.username.trim()) {
        errors.username = '请输入用户名'
        valid = false
    }
    if (!form.password) {
        errors.password = '请输入密码'
        valid = false
    }
    return valid
}

const handleLogin = async () => {
    if (!validate()) return

    isLoading.value = true
    loginError.value = ''

    try {
        // TODO: 接入后端登录接口，示例：
        // const res = await axios.post('/api/login', { username: form.username, password: form.password })
        // localStorage.setItem('token', res.data.token)

        // 前端模拟：登录成功后跳转首页
        await new Promise(resolve => setTimeout(resolve, 800))
        router.push('/')
    } catch (err) {
        loginError.value = err?.response?.data?.message || '用户名或密码错误，请重试'
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
.login-page {
    position: relative;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    font-family: -apple-system, BlinkMacOSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* ── 全屏背景品牌区 ── */
.login-brand {
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, #2d3a50 0%, #36435b 50%, #3d5068 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.brand-content {
    position: relative;
    z-index: 2;
    padding: 48px;
    max-width: 480px;
}

.brand-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 48px;
}

.brand-logo-icon {
    width: 48px;
    height: 48px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    backdrop-filter: blur(4px);
}

.brand-name {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.5px;
}

.brand-tagline {
    margin-bottom: 40px;
}

.brand-title {
    font-size: 30px;
    font-weight: 700;
    color: #fff;
    margin: 0 0 12px 0;
    line-height: 1.3;
}

.brand-desc {
    font-size: 15px;
    color: rgba(255, 255, 255, 0.65);
    margin: 0;
    line-height: 1.7;
}

.brand-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
}

.feature-icon {
    width: 32px;
    height: 32px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.9);
}

/* 装饰圆形 */
.brand-decoration {
    position: absolute;
    inset: 0;
    pointer-events: none;
}

.deco-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.deco-circle-1 {
    width: 400px;
    height: 400px;
    bottom: -120px;
    right: -80px;
}

.deco-circle-2 {
    width: 250px;
    height: 250px;
    top: -60px;
    right: 60px;
}

.deco-circle-3 {
    width: 160px;
    height: 160px;
    bottom: 80px;
    left: -40px;
}

/* ── 居中表单卡片 ── */
.login-form-panel {
    position: relative;
    z-index: 10;
    width: 420px;
    background: #f8fafc;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 40px;
    overflow-y: auto;
    max-height: 90vh;
}

.login-form-wrapper {
    width: 100%;
    max-width: 340px;
    margin-left: auto;
    margin-right: auto;
}

.login-form-header {
    margin-bottom: 32px;
}

.form-title {
    font-size: 26px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.form-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

/* ── 表单控件 ── */
.form-group {
    margin-bottom: 20px;
}

.form-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 7px;
}

.input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.input-icon {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    display: flex;
    align-items: center;
    pointer-events: none;
}

.form-input {
    width: 100%;
    height: 42px;
    padding: 0 40px 0 38px;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1e293b;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.form-input::placeholder {
    color: #cbd5e1;
}

.form-input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.has-error .form-input {
    border-color: #ef4444;
}

.has-error .form-input:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.input-toggle {
    position: absolute;
    right: 11px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    transition: color 0.15s;
}

.input-toggle:hover {
    color: #475569;
}

.error-msg {
    margin: 5px 0 0 2px;
    font-size: 12px;
    color: #ef4444;
}

/* ── 记住我 & 忘记密码 ── */
.form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
}

.checkbox-input {
    display: none;
}

.checkbox-custom {
    width: 16px;
    height: 16px;
    border: 1.5px solid #cbd5e1;
    border-radius: 4px;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.15s, background 0.15s;
    flex-shrink: 0;
}

.checkbox-input:checked + .checkbox-custom {
    background: #3b82f6;
    border-color: #3b82f6;
}

.checkbox-input:checked + .checkbox-custom::after {
    content: '';
    display: block;
    width: 9px;
    height: 5px;
    border-left: 2px solid #fff;
    border-bottom: 2px solid #fff;
    transform: rotate(-45deg) translateY(-1px);
}

.checkbox-text {
    font-size: 13px;
    color: #475569;
}

.forgot-link {
    font-size: 13px;
    color: #3b82f6;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.15s;
}

.forgot-link:hover {
    color: #2563eb;
    text-decoration: underline;
}

/* ── 错误提示 ── */
.login-error-alert {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 10px 14px;
    font-size: 13px;
    color: #dc2626;
    margin-bottom: 18px;
}

.alert-slide-enter-active,
.alert-slide-leave-active {
    transition: opacity 0.25s, transform 0.25s;
}
.alert-slide-enter-from,
.alert-slide-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

/* ── 登录按钮 ── */
.login-btn {
    width: 100%;
    height: 44px;
    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 2px;
    transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 2px 10px rgba(59, 130, 246, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
}

.login-btn:hover:not(:disabled) {
    opacity: 0.92;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.45);
    transform: translateY(-1px);
}

.login-btn:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.login-btn:disabled {
    cursor: not-allowed;
    opacity: 0.75;
}

/* 加载动画 */
.loading-dots {
    display: flex;
    gap: 5px;
    align-items: center;
}

.loading-dots span {
    display: inline-block;
    width: 7px;
    height: 7px;
    background: #fff;
    border-radius: 50%;
    animation: dot-bounce 1.2s infinite ease-in-out;
}

.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
    0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
    40% { transform: scale(1); opacity: 1; }
}

/* ── 底部版权 ── */
.login-footer {
    margin-top: 32px;
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
}

/* ── 响应式：小屏幕 ── */
@media (max-width: 500px) {
    .login-form-panel {
        width: calc(100vw - 40px);
        padding: 36px 24px;
        border-radius: 12px;
    }
    .login-form-wrapper {
        max-width: 100%;
    }
}
</style>
