<template>
    <div class="settings-page">
        <header class="page-header">
            <button type="button" class="back-btn" @click="handleBack" aria-label="返回">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
            </button>
            <h1 class="page-title">设置</h1>
        </header>

        <section class="settings-section">
            <h2 class="section-title">基本设置</h2>
            <div class="setting-item">
                <label class="setting-label">接入地址:</label>
                <div class="setting-value">
                    <span>{{ accessAddress }}</span>
                    <button type="button" class="link-btn" @click="showAccessModal = true">切换</button>
                </div>
            </div>
            <div class="setting-item">
                <label class="setting-label">启动设置:</label>
                <div class="setting-value">
                    <label class="checkbox-wrap">
                        <input type="checkbox" v-model="autoStart" />
                        <span>开机自启动</span>
                    </label>
                </div>
            </div>
        </section>

        <section class="settings-section">
            <h2 class="section-title">关于</h2>
            <div class="setting-item">
                <label class="setting-label">当前版本:</label>
                <div class="setting-value">
                    <span class="version-text">{{ version }}</span>
                    <span class="version-tip">{{ versionTip }}</span>
                </div>
            </div>
        </section>

        <!-- 接入设置弹窗 -->
        <teleport to="body">
            <div v-if="showAccessModal" class="modal-overlay" @click.self="showAccessModal = false">
                <div class="access-modal">
                    <h2 class="modal-title">接入设置</h2>
                    <div class="modal-form">
                        <div class="form-group">
                            <input v-model="accessAddressInput" type="text" class="form-input" placeholder="请输入接入地址" />
                            <span class="input-icon dropdown-icon">▼</span>
                            <span class="input-icon shield-icon">🛡</span>
                        </div>
                        <div class="form-group">
                            <input v-model="securityCode" type="password" class="form-input" placeholder="请输入安全码" />
                            <span class="input-icon info-icon">ⓘ</span>
                        </div>
                        <button type="button" class="confirm-btn" @click="handleConfirmAccess">
                            确定接入
                        </button>
                    </div>
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const accessAddress = ref(localStorage.getItem('companyAddress') || 'https://vpn.seu.edu.cn')
const autoStart = ref(true)
const version = ref('V2.4.10.30')
const versionTip = ref('当前已为最新版本')

const showAccessModal = ref(false)
const accessAddressInput = ref('')
const securityCode = ref('')

watch(showAccessModal, (val) => {
    if (val) {
        accessAddressInput.value = accessAddress.value
        securityCode.value = ''
    }
})

const handleConfirmAccess = () => {
    if (accessAddressInput.value.trim()) {
        accessAddress.value = accessAddressInput.value.trim()
    }
    showAccessModal.value = false
    securityCode.value = ''
    // 接入逻辑可按需接入后端
}

const handleBack = () => {
    router.push('/')
}
</script>

<style scoped>
.settings-page {
    padding: 0;
    max-width: 600px;
    font-family: -apple-system, BlinkMacOSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
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

.settings-page .settings-section {
    padding: 0 24px 32px;
}

.settings-section:first-of-type {
    padding-top: 24px;
}

.settings-section {
    margin-bottom: 32px;
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 16px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    gap: 16px;
}

.setting-label {
    font-size: 14px;
    color: #475569;
    flex-shrink: 0;
}

.setting-value {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.link-btn {
    background: none;
    border: none;
    color: #3b82f6;
    font-size: 14px;
    cursor: pointer;
    padding: 0;
}

.link-btn:hover {
    text-decoration: underline;
}

/* 接入设置弹窗 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.access-modal {
    background: #fff;
    border-radius: 12px;
    padding: 32px;
    width: 90%;
    max-width: 440px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
}

.modal-title {
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 24px 0;
}

.modal-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-group {
    position: relative;
}

.form-input {
    width: 100%;
    padding: 12px 40px 12px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
}

.form-input:focus {
    outline: none;
    border-color: #3b82f6;
}

.input-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 12px;
    color: #94a3b8;
    pointer-events: none;
}

.dropdown-icon {
    right: 36px;
    font-size: 10px;
}

.shield-icon {
    right: 12px;
}

.info-icon {
    right: 12px;
}

.confirm-btn {
    width: 100%;
    padding: 12px 24px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 8px;
}

.confirm-btn:hover {
    background: #2563eb;
}

.checkbox-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
    color: #334155;
}

.checkbox-wrap input {
    width: 16px;
    height: 16px;
    cursor: pointer;
}

.version-text {
    color: #3b82f6;
    font-weight: 500;
}

.version-tip {
    color: #94a3b8;
    font-size: 13px;
}
</style>
