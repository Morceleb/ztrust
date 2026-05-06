<template>
  <div class="login-preview-page">
    <div class="preview-title">登录页动态渲染测试</div>
    <div class="preview-hint" v-if="loading">加载中...</div>
    <div class="preview-hint error" v-if="error">{{ error }}</div>

    <div class="preview-device">
      <div class="preview-login-box" ref="loginBox">
        <div class="box-bottom-bar"></div>

        <!-- 返回按钮 -->
        <div v-if="itemMap['back-button']?.visible" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </div>

        <!-- Logo -->
        <div v-if="itemMap['login-logo']?.visible" class="login-logo-box">
          <div class="casdoor-logo-img">
            <svg viewBox="0 0 24 24" fill="#512da8" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#512da8" stroke-width="2" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="preview-logo-text">{{ itemMap['login-logo']?.label || 'Casdoor' }}</span>
        </div>

        <!-- 用户名 -->
        <div v-if="itemMap['username']?.visible" class="login-username">
          <div class="login-username-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span class="field-placeholder">{{ itemMap['username']?.placeholder || '用户名、Email或手机号' }}</span>
          </div>
        </div>

        <!-- 密码 -->
        <div v-if="itemMap['password']?.visible" class="login-password">
          <div class="login-password-input">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span class="field-placeholder">{{ itemMap['password']?.placeholder || '密码' }}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          </div>
        </div>

        <!-- 忘记密码 -->
        <div v-if="itemMap['forget-password']?.visible" class="login-forget-password">
          <label class="preview-remember">
            <div class="preview-check-box">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span>下次自动登录</span>
          </label>
          <span class="preview-forget-link">{{ itemMap['forget-password']?.label }}</span>
        </div>

        <!-- 登录按钮 -->
        <div v-if="itemMap['login-button']?.visible" class="login-button-box">
          <button class="login-button">{{ itemMap['login-button']?.label || '登录' }}</button>
        </div>

        <!-- 提供商 -->
        <div v-if="itemMap['provider']?.visible" class="preview-provider-box">
          <button class="provider-button">
            <div class="provider-img-circle">
              <span>A</span>
            </div>
            <span class="provider-text">{{ itemMap['provider']?.label || '自家身份验证登录' }}</span>
          </button>
        </div>

        <!-- 注册链接 -->
        <div v-if="itemMap['signup-link']?.visible" class="login-signup-link">
          <span>没有账号？</span>
          <span class="signup-text">{{ itemMap['signup-link']?.label || '立即注册' }}</span>
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div class="debug-panel">
      <div class="debug-title">接口返回数据 (原始 JSON)</div>
      <pre class="debug-json">{{ JSON.stringify(loginItems, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLoginItems } from '@/api/loginItems.js'

const loginItems = ref([])
const loading = ref(true)
const error = ref('')

// 将数组转为 map，方便按 name 快速查找
const itemMap = computed(() => {
  const map = {}
  for (const item of loginItems.value) {
    map[item.name] = item
  }
  return map
})

// 注入 CSS
const injectCSS = (items) => {
  // 移除旧标签
  const old = document.getElementById('dynamic-login-css')
  if (old) old.remove()

  const cssCode = items.map(i => i.cssCode).filter(Boolean).join('\n')
  if (!cssCode) return

  const style = document.createElement('style')
  style.id = 'dynamic-login-css'
  style.textContent = cssCode
  document.head.appendChild(style)
}

onMounted(async () => {
  try {
    const res = await getLoginItems()
    console.log('GET /config/login-items 返回:', res)

    // 兼容两种响应格式
    if (res?.code === 0 || res?.code === 200) {
      loginItems.value = res.data || []
    } else if (Array.isArray(res)) {
      loginItems.value = res
    } else {
      error.value = '数据格式异常: ' + JSON.stringify(res)
    }

    if (loginItems.value.length > 0) {
      injectCSS(loginItems.value)
    }
  } catch (err) {
    error.value = '请求失败: ' + err.message
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.login-preview-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.preview-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
}

.preview-hint {
  text-align: center;
  padding: 12px;
  color: #666;
  font-size: 14px;
}
.preview-hint.error {
  color: #f56c6c;
}

/* 设备容器 */
.preview-device {
  width: 100%;
  max-width: 500px;
  height: 600px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 8px;
  margin: 0 auto 20px;
}

/* 登录框 - 与 LoginPageSetting 保持一致 */
.preview-login-box {
  width: 420px;
  background-color: #9a9a9a;
  box-shadow: 8px 8px 15px rgba(0, 0, 0, 0.3);
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 40px 50px;
  box-sizing: border-box;
  transform: scale(0.95);
}

.box-bottom-bar {
  position: absolute; bottom: 0; left: 0; width: 100%; height: 12px; background: white;
}

.back-button {
  top: 65px; left: 25px; position: absolute; color: #333; cursor: pointer;
}

.login-logo-box {
  display: flex; align-items: center; gap: 10px; margin-bottom: 40px;
}
.casdoor-logo-img { width: 45px; height: 45px; }
.preview-logo-text { font-size: 32px; font-weight: 800; color: #000; font-family: Arial, sans-serif; }

.login-username, .login-password { width: 100%; max-width: 320px; margin-bottom: 15px; }
.login-username-input, .login-password-input {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  background: transparent; border: 1px solid #777; border-radius: 6px;
}
.field-icon, .eye-icon { color: #555; flex-shrink: 0; }
.field-placeholder { flex: 1; font-size: 14px; color: #555; }
.eye-icon { cursor: pointer; }

.login-forget-password {
  display: inline-flex; justify-content: space-between; width: 100%;
  max-width: 320px; margin-bottom: 25px; align-items: center;
}
.preview-remember { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #111; }
.preview-check-box {
  width: 16px; height: 16px; border-radius: 3px;
  display: flex; align-items: center; justify-content: center;
  background: #3b1c8f;
}
.preview-forget-link { font-size: 13px; color: #3b1c8f; cursor: pointer; }

.login-button-box { width: 100%; max-width: 320px; margin-bottom: 25px; }
.login-button {
  width: 100%; height: 42px; background: #3b1c8f; color: white;
  border: none; border-radius: 6px; font-size: 15px; cursor: pointer;
}

.preview-provider-box { width: 100%; max-width: 320px; margin-bottom: 25px; }
.provider-button {
  width: 100%; height: 46px; background: #a6a6a6; border: 1px solid #888;
  border-radius: 6px; display: flex; align-items: center; justify-content: center;
  position: relative; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.provider-img-circle {
  position: absolute; left: 15px; width: 28px; height: 28px;
  background: #000; color: white; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: bold; font-size: 14px;
}
.provider-text { font-size: 15px; color: #000; font-weight: 500; }

.login-signup-link {
  width: 100%; max-width: 320px; display: flex; justify-content: flex-end;
  font-size: 13px; color: #111; margin-bottom: 15px;
}
.signup-text { color: #3b1c8f; margin-left: 5px; cursor: pointer; }

/* 调试面板 */
.debug-panel {
  max-width: 500px;
  margin: 0 auto;
  background: white;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #ebeef5;
}
.debug-title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}
.debug-json {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}
</style>
