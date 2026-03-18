<template>
  <div class="callback-page">
    <div class="callback-card">
      <div v-if="error" class="callback-error">
        <div class="error-icon">!</div>
        <p class="error-text">{{ error }}</p>
        <router-link to="/login" class="back-link">返回登录</router-link>
      </div>
      <div v-else class="callback-loading">
        <div class="loading-spinner"></div>
        <p>登录验证中，请稍候...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const error = ref(null)

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const state = params.get('state')

  const savedState = localStorage.getItem('casdoor_oauth_state')
  if (!savedState || savedState !== state) {
    error.value = '无效的认证状态，请重新登录'
    return
  }
  localStorage.removeItem('casdoor_oauth_state')

  if (!code) {
    error.value = '未获取到授权码，请重新登录'
    return
  }

  try {
    // 前端仅做跳转；实际应用中将 code 发往后端，由后端用 client_secret 与 Casdoor 交换 token 并写 cookie/session
    // 示例：await fetch('/api/auth/casdoor/callback', { method: 'POST', body: JSON.stringify({ code, redirectUri: ... }) })
    // 这里模拟成功，直接跳转控制台
    await new Promise(r => setTimeout(r, 600))
    router.replace('/')
  } catch (e) {
    error.value = e?.message || '认证失败，请重试'
  }
})
</script>

<style scoped>
.callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.callback-card {
  background: #fff;
  border-radius: 12px;
  padding: 40px;
  min-width: 320px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.callback-error .error-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  background: #fef2f2;
  color: #dc2626;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.error-text {
  margin: 0 0 20px 0;
  font-size: 15px;
  color: #475569;
}

.back-link {
  display: inline-block;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.callback-loading p {
  margin: 16px 0 0 0;
  font-size: 14px;
  color: #64748b;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border: 3px solid #e2e8f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
