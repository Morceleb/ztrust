<template>
    <div class="terminal-page">
        <header class="page-header">
            <button type="button" class="back-btn" @click="handleBack" aria-label="返回">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
            </button>
            <h1 class="page-title">终端管理</h1>
        </header>

        <div class="page-body">
            <div class="hint">
                授信终端（授信后该设备下次登录可免二次认证，如需取消可在此移除）
            </div>

            <!-- 加载中 -->
            <div v-if="loading" class="terminal-loading">
                <span>加载中...</span>
            </div>

            <template v-else>
                <div class="section">
                    <div class="section-title">授信终端</div>
                    <div class="terminal-list">
                        <div v-for="t in trustedTerminals" :key="t.id" class="terminal-row">
                            <div class="terminal-left">
                                <div class="os-icon" :class="t.os">
                                    <span class="os-text">{{ t.osLabel }}</span>
                                </div>
                            </div>

                            <div class="terminal-main">
                                <div class="terminal-top">
                                    <div class="terminal-name">{{ t.name }}</div>
                                    <span v-if="t.isCurrent" class="tag current">当前设备</span>
                                </div>
                                <div class="terminal-meta">
                                    <span class="meta-item">设备类型：{{ t.deviceType }}</span>
                                    <span class="dot">•</span>
                                    <span class="meta-item">{{ t.location }}（{{ t.ip }}）</span>
                                    <span class="dot">•</span>
                                    <span class="meta-item">{{ t.lastSeen }}</span>
                                </div>
                            </div>

                            <div class="terminal-right">
                                <button
                                    type="button"
                                    class="danger-outline"
                                    @click="openRemoveConfirm(t)"
                                >
                                    移除授信终端
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">临时终端（临时登录设备及历史记录）</div>
                    <div class="terminal-list">
                        <div v-for="t in temporaryTerminals" :key="t.id" class="terminal-row">
                            <div class="terminal-left">
                                <div class="os-icon" :class="t.os">
                                    <span class="os-text">{{ t.osLabel }}</span>
                                </div>
                            </div>

                            <div class="terminal-main">
                                <div class="terminal-top">
                                    <div class="terminal-name">{{ t.name }}</div>
                                    <span v-if="t.isCurrent" class="tag current">当前设备</span>
                                </div>
                                <div class="terminal-meta">
                                    <span class="meta-item">设备类型：{{ t.deviceType }}</span>
                                    <span class="dot">•</span>
                                    <span class="meta-item">{{ t.location }}（{{ t.ip }}）</span>
                                    <span class="dot">•</span>
                                    <span class="meta-item">{{ t.lastSeen }}</span>
                                </div>
                            </div>

                            <div class="terminal-right" />
                        </div>
                        <div v-if="temporaryTerminals.length === 0" class="terminal-empty">
                            暂无临时终端记录
                        </div>
                    </div>
                </div>
            </template>
        </div>

        <!-- 移除授信终端确认弹窗（格式与注销登录一致） -->
        <teleport to="body">
            <Transition name="modal-fade">
                <div v-if="showRemoveModal" class="remove-modal-overlay" @click.self="closeRemoveConfirm">
                    <div class="remove-modal">
                        <div class="remove-modal-header">
                            <span class="remove-modal-title">移除授信终端</span>
                            <button type="button" class="remove-modal-close" @click="closeRemoveConfirm">✕</button>
                        </div>
                        <div class="remove-modal-body">
                            <div class="remove-modal-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                                    stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                            </div>
                            <span class="remove-modal-text">确定要移除此授信终端吗?</span>
                        </div>
                        <div class="remove-modal-footer">
                            <div v-if="removeError" class="remove-error">{{ removeError }}</div>
                            <button type="button" class="remove-btn-confirm" :disabled="removeLoading" @click="confirmRemoveTrusted">
                                <span v-if="removeLoading">移除中...</span>
                                <span v-else>确定</span>
                            </button>
                            <button type="button" class="remove-btn-cancel" :disabled="removeLoading" @click="closeRemoveConfirm">取消</button>
                        </div>
                    </div>
                </div>
            </Transition>
        </teleport>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDeviceInfo, getLoginSessionInfo } from '@/utils/tauriApi'
import store from '@/store'

const router = useRouter()

const deviceInfo = ref(null)
const sessionInfo = ref(null)
const loading = ref(true)
const locationLoading = ref(true)

onMounted(async () => {
    try {
        // 快速数据先加载
        const dev = await getDeviceInfo()
        deviceInfo.value = dev
        sessionInfo.value = { ip: '查询中...', localIp: '-', location: '查询中...', loginTime: '-' }
        loading.value = false
        // 登录时间同步获取
        const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-')
        if (sessionInfo.value) sessionInfo.value.loginTime = now
        // 单独异步查询会话信息（含 IP + 位置）
        getLoginSessionInfo().then(sess => {
            if (sess) {
                sessionInfo.value = sess
            }
        }).catch(() => {
            if (sessionInfo.value) {
                sessionInfo.value.ip = '获取失败'
                sessionInfo.value.location = '未知'
            }
        }).finally(() => {
            locationLoading.value = false
        })
    } catch (e) {
        console.error('获取设备信息失败:', e)
        loading.value = false
    }
})

// 从 store 获取用户信息
const user = computed(() => store.getters['auth/user'] || {})
const lastLoginInfo = computed(() => user.value?.lastLoginInfo || {})

// 根据 platform 返回 OS 类型
const getOsClass = (platform) => {
    const p = (platform || '').toLowerCase()
    if (p.includes('windows')) return 'windows'
    if (p.includes('mac') || p.includes('apple')) return 'apple'
    return 'windows'
}

const getOsLabel = (platform) => {
    const p = (platform || '').toLowerCase()
    if (p.includes('mac') || p.includes('apple')) return ''
    return '⊞'
}

// 授信终端 = 当前设备（从 getDeviceInfo + getLoginSessionInfo 获取真实信息）
const trustedTerminals = computed(() => {
    if (!deviceInfo.value) return []
    const info = deviceInfo.value
    const sess = sessionInfo.value || {}
    return [
        {
            id: localStorage.getItem('ztrust_device_id') || '',
            os: getOsClass(info.platform),
            osLabel: getOsLabel(info.platform),
            name: info.os_version || 'Windows',
            isCurrent: true,
            deviceType: info.os_version || '',
            location: sess.location || '-',
            ip: sess.ip || '-',
            lastSeen: sess.loginTime || '-',
        },
    ]
})

// 临时终端暂无后端数据，预留结构
const temporaryTerminals = ref([])

const showRemoveModal = ref(false)
const terminalToRemove = ref(null)
const removeLoading = ref(false)
const removeError = ref('')

// 辅助函数：构建完整 API 地址
// companyAddress 可能是 47.120.25.166:8900 格式或完整 URL
const buildApiUrl = (path) => {
    const companyAddress = localStorage.getItem('companyAddress')
    if (!companyAddress) {
        console.warn('[终端管理] companyAddress 为空')
        return null
    }
    // 如果已经是完整 URL
    if (companyAddress.startsWith('http')) {
        return `${companyAddress}${path}`
    }
    // 如果只是 host:port，添加 http://
    return `http://${companyAddress}${path}`
}

const handleBack = () => {
    router.push('/')
}

const openRemoveConfirm = (t) => {
    console.log('[终端管理] 打开移除确认, 设备:', t)
    terminalToRemove.value = t
    removeError.value = ''
    showRemoveModal.value = true
}

const closeRemoveConfirm = () => {
    showRemoveModal.value = false
    terminalToRemove.value = null
}

const confirmRemoveTrusted = async () => {
    if (!terminalToRemove.value) {
        console.error('[终端管理] terminalToRemove 为空')
        return
    }

    const deviceId = terminalToRemove.value.id
    console.log('[终端管理] 开始移除授信终端, 设备ID:', deviceId)

    removeLoading.value = true
    removeError.value = ''

    try {
        const apiUrl = buildApiUrl(`/auth/devices/${deviceId}`)
        if (!apiUrl) {
            removeError.value = '未配置公司地址'
            return
        }
        console.log('[终端管理] 请求地址:', apiUrl)
        const token = sessionStorage.getItem('auth_token')
        const res = await fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            },
        })

        console.log('[终端管理] 响应状态:', res.status)
        const result = await res.json()
        console.log('[终端管理] 响应数据:', result)

        if (res.ok || result.code === 200) {
            console.log('[终端管理] 移除成功')
            closeRemoveConfirm()
        } else {
            removeError.value = result.message || '移除失败，请重试'
        }
    } catch (err) {
        console.error('[终端管理] 请求失败:', err)
        removeError.value = '移除失败，请检查网络'
    } finally {
        removeLoading.value = false
    }
}
</script>

<style scoped>
.terminal-page {
    min-height: 100%;
    background: #ffffff;
    border-radius: 12px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-header {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    color: #475569;
    cursor: pointer;
    border-radius: 8px;
    transition: background 0.2s, color 0.2s;
}
.back-btn:hover {
    background: #f1f5f9;
    color: #1e293b;
}

.page-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.page-body {
    padding: 12px 16px 20px;
}

.hint {
    font-size: 12px;
    color: rgba(15, 23, 42, 0.55);
    margin: 2px 0 14px;
}

.terminal-loading {
    text-align: center;
    padding: 32px 0;
    font-size: 14px;
    color: rgba(15, 23, 42, 0.45);
}

.terminal-empty {
    text-align: center;
    padding: 24px 0;
    font-size: 13px;
    color: rgba(15, 23, 42, 0.40);
}

.section + .section {
    margin-top: 18px;
}

.section-title {
    font-size: 13px;
    font-weight: 700;
    color: #0f172a;
    margin-bottom: 10px;
}

.terminal-list {
    display: grid;
    gap: 10px;
}

.terminal-row {
    display: grid;
    grid-template-columns: 34px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 12px 12px;
    border: 1px solid rgba(15, 23, 42, 0.06);
    border-radius: 10px;
    background: #ffffff;
}

.os-icon {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: #111827;
    background: rgba(59, 130, 246, 0.08);
    border: 1px solid rgba(59, 130, 246, 0.14);
    font-weight: 700;
}

.os-icon.apple {
    background: rgba(148, 163, 184, 0.15);
    border-color: rgba(148, 163, 184, 0.25);
}

.os-text {
    font-size: 14px;
    line-height: 1;
}

.terminal-top {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
}

.terminal-name {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
}

.tag {
    display: inline-flex;
    align-items: center;
    height: 18px;
    padding: 0 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    border: 1px solid transparent;
    line-height: 1;
}

.tag.current {
    color: #2563eb;
    background: rgba(37, 99, 235, 0.10);
    border-color: rgba(37, 99, 235, 0.18);
}

.terminal-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 12px;
    color: rgba(15, 23, 42, 0.55);
}

.dot {
    opacity: 0.7;
}

.danger-outline {
    height: 30px;
    padding: 0 12px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #ef4444;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
    white-space: nowrap;
}

.danger-outline:hover {
    background: rgba(239, 68, 68, 0.06);
    border-color: rgba(239, 68, 68, 0.55);
}

.danger-outline:active {
    transform: translateY(0.5px);
}

/* 移除授信终端确认弹窗（与注销登录弹窗格式一致） */
.remove-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.remove-modal {
    position: relative;
    background: #fff;
    border-radius: 8px;
    width: 380px;
    padding: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    overflow: hidden;
}

.remove-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 14px 20px;
    border-bottom: 1px solid #f0f0f0;
}

.remove-modal-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
}

.remove-modal-close {
    background: none;
    border: none;
    font-size: 16px;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
    padding: 2px 4px;
}

.remove-modal-close:hover {
    color: #475569;
}

.remove-modal-body {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px 28px 20px;
    margin-bottom: 0;
}

.remove-modal-icon {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    background: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
}

.remove-modal-text {
    font-size: 15px;
    color: #1e293b;
    font-weight: 500;
}

.remove-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 28px 20px;
}

.remove-btn-confirm {
    padding: 7px 24px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.remove-btn-confirm:hover {
    background: #2563eb;
}

.remove-btn-cancel {
    padding: 7px 24px;
    background: #fff;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.remove-btn-cancel:hover {
    background: #f1f5f9;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>

