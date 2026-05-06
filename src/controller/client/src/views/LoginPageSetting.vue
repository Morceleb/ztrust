<template>
    <div class="login-page-setting">
      <!-- Toast 提示 -->
      <Transition name="toast-fade">
        <div v-if="toast.show" class="toast-notification" :class="toast.type">
          <div class="toast-icon">
            <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
      </Transition>

      <div class="setting-panel">
        <div class="setting-header">
          <div class="header-action-row">
            <span class="label-text">登录项 <span class="help-icon">?</span> :</span>
            <div class="action-btns">
              <button class="btn-primary" @click="handleSave" :disabled="loading">保存</button>
              <button class="btn-secondary">添加</button>
              <button class="btn-secondary">添加自定义项</button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="table-loading">
          <span>加载中...</span>
        </div>
        <div v-else-if="loadError" class="table-loading error">
          <span>加载失败: {{ loadError }}</span>
        </div>
        <div v-else class="setting-table">
          <div class="table-head">
            <span class="col-name">名称</span>
            <span class="col-toggle">是否可见</span>
            <span class="col-input">标签</span>
            <span class="col-class">表单CSS</span>
            <span class="col-input">占位符</span>
            <span class="col-rule">规则</span>
            <span class="col-ops">操作</span>
          </div>
  
          <div v-for="(item, index) in itemsArr" :key="item.key" class="table-row">
            <div class="col-name">
              <select v-model="item.key" class="ui-select">
                <option :value="item.key">{{ item.label }}</option>
              </select>
            </div>
            <div class="col-toggle">
              <label class="custom-toggle">
                <input type="checkbox" v-model="item.enabled" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="col-input">
              <input type="text" class="ui-input" v-model="item.customLabel" />
            </div>
            <div class="col-class">
              <input type="text" class="ui-input css-input" v-model="item.cssContent" />
            </div>
            <div class="col-input">
              <input type="text" class="ui-input" v-model="item.placeholder" />
            </div>
            <div class="col-rule">
              <select v-if="item.ruleOptions" class="ui-select">
                <option v-for="opt in item.ruleOptions" :key="opt" :value="opt">{{ opt }}</option>
              </select>
            </div>
            <div class="col-ops">
              <button class="op-btn" title="上移"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg></button>
              <button class="op-btn" title="下移"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
              <button class="op-btn" title="删除"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div>
        </div>
      </div>

      <div class="preview-panel">
        <div class="preview-label-bar">
          <span class="preview-label-text">预览效果</span>
        </div>
        
        <div class="preview-body">
          <div class="preview-device">
            
            <div class="preview-login-box">
              
              <div class="box-bottom-bar"></div>
  
              <div v-if="getItem('backButton').enabled" class="back-button">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </div>
  
              <div v-if="getItem('logo').enabled" class="login-logo-box">
                <div class="casdoor-logo-img">
                  <svg viewBox="0 0 24 24" fill="#512da8" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#512da8" stroke-width="2" stroke-linejoin="round"/>
                  </svg>
                </div>
                <span class="preview-logo-text">{{ getItem('logo').customLabel || 'Casdoor' }}</span>
              </div>
  
              <div v-if="getItem('username').enabled" class="login-username">
                <div class="login-username-input">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span class="field-placeholder">{{ getItem('username').placeholder || '用户名、Email或手机号' }}</span>
                </div>
              </div>
  
              <div v-if="getItem('password').enabled" class="login-password">
                <div class="login-password-input">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span class="field-placeholder">{{ getItem('password').placeholder || '密码' }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <line x1="3" y1="3" x2="21" y2="21" />
                  </svg>
                </div>
              </div>
  
              <div v-if="getItem('forgetPassword').enabled" class="login-forget-password">
                <label class="preview-remember">
                  <div class="preview-check-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span>下次自动登录</span>
                </label>
                <span class="preview-forget-link">{{ getItem('forgetPassword').label }}</span>
              </div>
  
              <div v-if="getItem('loginButton').enabled" class="login-button-box">
                <button class="login-button">{{ getItem('loginButton').customLabel || getItem('loginButton').label }}</button>
              </div>
  
              <div v-if="getItem('provider').enabled" class="preview-provider-box">
                <button class="provider-button">
                  <div class="provider-img-circle">
                    <span>A</span>
                  </div>
                  <span class="provider-text">自家身份验证登录</span>
                </button>
              </div>
  
              <div v-if="getItem('signupLink').enabled" class="login-signup-link">
                <span>没有账号？</span>
                <span class="signup-text">{{ getItem('signupLink').label || '立即注册' }}</span>
              </div>
  
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { reactive, ref } from 'vue'
  import { getLoginItems, saveLoginItems } from '@/api/loginItems.js'

  const loading = ref(true)
  const loadError = ref('')

  const toast = ref({ show: false, type: 'success', message: '' })
  let toastTimer = null

  const showToast = (message, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { show: true, type, message }
    toastTimer = setTimeout(() => { toast.value.show = false }, 2500)
  }

  // 默认配置（当接口无数据时兜底）
  const defaultItems = [
    { key: 'backButton', label: '返回按钮', enabled: true, customLabel: '', placeholder: '', cssContent: '.back-button { top: 65px; left: 15px; position: absolute; } .back-inner-button{}' },
    { key: 'logo', label: 'Logo', enabled: true, customLabel: '', placeholder: '', cssContent: '.login-logo-box {}' },
    { key: 'username', label: '用户名', enabled: true, customLabel: '', placeholder: '用户名、Email或手机号', cssContent: '.login-username {} .login-username-input{}' },
    { key: 'password', label: '密码', enabled: true, customLabel: '', placeholder: '密码', cssContent: '.login-password {} .login-password-input{}' },
    { key: 'forgetPassword', label: '忘记密码？', enabled: true, customLabel: '', placeholder: '', cssContent: '.login-forget-password { display: inline-flex; justify-content: space-between; width: 320px; margin-bottom: 25px; }', ruleOptions: ['下次自动登录 - 真', '下次自动登录 - 假'] },
    { key: 'loginButton', label: '登录按钮', enabled: true, customLabel: '', placeholder: '', cssContent: '.login-button-box { margin-bottom: 5px; } .login-button { width: 100%; }' },
    { key: 'provider', label: '提供商', enabled: true, customLabel: '', placeholder: '', cssContent: '.provider-img { width: 30px; margin: 5px; } .provider-big-img { margin-bottom: 10px; }', ruleOptions: ['大图标', '小图标'] },
    { key: 'signupLink', label: '注册链接', enabled: true, customLabel: '立即注册', placeholder: '', cssContent: '.login-signup-link { margin-bottom: 24px; display: flex; justify-content: end; }' }
  ]

  const itemsArr = reactive([])

  const getItem = (key) => itemsArr.find(i => i.key === key) || {}

  // name → key 的反向映射
  const nameToKey = {
    'back-button': 'backButton',
    'login-logo': 'logo',
    'username': 'username',
    'password': 'password',
    'forget-password': 'forgetPassword',
    'login-button': 'loginButton',
    'provider': 'provider',
    'signup-link': 'signupLink'
  }

  // key → name 的正向映射
  const keyToName = {
    backButton: 'back-button',
    logo: 'login-logo',
    username: 'username',
    password: 'password',
    forgetPassword: 'forget-password',
    loginButton: 'login-button',
    provider: 'provider',
    signupLink: 'signup-link'
  }

  // key → type 的映射
  const keyToType = {
    backButton: 'button',
    logo: 'image',
    username: 'text',
    password: 'password',
    forgetPassword: 'link',
    loginButton: 'button',
    provider: 'button',
    signupLink: 'link'
  }

  // 根据 defaultItems 的默认值填充缺失字段
  const fillDefaults = (key) => {
    const def = defaultItems.find(d => d.key === key)
    return def ? { ...def } : null
  }

  // 将后端返回的数组转为内部格式
  const parseApiResponse = (apiItems) => {
    if (!Array.isArray(apiItems) || apiItems.length === 0) return

    for (const apiItem of apiItems) {
      const key = nameToKey[apiItem.name]
      if (!key) continue

      const existing = itemsArr.find(i => i.key === key)
      if (existing) {
        // 用后端数据覆盖已有项
        existing.enabled = !!apiItem.visible
        existing.customLabel = apiItem.label || ''
        existing.cssContent = apiItem.cssCode || ''
      } else {
        // 插入新项
        const def = fillDefaults(key)
        itemsArr.push({
          key,
          label: def?.label || key,
          enabled: !!apiItem.visible,
          customLabel: apiItem.label || '',
          placeholder: def?.placeholder || '',
          cssContent: apiItem.cssCode || def?.cssContent || '',
          ruleOptions: def?.ruleOptions
        })
      }
    }
  }

  // 注入 CSS 到预览区
  const injectCSS = (cssCodes) => {
    const existing = document.getElementById('login-preview-dynamic-css')
    if (existing) existing.remove()

    const combined = cssCodes.filter(Boolean).join('\n')
    if (!combined) return

    const style = document.createElement('style')
    style.id = 'login-preview-dynamic-css'
    style.textContent = combined
    document.head.appendChild(style)
  }

  // 初始化：从 GET 接口加载真实数据
  const initFromAPI = async () => {
    try {
      const res = await getLoginItems()
      console.log('GET /config/login-items 返回:', res)

      let apiItems = []
      if (res?.code === 0 || res?.code === 200) {
        apiItems = res.data || []
      } else if (Array.isArray(res)) {
        apiItems = res
      }

      if (apiItems.length > 0) {
        // 用后端数据初始化
        parseApiResponse(apiItems)
        injectCSS(apiItems.map(i => i.cssCode).filter(Boolean))
      } else {
        // 无数据则用默认配置
        defaultItems.forEach(d => itemsArr.push({ ...d }))
      }
    } catch (err) {
      loadError.value = err.message
      console.error('加载登录配置失败:', err)
      defaultItems.forEach(d => itemsArr.push({ ...d }))
    } finally {
      loading.value = false
    }
  }

  initFromAPI()

  // 保存配置
  const handleSave = async () => {
    try {
      const payload = itemsArr.map(item => ({
        name: keyToName[item.key] || item.key,
        visible: item.enabled,
        cssCode: item.cssContent,
        label: item.customLabel || item.label,
        type: keyToType[item.key] || 'text'
      }))

      const result = await saveLoginItems(payload)
      console.log('保存接口返回:', result)
      if (result?.code === 0 || result?.code === 200) {
        showToast('保存成功', 'success')
      } else {
        showToast(result?.msg || result?.message || '保存失败', 'error')
      }
    } catch (err) {
      console.error('保存失败:', err)
      showToast('保存失败: ' + (err.message || '网络错误'), 'error')
    }
  }
  </script>
  
  <style scoped>
  .login-page-setting {
    display: flex; 
    height: 100%; 
    min-height: calc(100vh - 100px); 
    margin: -20px; 
    padding: 0; 
    background: white; 
    /* 已替换为你提供的全新字体栈 */
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
    gap: 0; 
    box-sizing: border-box;
  }
  
  .setting-panel {
    flex: 2.2;
    background: white; 
    border-right: 1px solid #ebeef5;
    border-radius: 0; 
    box-shadow: none; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden;
  }
  
  .setting-header { padding: 16px 20px; }
  .header-action-row { display: flex; align-items: center; }
  .label-text { font-size: 14px; color: #303133; margin-right: 15px; display: flex; align-items: center; }
  .help-icon { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border-radius: 50%; border: 1px solid #409eff; color: #409eff; font-size: 10px; margin-left: 4px; cursor: pointer; }
  .action-btns { display: flex; gap: 10px; }
  .btn-primary { background: #5c35b8; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .btn-primary:disabled { background: #a89cc8; cursor: not-allowed; }

  /* Toast 通知 */
  .toast-notification {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 99999;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    min-width: 200px;
    max-width: 360px;
  }

  .toast-notification.success {
    background: #f0f9eb;
    color: #67c23a;
    border: 1px solid #c2e7b0;
  }

  .toast-notification.error {
    background: #fef0f0;
    color: #f56c6c;
    border: 1px solid #fbc4c4;
  }

  .toast-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .toast-message { flex: 1; }

  .toast-fade-enter-active,
  .toast-fade-leave-active {
    transition: all 0.3s ease;
  }

  .toast-fade-enter-from,
  .toast-fade-leave-to {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  .btn-secondary { background: #8b5cf6; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; }
  
  .setting-table { width: 100%; flex: 1; overflow-y: auto; overflow-x: hidden; }

  .table-loading {
    display: flex; align-items: center; justify-content: center;
    padding: 40px; font-size: 14px; color: #909399;
  }
  .table-loading.error { color: #f56c6c; }
  
  .table-head, .table-row {
    display: grid; 
    grid-template-columns: 130px 80px 110px 1fr 110px 130px 100px; 
    align-items: center; 
    border-top: 1px solid #ebeef5;
  }
  
  .table-head { padding: 12px 16px; font-weight: bold; font-size: 13px; color: #303133; background-color: #fafafa; position: sticky; top: 0; z-index: 10; }
  .table-row { padding: 8px 16px; }
  .table-row:hover { background-color: #f5f7fa; }
  
  .ui-select, .ui-input {
    width: 96%;
    height: 32px; border: 1px solid #dcdfe6; border-radius: 4px; padding: 0 10px; font-size: 13px; color: #606266; box-sizing: border-box; outline: none; transition: border-color 0.2s;
  }
  .ui-select:focus, .ui-input:focus { border-color: #8b5cf6; }
  .css-input { font-family: Consolas, Monaco, monospace; font-size: 12px; color: #333; }
  
  .custom-toggle { position: relative; display: inline-block; width: 38px; height: 20px; }
  .custom-toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #dcdfe6; transition: .3s; border-radius: 20px; }
  .toggle-slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px; background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .custom-toggle input:checked + .toggle-slider { background-color: #512da8; }
  .custom-toggle input:checked + .toggle-slider:before { transform: translateX(18px); }
  
  .col-ops { display: flex; gap: 6px; }
  .op-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border: 1px solid #dcdfe6; background: white; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
  .op-btn:hover { background: #f4f4f5; border-color: #c0c4cc; }
  
  .preview-panel {
    flex: 1; 
    background: white; 
    border-radius: 0; 
    border: none; 
    box-shadow: none; 
    display: flex; 
    flex-direction: column; 
    overflow: hidden;
  }
  
  .preview-label-bar { padding: 16px 20px; border-bottom: 1px solid #ebeef5; background: white; }
  .preview-label-text { font-size: 14px; font-weight: bold; color: #303133; }
  
  .preview-body { flex: 1; display: flex; align-items: center; justify-content: center; background: #fafafa; padding: 20px; overflow: auto; }
  
  .preview-device { 
    width: 100%; max-width: 500px; height: 600px; position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  
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
  
  .login-forget-password { display: inline-flex; justify-content: space-between; width: 100%; max-width: 320px; margin-bottom: 25px; align-items: center; }
  .preview-remember { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #111; }
  .preview-check-box { 
    width: 16px; height: 16px; border-radius: 3px; display: flex; align-items: center; justify-content: center; background: #3b1c8f; 
  }
  .preview-forget-link { font-size: 13px; color: #3b1c8f; cursor: pointer; }
  
  .login-button-box { width: 100%; max-width: 320px; margin-bottom: 25px; }
  .login-button { 
    width: 100%; height: 42px; background: #3b1c8f; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer; 
  }
  
  .preview-provider-box { width: 100%; max-width: 320px; margin-bottom: 25px; }
  .provider-button {
    width: 100%; height: 46px; background: #a6a6a6; border: 1px solid #888; border-radius: 6px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  .provider-img-circle {
    position: absolute; left: 15px; width: 28px; height: 28px; background: #000; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;
  }
  .provider-text { font-size: 15px; color: #000; font-weight: 500; }
  
  .login-signup-link { width: 100%; max-width: 320px; display: flex; justify-content: flex-end; font-size: 13px; color: #111; margin-bottom: 15px; }
  .signup-text { color: #3b1c8f; margin-left: 5px; cursor: pointer; }
  </style>