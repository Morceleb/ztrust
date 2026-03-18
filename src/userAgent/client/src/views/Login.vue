<template>
    <div class="login-container">
        <div class="login-card">
            <h1>登录</h1>

            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-item">
                    <label>用户名</label>
                    <input type="text" v-model="username" placeholder="请输入用户名" autocomplete="username" required />
                </div>

                <div class="form-item">
                    <label>密码</label>
                    <input type="password" v-model="password" placeholder="请输入密码" autocomplete="current-password"
                        required />
                </div>

                <div class="error-msg" v-if="errorMsg">{{ errorMsg }}</div>

                <button type="submit" :disabled="loading" class="login-btn">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
            </form>

            <div v-if="flag" class="success-tip">
                {{ info.message || '登录成功' }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import router from '../router'
import store from '../store'

const username = ref('')
const password = ref('')
const loading = ref(false)
const flag = ref(false)
const errorMsg = ref('')
const info = ref({})

const handleLogin = async () => {
    flag.value = false
    errorMsg.value = ''
    info.value = {}
    loading.value = true

    try {
        const response = await axios.post('/api/auth/login', {
            username: username.value,
            password: password.value
        })

        const res = response.data
        console.log('登录响应:', res)

        if (res.success && res.code === '0') {
            await store.dispatch('auth/loginSuccess', res.data.user)
            flag.value = true
            info.value = res.data || { message: '登录成功' }
            username.value = ''
            password.value = ''
            router.push({ path: '/index' })
        } else {
            errorMsg.value = res.message || '登录失败，请检查用户名或密码'
        }
    } catch (error) {
        console.error('登录请求失败:', error)
        errorMsg.value = error.response?.data?.message || '网络错误，无法连接到服务器'
    } finally {
        loading.value = false
    }
}
</script>

<style scoped>
.login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
}

.login-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.18);
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 420px;
}

.login-card h1 {
    text-align: center;
    margin-bottom: 2rem;
    color: #2d3748;
    font-size: 1.8rem;
    font-weight: 600;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 1.4rem;
}

.form-item {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-item label {
    font-size: 0.95rem;
    font-weight: 500;
    color: #4a5568;
}

.form-item input {
    padding: 0.9rem 1rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    background: #f8fafc;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.form-item input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
    background: white;
}

.login-btn {
    margin-top: 1.2rem;
    padding: 0.95rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.05rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}

.login-btn:hover:not(:disabled) {
    background: #5a67d8;
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.25);
}

.login-btn:disabled {
    background: #a0aec0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.error-msg {
    color: #e53e3e;
    font-size: 0.9rem;
    text-align: center;
    background: #fff5f5;
    padding: 0.75rem;
    border-radius: 8px;
    border: 1px solid #feb2b2;
}

.success-tip {
    margin-top: 1.5rem;
    text-align: center;
    color: #38a169;
    font-weight: 500;
    padding: 0.75rem;
    background: #f0fff4;
    border: 1px solid #9ae6b4;
    border-radius: 8px;
}

/* 手机小屏微调 */
@media (max-width: 480px) {
    .login-card {
        padding: 2rem 1.5rem;
    }

    .login-card h1 {
        font-size: 1.6rem;
    }
}
</style>