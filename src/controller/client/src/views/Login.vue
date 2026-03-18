<template>
  <div class="login-page">
    <!-- 左侧品牌区（与控制系统侧栏风格一致） -->
    <div class="login-brand">
      <div class="brand-content">
        <div class="brand-logo">
          <div class="brand-logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <span class="brand-name">控制系统</span>
        </div>
        <p class="brand-desc">零信任 · 管理端</p>
        <div class="brand-features">
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>人员与资源管理</span>
          </div>
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>权限配置与审计</span>
          </div>
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>统一身份认证（Casdoor）</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧登录区 -->
    <div class="login-form-panel">
      <div class="login-form-wrapper">
        <div class="login-form-header">
          <h2 class="form-title">管理员登录</h2>
          <p class="form-subtitle">使用 Casdoor 统一身份认证登录控制系统</p>
        </div>

        <div class="login-form-body">
          <button type="button" class="casdoor-login-btn" @click="handleCasdoorLogin" :disabled="isLoading">
            <span v-if="!isLoading" class="btn-content">
              <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              <span>使用 Casdoor 登录</span>
            </span>
            <span v-else class="loading-text">跳转中...</span>
          </button>

          <p class="login-tip">登录后将跳转至 Casdoor 认证页面，完成认证后返回本系统。</p>
        </div>

        <div class="login-footer">
          <span>© 零信任控制系统</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)

// 未接入 Casdoor 前：点击登录直接进入控制台，后续可改为 getSigninUrl() 跳转 Casdoor
const handleCasdoorLogin = () => {
  isLoading.value = true
  router.push('/').finally(() => {
    isLoading.value = false
  })
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 左侧品牌区（与 AdminLayout 侧栏风格一致） */
.login-brand {
  width: 420px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.brand-content {
  width: 100%;
  max-width: 320px;
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brand-logo-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand-name {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.brand-desc {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 40px 0;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 14px;
}

.feature-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  flex-shrink: 0;
}

/* 右侧登录区 */
.login-form-panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  padding: 24px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 380px;
}

.login-form-header {
  margin-bottom: 32px;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.form-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.login-form-body {
  margin-bottom: 28px;
}

.casdoor-login-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 14px rgba(102, 126, 234, 0.4);
}

.casdoor-login-btn:hover:not(:disabled) {
  opacity: 0.95;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.45);
}

.casdoor-login-btn:disabled {
  cursor: not-allowed;
  opacity: 0.8;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn-icon {
  flex-shrink: 0;
}

.loading-text {
  font-size: 14px;
}

.login-tip {
  margin: 16px 0 0 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.login-footer {
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
}

@media (max-width: 768px) {
  .login-page {
    flex-direction: column;
  }
  .login-brand {
    width: 100%;
    min-height: 200px;
    padding: 32px 24px;
  }
  .brand-logo {
    margin-bottom: 20px;
  }
  .brand-desc {
    margin-bottom: 24px;
  }
  .brand-features {
    gap: 10px;
  }
}
</style>
