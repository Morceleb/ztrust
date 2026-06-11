<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="hero-panel">
        <div class="badge">Gateway Admin</div>
        <h1>网关管理登录</h1>
        <ul>
          <li>登录后访问资源与日志管理</li>
        </ul>
      </section>

      <section class="form-panel">
        <div class="form-card">
          <div class="form-header">
            <span class="form-kicker">欢迎回来</span>
            <h2>管理员登录</h2>
          </div>

          <form class="login-form" @submit.prevent="handleLogin">
            <label class="field">
              <span class="field-label">用户名</span>
              <input v-model.trim="username" type="text" autocomplete="username" placeholder="请输入管理员用户名" />
            </label>

            <label class="field">
              <span class="field-label">密码</span>
              <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入管理员密码" />
            </label>

            <div class="field-row">
              <label class="remember-toggle">
                <input v-model="rememberMe" type="checkbox" />
                <span>记住登录状态</span>
              </label>
              <button type="button" class="ghost-btn" @click="fillDefaultCredentials">使用默认账号</button>
            </div>

            <p v-if="error" class="error-text">{{ error }}</p>

            <button class="primary-btn" type="submit" :disabled="loading">
              {{ loading ? '登录中...' : '登录进入网关控制台' }}
            </button>
          </form>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiClient } from '@/api/axios.js'
import { isAdminLoggedIn, setAdminSession } from '@/utils/authStorage.js'

const router = useRouter()
const route = useRoute()
const username = ref('admin')
const password = ref('admin')
const rememberMe = ref(true)
const loading = ref(false)
const error = ref('')

const fillDefaultCredentials = () => {
  username.value = 'admin'
  password.value = 'admin'
  error.value = ''
}

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const res = await apiClient.post('/policy/auth/login', {
      username: username.value.trim(),
      password: password.value
    })

    if (res.data.code === 200) {
      const { nickname, adminId } = res.data.data
      setAdminSession({
        nickname,
        username: username.value.trim(),
        adminId,
        rememberMe: rememberMe.value
      })
      const redirect = typeof route.query.redirect === 'string' && route.query.redirect
        ? route.query.redirect
        : '/overview'
      await router.replace(redirect)
    } else {
      error.value = res.data.message || '用户名或密码错误'
    }
  } catch (err) {
    if (err.response && err.response.status === 401) {
      error.value = '用户名或密码错误'
    } else {
      error.value = err.response?.data?.message || '登录失败，请稍后重试'
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (isAdminLoggedIn()) {
    router.replace(typeof route.query.redirect === 'string' && route.query.redirect ? route.query.redirect : '/overview')
  }
})
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: center;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.24), transparent 32%),
    radial-gradient(circle at bottom right, rgba(59, 130, 246, 0.2), transparent 28%),
    linear-gradient(135deg, #082f49 0%, #0f172a 42%, #111827 100%);
  color: #e5eefc;
}

.login-shell {
  width: 100%;
  max-width: 1180px;
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 32px;
  padding: 32px;
}

.hero-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 32px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 28px;
  background: rgba(8, 47, 73, 0.48);
  backdrop-filter: blur(18px);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
}

.badge {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(125, 211, 252, 0.16);
  border: 1px solid rgba(125, 211, 252, 0.22);
  color: #bae6fd;
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-panel h1 {
  margin-top: 18px;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.04;
  max-width: 10ch;
}

.hero-panel p {
  margin-top: 18px;
  max-width: 56ch;
  color: #cbd5e1;
  line-height: 1.7;
  font-size: 16px;
}

.hero-panel ul {
  margin-top: 24px;
  padding-left: 20px;
  color: #dbeafe;
  line-height: 1.9;
}

.form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  width: 100%;
  max-width: 460px;
  padding: 32px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.32);
}

.form-header {
  margin-bottom: 24px;
}

.form-kicker {
  color: #0284c7;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.form-header h2 {
  margin-top: 8px;
  font-size: 30px;
}

.login-form {
  display: grid;
  gap: 18px;
}

.field {
  display: grid;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  color: #334155;
}

.field input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field input:focus {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.14);
}

.field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.remember-toggle {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #475569;
}

.ghost-btn,
.primary-btn {
  border: none;
  border-radius: 14px;
  font-size: 15px;
  cursor: pointer;
}

.ghost-btn {
  padding: 10px 14px;
  background: #e2e8f0;
  color: #334155;
}

.primary-btn {
  margin-top: 8px;
  padding: 14px 16px;
  color: white;
  background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
  box-shadow: 0 16px 32px rgba(2, 132, 199, 0.25);
}

.primary-btn:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.error-text {
  margin: 0;
  color: #dc2626;
  font-size: 14px;
}

@media (max-width: 960px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .hero-panel {
    min-height: auto;
  }
}

@media (max-width: 640px) {
  .login-shell {
    padding: 18px;
    gap: 18px;
  }

  .hero-panel,
  .form-card {
    padding: 22px;
    border-radius: 22px;
  }

  .field-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
