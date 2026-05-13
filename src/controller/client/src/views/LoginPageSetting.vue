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

      <Transition name="modal">
        <div v-if="cssEditor.visible" class="modal-overlay" @click.self="closeCssEditor">
          <div class="css-editor-modal">
            <div class="css-editor-header">
              <span class="css-editor-title">编辑 CSS — {{ cssEditor.item?.label }}</span>
              <button class="css-editor-close" @click="closeCssEditor">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="css-editor-body">
              <textarea
                class="css-textarea"
                v-model="cssEditor.code"
                placeholder="请输入 CSS 代码..."
                spellcheck="false"
              ></textarea>
            </div>
            <div class="css-editor-footer">
              <button class="css-btn css-btn-cancel" @click="closeCssEditor">取消</button>
              <button class="css-btn css-btn-save" @click="saveCssCode">保存</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- 添加自定义项弹窗 -->
      <Transition name="modal">
        <div v-if="customForm.visible" class="modal-overlay" @click.self="customForm.visible = false">
          <div class="custom-form-modal">
            <div class="custom-form-header">
              <span class="custom-form-title">添加自定义项</span>
              <button class="css-editor-close" @click="customForm.visible = false">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="custom-form-body">
              <div class="form-field">
                <label class="form-label">标签名称</label>
                <input type="text" class="ui-input" v-model="customForm.label" placeholder="请输入标签名称，如：手机号" />
              </div>
              <div class="form-field">
                <label class="form-label">类型</label>
                <select class="ui-select" v-model="customForm.type">
                  <option value="text">文本输入框</option>
                  <option value="password">密码输入框</option>
                  <option value="checkbox">复选框</option>
                  <option value="link">链接</option>
                  <option value="button">按钮</option>
                </select>
              </div>
              <div class="form-field">
                <label class="form-label">自定义标签（选填）</label>
                <input type="text" class="ui-input" v-model="customForm.customLabel" placeholder="覆盖默认显示的文字" />
              </div>
              <div class="form-field">
                <label class="form-label">占位符（选填）</label>
                <input type="text" class="ui-input" v-model="customForm.placeholder" placeholder="请输入占位符文字" />
              </div>
              <div class="form-field full-width">
                <label class="form-label">表单CSS（选填）</label>
                <textarea class="css-textarea" v-model="customForm.cssContent" placeholder="请输入 CSS 代码..." spellcheck="false"></textarea>
              </div>
            </div>
            <div class="custom-form-footer">
              <button class="css-btn css-btn-cancel" @click="customForm.visible = false">取消</button>
              <button class="css-btn css-btn-save" @click="confirmAddCustom">确认添加</button>
            </div>
          </div>
        </div>
      </Transition>

      <div class="setting-panel">
        <div class="setting-header">
          <div class="header-action-row">
            <span class="label-text">登录项 <span class="help-icon">?</span> :</span>
            <div class="action-btns">
              <button class="btn-primary" @click="handleSave" :disabled="loading">保存</button>
              <button class="btn-primary btn-add-custom" @click="handleAddCustom">添加自定义项</button>
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
  
          <div v-for="(item, index) in sortedItems" :key="index" class="table-row">
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
              <div class="css-preview" :title="item.cssContent ? '点击修改CSS' : '点击添加CSS'" @click="openCssEditor(item)">
                <span class="css-text">{{ item.cssContent || '（未设置）' }}</span>
              </div>
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
              <button class="op-btn" title="上移" @click="moveUp(index)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg></button>
              <button class="op-btn" title="下移" @click="moveDown(index)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg></button>
              <button class="op-btn" title="删除" @click="handleDelete(index)"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
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

              <template v-for="item in sortedItems" :key="item.key">

                <div v-if="item.key === 'backButton' && item.enabled" class="back-button" :style="getItemStyle(item, '.back-button')" :data-key="item.key">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                  </svg>
                </div>

                <div v-if="item.key === 'logo' && item.enabled" class="login-logo-box" :style="getItemStyle(item, '.login-logo-box')" :data-key="item.key">
                  <div class="casdoor-logo-img">
                    <svg viewBox="0 0 24 24" fill="#512da8" xmlns="http://www.w3.org/2000/svg" width="40" height="40">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#512da8" stroke-width="2" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <span class="preview-logo-text">{{ item.customLabel || 'Casdoor' }}</span>
                </div>

                <div v-if="item.key === 'username' && item.enabled" class="login-username" :style="getItemStyle(item, '.login-username')" :data-key="item.key">
                  <div class="login-username-input" :style="getItemStyle(item, '.login-username-input')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span class="field-placeholder">{{ item.placeholder || '用户名、Email或手机号' }}</span>
                  </div>
                </div>

                <div v-if="item.key === 'password' && item.enabled" class="login-password" :style="getItemStyle(item, '.login-password')" :data-key="item.key">
                  <div class="login-password-input" :style="getItemStyle(item, '.login-password-input')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span class="field-placeholder">{{ item.placeholder || '密码' }}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <line x1="3" y1="3" x2="21" y2="21" />
                    </svg>
                  </div>
                </div>

                <div v-if="item.key === 'forgetPassword' && item.enabled" class="login-forget-password" :style="getItemStyle(item, '.login-forget-password')" :data-key="item.key">
                  <label class="preview-remember">
                    <div class="preview-check-box">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>下次自动登录</span>
                  </label>
                  <span class="preview-forget-link">{{ item.customLabel || item.label }}</span>
                </div>

                <div v-if="item.key === 'loginButton' && item.enabled" class="login-button-box" :style="getItemStyle(item, '.login-button-box')" :data-key="item.key">
                  <button
                    class="login-button"
                    :style="getItemStyle(item, '.login-button', hoveredKey === item.key)"
                    @mouseenter="hoveredKey = item.key"
                    @mouseleave="hoveredKey = null"
                  >{{ item.customLabel || item.label }}</button>
                </div>

                <div v-if="item.key === 'provider' && item.enabled" class="preview-provider-box" :style="getItemStyle(item, '.preview-provider-box')" :data-key="item.key">
                  <button class="provider-button" :style="getItemStyle(item, '.provider-button')">
                    <div class="provider-img-circle" :style="getItemStyle(item, '.provider-img-circle')">
                      <span>A</span>
                    </div>
                    <span class="provider-text">{{ item.customLabel || item.label }}</span>
                  </button>
                </div>

                <div v-if="item.key === 'signupLink' && item.enabled" class="login-signup-link" :style="getItemStyle(item, '.login-signup-link')" :data-key="item.key">
                  <span>没有账号？</span>
                  <span class="signup-text">{{ item.customLabel || '立即注册' }}</span>
                </div>

                <!-- 自定义元素预览 -->
                <div v-if="item.key.startsWith('custom_') && item.enabled" class="login-custom-field" :style="getItemStyle(item, '.login-custom-field')" :data-key="item.key">
                  <template v-if="item.type === 'checkbox'">
                    <label class="preview-remember" :style="getItemStyle(item, '.preview-remember')">
                      <div class="preview-check-box" :style="getItemStyle(item, '.preview-check-box')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <span>{{ item.customLabel || item.label }}</span>
                    </label>
                  </template>
                  <template v-else-if="item.type === 'link'">
                    <span class="preview-forget-link" :style="getItemStyle(item, '.preview-forget-link')">{{ item.customLabel || item.label }}</span>
                  </template>
                  <template v-else-if="item.type === 'button' || (item.cssContent && /\.login-button/.test(item.cssContent))">
                    <div class="login-button-box" :style="getItemStyle(item, '.login-button-box')">
                      <button
                        class="login-button"
                        :style="getItemStyle(item, '.login-button', hoveredKey === item.key)"
                        @mouseenter="hoveredKey = item.key"
                        @mouseleave="hoveredKey = null"
                      >{{ item.customLabel || item.label }}</button>
                    </div>
                  </template>
                  <template v-else>
                    <div class="login-username" :style="getItemStyle(item, '.login-username')">
                      <div class="login-username-input" :style="getItemStyle(item, '.login-username-input')">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span class="field-placeholder">{{ item.placeholder || item.label }}</span>
                      </div>
                    </div>
                  </template>
                </div>

                <!-- 预设元素：手机号 -->
                <div v-if="item.key === 'phone' && item.enabled" class="login-username" :style="getItemStyle(item, '.login-username')" :data-key="item.key">
                  <div class="login-username-input" :style="getItemStyle(item, '.login-username-input')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                      <rect x="5" y="2" width="14" height="20" rx="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
                    </svg>
                    <span class="field-placeholder">{{ item.placeholder || item.label }}</span>
                  </div>
                </div>

                <!-- 预设元素：邮箱 -->
                <div v-if="item.key === 'email' && item.enabled" class="login-username" :style="getItemStyle(item, '.login-username')" :data-key="item.key">
                  <div class="login-username-input" :style="getItemStyle(item, '.login-username-input')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span class="field-placeholder">{{ item.placeholder || item.label }}</span>
                  </div>
                </div>

                <!-- 预设元素：验证码 -->
                <div v-if="item.key === 'captcha' && item.enabled" class="login-username" :style="getItemStyle(item, '.login-username')" :data-key="item.key">
                  <div class="login-username-input" :style="getItemStyle(item, '.login-username-input')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="field-icon">
                      <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    <span class="field-placeholder">{{ item.placeholder || item.label }}</span>
                  </div>
                </div>

                <!-- 预设元素：记住我 / 自动登录 -->
                <div v-if="(item.key === 'remember' || item.key === 'autoLogin') && item.enabled" class="login-forget-password" :style="getItemStyle(item, '.login-forget-password')" :data-key="item.key">
                  <label class="preview-remember" :style="getItemStyle(item, '.preview-remember')">
                    <div class="preview-check-box" :style="getItemStyle(item, '.preview-check-box')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <span>{{ item.customLabel || item.label }}</span>
                  </label>
                </div>

                <!-- 预设元素：底部链接 -->
                <div v-if="item.key === 'footer' && item.enabled" class="login-signup-link" :style="getItemStyle(item, '.login-signup-link')" :data-key="item.key">
                  <span class="preview-forget-link" :style="getItemStyle(item, '.preview-forget-link')">{{ item.customLabel || item.label }}</span>
                </div>

              </template>

            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { reactive, ref, computed } from 'vue'
  import { getLoginItems, saveLoginItems } from '@/api/loginItems.js'

  const loading = ref(true)
  const loadError = ref('')

  const toast = ref({ show: false, type: 'success', message: '' })
  let toastTimer = null

  const cssEditor = ref({ visible: false, item: null, code: '' })

  const showToast = (message, type = 'success') => {
    if (toastTimer) clearTimeout(toastTimer)
    toast.value = { show: true, type, message }
    toastTimer = setTimeout(() => { toast.value.show = false }, 2500)
  }

  // 默认配置（当接口无数据时兜底）
  const defaultItems = [
    { key: 'backButton', label: '返回按钮', enabled: true, customLabel: '', placeholder: '', sortOrder: 1, cssContent: '.back-button { top: 65px; left: 15px; position: absolute; } .back-inner-button{}' },
    { key: 'logo', label: 'Logo', enabled: true, customLabel: '', placeholder: '', sortOrder: 2, cssContent: '.login-logo-box {}' },
    { key: 'username', label: '用户名', enabled: true, customLabel: '', placeholder: '用户名、Email或手机号', sortOrder: 3, cssContent: '.login-username {} .login-username-input{}' },
    { key: 'password', label: '密码', enabled: true, customLabel: '', placeholder: '密码', sortOrder: 4, cssContent: '.login-password {} .login-password-input{}' },
    { key: 'forgetPassword', label: '忘记密码？', enabled: true, customLabel: '', placeholder: '', sortOrder: 5, cssContent: '.login-forget-password { display: inline-flex; justify-content: space-between; width: 320px; margin-bottom: 25px; }', ruleOptions: ['下次自动登录 - 真', '下次自动登录 - 假'] },
    { key: 'loginButton', label: '登录按钮', enabled: true, customLabel: '', placeholder: '', sortOrder: 6, cssContent: '.login-button-box { margin-bottom: 5px; } .login-button { width: 100%; }' },
    { key: 'provider', label: '提供商', enabled: true, customLabel: '', placeholder: '', sortOrder: 7, cssContent: '.provider-img { width: 30px; margin: 5px; } .provider-big-img { margin-bottom: 10px; }', ruleOptions: ['大图标', '小图标'] },
    { key: 'signupLink', label: '注册链接', enabled: true, customLabel: '立即注册', placeholder: '', sortOrder: 8, cssContent: '.login-signup-link { margin-bottom: 24px; display: flex; justify-content: end; }' }
  ]

  const itemsArr = reactive([])

  const getItem = (key) => itemsArr.find(i => i.key === key) || {}

  const sortedItems = computed(() =>
    [...itemsArr].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  )

  const moveUp = (index) => {
    const list = sortedItems.value
    const curr = list[index]
    const prev = list[index - 1]
    if (!curr || !prev) return
    const tmp = curr.sortOrder
    curr.sortOrder = prev.sortOrder
    prev.sortOrder = tmp
  }

  const moveDown = (index) => {
    const list = sortedItems.value
    const curr = list[index]
    const next = list[index + 1]
    if (!curr || !next) return
    const tmp = curr.sortOrder
    curr.sortOrder = next.sortOrder
    next.sortOrder = tmp
  }

  // 删除元素
  const handleDelete = (index) => {
    const list = sortedItems.value
    if (index < 0 || index >= list.length) return
    const item = list[index]
    const realIdx = itemsArr.findIndex(i => i.key === item.key)
    if (realIdx !== -1) itemsArr.splice(realIdx, 1)
  }

  // 添加新元素（从预设类型选择）
  const addItemPool = [
    { key: 'phone', label: '手机号', type: 'text', placeholder: '请输入手机号' },
    { key: 'email', label: '邮箱', type: 'text', placeholder: '请输入邮箱' },
    { key: 'captcha', label: '验证码', type: 'text', placeholder: '请输入验证码' },
    { key: 'remember', label: '记住我', type: 'checkbox', placeholder: '' },
    { key: 'autoLogin', label: '自动登录', type: 'checkbox', placeholder: '' },
    { key: 'footer', label: '底部链接', type: 'link', placeholder: '' },
  ]

  const handleAdd = () => {
    // 找出已存在哪些 key，避免重复
    const existingKeys = new Set(itemsArr.map(i => i.key))
    const available = addItemPool.filter(p => !existingKeys.has(p.key))
    if (available.length === 0) {
      showToast('没有更多可添加的预设元素', 'error')
      return
    }
    const p = available[0]
    const maxSort = itemsArr.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), 0)
    itemsArr.push({
      key: p.key,
      label: p.label,
      enabled: true,
      customLabel: '',
      placeholder: p.placeholder,
      sortOrder: maxSort + 1,
      cssContent: '',
      ruleOptions: null
    })
    showToast(`已添加「${p.label}」`, 'success')
  }

  // 添加自定义项 - 弹窗编辑表单
  const customForm = ref({
    visible: false,
    label: '',
    customLabel: '',
    placeholder: '',
    cssContent: '',
    type: 'text'
  })

  const handleAddCustom = () => {
    customForm.value = {
      visible: true,
      label: '',
      customLabel: '',
      placeholder: '',
      cssContent: '',
      type: 'text'
    }
  }

  const confirmAddCustom = () => {
    if (!customForm.value.label.trim()) {
      showToast('请输入标签名称', 'error')
      return
    }
    const customKey = 'custom_' + Date.now()
    const maxSort = itemsArr.reduce((m, i) => Math.max(m, i.sortOrder ?? 0), 0)
    itemsArr.push({
      key: customKey,
      label: customForm.value.label.trim(),
      type: customForm.value.type,
      enabled: true,
      customLabel: customForm.value.customLabel,
      placeholder: customForm.value.placeholder,
      sortOrder: maxSort + 1,
      cssContent: customForm.value.cssContent,
      ruleOptions: null
    })
    customForm.value.visible = false
    clearCssCache()
    showToast(`已添加「${customForm.value.label.trim()}」`, 'success')
  }

  // name → key 的反向映射
  const nameToKey = {
    'back-button': 'backButton',
    'login-logo': 'logo',
    'username': 'username',
    'password': 'password',
    'forget-password': 'forgetPassword',
    'login-button': 'loginButton',
    'provider': 'provider',
    'signup-link': 'signupLink',
    'phone': 'phone',
    'email': 'email',
    'captcha': 'captcha',
    'remember': 'remember',
    'auto-login': 'autoLogin',
    'footer': 'footer'
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
    signupLink: 'signup-link',
    phone: 'phone',
    email: 'email',
    captcha: 'captcha',
    remember: 'remember',
    autoLogin: 'auto-login',
    footer: 'footer'
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
    signupLink: 'link',
    phone: 'text',
    email: 'text',
    captcha: 'text',
    remember: 'checkbox',
    autoLogin: 'checkbox',
    footer: 'link'
  }

  // 根据 defaultItems 的默认值填充缺失字段
  const fillDefaults = (key) => {
    const def = defaultItems.find(d => d.key === key)
    return def ? { ...def } : null
  }

  // 将后端返回的数组转为内部格式
  const parseApiResponse = (apiItems) => {
    if (!Array.isArray(apiItems) || apiItems.length === 0) return

    // 按 placeholder（sortOrder）排序，保持正确的显示顺序
    const sorted = [...apiItems].sort((a, b) => (parseInt(a.placeholder) || 0) - (parseInt(b.placeholder) || 0))

    for (const apiItem of sorted) {
      // 预设类型用映射，自定义项（custom_xxx）直接用 name 作为 key
      const key = nameToKey[apiItem.name] || (apiItem.name.startsWith('custom_') ? apiItem.name : null)
      if (!key) continue

      const existing = itemsArr.find(i => i.key === key)
      const sortOrder = apiItem.placeholder != null ? parseInt(apiItem.placeholder) : (existing?.sortOrder ?? null)

      if (existing) {
        // 已有项：更新所有字段
        existing.enabled = !!apiItem.visible
        existing.customLabel = apiItem.label || existing.label || ''
        existing.cssContent = apiItem.cssCode || ''
        existing.placeholder = existing.placeholder || ''
        existing.sortOrder = sortOrder
        existing.type = apiItem.type || existing.type || keyToType[key] || 'text'
      } else {
        // 全新项：从 defaultItems 合并默认值后插入
        const def = fillDefaults(key)
        itemsArr.push({
          key,
          label: def?.label || apiItem.label || key,
          type: apiItem.type || keyToType[key] || 'text',
          enabled: !!apiItem.visible,
          customLabel: apiItem.label || '',
          placeholder: def?.placeholder || '',
          sortOrder,
          cssContent: apiItem.cssCode || def?.cssContent || '',
          ruleOptions: def?.ruleOptions || null
        })
      }
    }
  }

  // hover 状态跟踪（用于各组件 hover 样式）
  const hoveredKey = ref(null)

  // hover 状态跟踪：元素类型（用于 handle/forgetPassword 等带勾选框的 hover）
  const checkboxChecked = reactive({})

  // 通用 CSS 解析器：解析 cssText，返回 selector → { normal: {}, hover: {} }
  const parseCSS = (cssText) => {
    const result = {}
    if (!cssText) return result

    const blockRegex = /([^{}]+?)\s*\{([\s\S]*?)\}\s*/g
    let blockMatch

    while ((blockMatch = blockRegex.exec(cssText)) !== null) {
      const selectors = blockMatch[1].trim()
      const body = blockMatch[2]
      const isHover = /:hover/i.test(selectors)

      // 多个选择器用逗号分隔
      for (const sel of selectors.split(',')) {
        const clean = sel.trim().replace(/:hover/gi, '').replace(/::?[\w-]+/g, '')
        if (!clean) continue
        if (!result[clean]) result[clean] = { normal: {}, hover: {} }
        const target = isHover ? result[clean].hover : result[clean].normal

        const declRegex = /([\w-]+)\s*:\s*([^;{}]+?)(?:\s*;|$)/g
        let decl

        while ((decl = declRegex.exec(body)) !== null) {
          const prop = decl[1].trim()
          const val = decl[2].trim()
          if (!prop || !val) continue
          target[prop] = val
        }
      }
    }

    return result
  }

  // 缓存：key → parsed CSS
  const cssCache = {}

  const getItemStyles = (item) => {
    if (!cssCache[item.key]) {
      cssCache[item.key] = parseCSS(item.cssContent)
    }
    return cssCache[item.key]
  }

  const getItemStyle = (item, selector, isHover = false) => {
    const styles = getItemStyles(item)
    const sel = styles[selector]
    if (!sel) return {}
    return isHover ? { ...sel.normal, ...sel.hover } : sel.normal
  }

  const clearCssCache = () => {
    Object.keys(cssCache).forEach(k => delete cssCache[k])
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
        parseApiResponse(apiItems)
      } else {
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
        type: item.type || keyToType[item.key] || 'text',
        placeholder: item.sortOrder
      }))

      const result = await saveLoginItems(payload)
      console.log('保存接口返回:', result)
      if (result?.code === 0 || result?.code === 200) {
        clearCssCache()
        showToast('保存成功', 'success')
      } else {
        showToast(result?.msg || result?.message || '保存失败', 'error')
      }
    } catch (err) {
      console.error('保存失败:', err)
      showToast('保存失败: ' + (err.message || '网络错误'), 'error')
    }
  }

  const openCssEditor = (item) => {
    cssEditor.value = { visible: true, item, code: item.cssContent || '' }
  }

  const closeCssEditor = () => {
    cssEditor.value = { visible: false, item: null, code: '' }
  }

  const saveCssCode = () => {
    if (cssEditor.value.item) {
      cssEditor.value.item.cssContent = cssEditor.value.code
      clearCssCache()
    }
    closeCssEditor()
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
  .btn-secondary { background: #a89cc8; color: white; border: none; padding: 6px 16px; border-radius: 4px; cursor: pointer; font-size: 13px; }
  .btn-add-custom { /* 与保存按钮同色，使用 .btn-primary 默认样式 */ }
  .btn-add-custom:hover { background: #4a2d96; }
  
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
    background: transparent; border-radius: 6px;
  }
  .field-icon, .eye-icon { color: #555; flex-shrink: 0; }
  .field-placeholder { flex: 1; font-size: 14px; color: #555; }
  .eye-icon { cursor: pointer; }

  .login-forget-password { display: inline-flex; justify-content: space-between; width: 100%; max-width: 320px; margin-bottom: 25px; align-items: center; }
  .preview-remember { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #111; }
  .preview-check-box {
    width: 16px; height: 16px; border-radius: 3px; display: flex; align-items: center; justify-content: center;
  }
  .preview-forget-link { font-size: 13px; cursor: pointer; }

  .login-button-box { width: 100%; max-width: 320px; margin-bottom: 25px; }
  .login-button {
    width: 100%; height: 42px; color: white; border: none; border-radius: 6px; font-size: 15px; cursor: pointer;
  }

  .preview-provider-box { width: 100%; max-width: 320px; margin-bottom: 25px; }
  .provider-button {
    width: 100%; height: 46px; border-radius: 6px; display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer;
  }
  .provider-img-circle {
    position: absolute; left: 15px; width: 28px; height: 28px; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;
  }
  .provider-text { font-size: 15px; font-weight: 500; }

  .login-signup-link { width: 100%; max-width: 320px; display: flex; justify-content: flex-end; font-size: 13px; color: #111; margin-bottom: 15px; }
  .signup-text { margin-left: 5px; cursor: pointer; }

  .login-custom-field { width: 100%; max-width: 320px; margin-bottom: 15px; display: flex; }

  .css-preview {
    width: 96%; height: 32px; padding: 0 10px; border-radius: 4px;
    border: 1px solid #dcdfe6; box-sizing: border-box;
    cursor: pointer; font-size: 13px; color: #606266; background: white;
    display: flex; align-items: center; outline: none; transition: border-color 0.2s;
  }
  .css-preview:hover { border-color: #8b5cf6; }
  .css-text { word-break: break-all; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 200px; display: block; }

  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 9999;
    display: flex; align-items: center; justify-content: center;
  }
  .css-editor-modal {
    background: #fff; border-radius: 8px; width: 600px; max-width: 90vw;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden;
    border: 1px solid #e4e7ed;
  }
  .css-editor-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid #ebeef5; background: #fafafa;
  }
  .css-editor-title { font-size: 14px; font-weight: 600; color: #303133; }
  .css-editor-close { background: none; border: none; cursor: pointer; padding: 2px; color: #909399; display: flex; }
  .css-editor-close:hover { color: #606266; }
  .css-editor-body { padding: 16px 20px; flex: 1; }
  .css-textarea {
    width: 100%; height: 280px; resize: vertical;
    font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 13px;
    padding: 6px 10px; border-radius: 6px; border: 1px solid #dcdfe6;
    outline: none; box-sizing: border-box; color: #333; line-height: 1.5;
    background: white;
  }
  .css-textarea:focus { border-color: #8b5cf6; }
  .css-editor-footer {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 12px 20px; border-top: 1px solid #ebeef5;
  }
  .css-btn { padding: 7px 18px; border-radius: 4px; font-size: 13px; cursor: pointer; border: 1px solid; transition: all 0.2s; }
  .css-btn-cancel { background: white; color: #606266; border-color: #dcdfe6; }
  .css-btn-cancel:hover { color: #8b5cf6; border-color: #8b5cf6; background: #f5f0ff; }
  .css-btn-save { background: #512da8; color: white; border-color: #512da8; }
  .css-btn-save:hover { background: #3b1c8f; border-color: #3b1c8f; }

  .custom-form-modal {
    background: #fff; border-radius: 8px; width: 700px; max-width: 90vw;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15); display: flex; flex-direction: column; overflow: hidden;
    border: 1px solid #e4e7ed;
  }
  .custom-form-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-bottom: 1px solid #ebeef5; background: #fafafa;
  }
  .custom-form-title { font-size: 14px; font-weight: 600; color: #303133; }
  .custom-form-body { padding: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
  .form-field { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 13px; color: #606266; font-weight: 500; }
  .form-field.full-width { grid-column: 1 / -1; }
  .custom-form-footer {
    display: flex; justify-content: flex-end; gap: 10px;
    padding: 12px 20px; border-top: 1px solid #ebeef5;
  }

  .modal-enter-active, .modal-leave-active { transition: opacity 0.2s; }
  .modal-enter-from, .modal-leave-to { opacity: 0; }
  .modal-enter-active .css-editor-modal, .modal-leave-active .css-editor-modal { transition: transform 0.2s; }
  .modal-enter-from .css-editor-modal, .modal-leave-to .css-editor-modal { transform: scale(0.95); }
  </style>