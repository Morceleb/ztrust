<template>
    <div class="login-page">
        <!-- 全屏背景 -->
        <div class="login-brand">
            <div class="brand-decoration">
                <div class="deco-circle deco-circle-1"></div>
                <div class="deco-circle deco-circle-2"></div>
                <div class="deco-circle deco-circle-3"></div>
            </div>
        </div>

        <!-- 公司地址输入卡片 -->
        <div v-if="currentStep === 'company'" class="login-form-panel">
            <div class="login-form-wrapper">
                <div class="login-form-header">
                    <h2 class="form-title">企业入口</h2>
                    <p class="form-subtitle">请输入您的公司地址以继续</p>
                </div>

                <form class="login-form" @submit.prevent="handleCompanySubmit">
                    <div class="form-group" :class="{ 'has-error': companyError }">
                        <label class="form-label">公司地址 / 域名</label>
                        <div class="input-wrapper">
                            <div class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                    <polyline points="9 22 9 12 15 12 15 22" />
                                </svg>
                            </div>
                            <input v-model="companyAddress" type="text" class="form-input"
                                placeholder="例如：company.example.com 或 https://company.com" @input="clearCompanyError" />
                        </div>
                        <p v-if="companyError" class="error-msg">{{ companyError }}</p>
                    </div>

                    <button type="submit" class="login-btn" :disabled="isCompanyLoading">
                        <span v-if="!isCompanyLoading">下一步</span>
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

        <!-- 原登录表单卡片 -->
        <div v-else class="login-form-panel">
            <div class="login-form-wrapper">
                <!-- 返回修改公司地址按钮 -->
                <button class="back-btn" @click="backToCompany">
                    ← 返回修改公司地址
                </button>

                <div class="login-form-header">
                    <h2 class="form-title">欢迎回来</h2>
                    <p class="form-subtitle">
                        {{ companyAddress ? `正在登录：${companyAddress}` : '请登录您的账号' }}
                    </p>
                </div>

                <form class="login-form" @submit.prevent="handleLogin">
                    <!-- 用户名 -->
                    <div class="form-group" :class="{ 'has-error': errors.username }">
                        <label class="form-label">用户名</label>
                        <div class="input-wrapper">
                            <div class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </div>
                            <input v-model="form.username" type="text" class="form-input" placeholder="请输入用户名"
                                autocomplete="username" @input="clearError('username')" />
                        </div>
                        <p v-if="errors.username" class="error-msg">{{ errors.username }}</p>
                    </div>

                    <!-- 密码 -->
                    <div class="form-group" :class="{ 'has-error': errors.password }">
                        <label class="form-label">密码</label>
                        <div class="input-wrapper">
                            <div class="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                    stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="form-input"
                                placeholder="请输入密码" autocomplete="current-password" @input="clearError('password')" />
                            <button type="button" class="input-toggle" @click="showPassword = !showPassword"
                                tabindex="-1">
                                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                    stroke-linecap="round" stroke-linejoin="round">
                                    <path
                                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                    <line x1="1" y1="1" x2="23" y2="23" />
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import request from '@/utils/request'
import store from '@/store'

const router = useRouter()

// 步骤控制：'company' | 'login'
const currentStep = ref('company')

// 公司地址
const companyAddress = ref('')

// 表单数据
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

const isCompanyLoading = ref(false)
const companyError = ref('')

// 加载已保存的公司地址
onMounted(() => {
    const savedAddress = localStorage.getItem('companyAddress')
    if (savedAddress) {
        companyAddress.value = savedAddress
        currentStep.value = 'login'   // 已有地址则直接进入登录页
    }
})

// 保存公司地址并切换步骤
const handleCompanySubmit = () => {
    if (!companyAddress.value.trim()) {
        companyError.value = '请输入公司地址'
        return
    }

    isCompanyLoading.value = true

    // 保存到 localStorage
    localStorage.setItem('companyAddress', companyAddress.value.trim())

    // 模拟一点延迟，更自然
    setTimeout(() => {
        currentStep.value = 'login'
        isCompanyLoading.value = false
    }, 300)
}

const clearCompanyError = () => {
    companyError.value = ''
}

// 返回修改公司地址
const backToCompany = () => {
    currentStep.value = 'company'
}

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
        const response = await request.post('/auth/login', {
            username: form.username,
            password: form.password
        })

        store.dispatch('auth/loginSuccess', response.data.data.user)
        router.push('/index')
    } catch (err) {
        loginError.value = err?.response?.data?.message || '登录失败，请检查用户名和密码'
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped src="./index.css"></style>