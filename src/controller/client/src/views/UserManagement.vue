<template>
    <div class="user-management">
        <!-- 搜索和操作栏 -->
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索用户名或邮箱..." class="search-input" />
                <button class="search-btn" @click="handleSearch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </div>
            <div class="toolbar-actions">
                <button class="btn btn-primary" @click="handleAdd">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加用户
                </button>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="60">序号</th>
                        <th>头像</th>
                        <th>用户名</th>
                        <th>邮箱</th>
                        <th class="phone-col">手机</th>
                        <th class="status-col">状态</th>
                        <th>创建时间</th>
                        <th class="spa-status-col">安全码</th>
                        <th class="spa-actions-col">SPA 操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(user, index) in pagedUsers" :key="user.id">
                        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td>
                            <div class="user-avatar">
                                <img v-if="user.avatar" :src="user.avatar" alt="avatar" />
                                <span v-else class="avatar-placeholder">{{ user.username.charAt(0).toUpperCase() }}</span>
                            </div>
                        </td>
                        <td>{{ user.username }}</td>
                        <td>{{ user.email }}</td>
                        <td class="phone-col">{{ user.phone }}</td>
                        <td class="status-col">
                            <span class="status-badge" :class="'status-' + user.status">{{ statusText(user.status) }}</span>
                        </td>
                        <td>{{ user.created_at }}</td>
                        <td class="spa-status-col">
                            <span class="spa-badge" :class="'spa-' + (user.spaStatus || 'none')">{{ spaStatusText(user.spaStatus) }}</span>
                        </td>
                        <td class="spa-actions-col">
                            <div class="spa-actions">
                                <button
                                    type="button"
                                    class="spa-btn spa-btn-primary"
                                    :disabled="primarySpaDisabled(user)"
                                    @click="onPrimarySpa(user)"
                                >
                                    {{ primarySpaLabel(user) }}
                                </button>
                                <button
                                    type="button"
                                    class="spa-btn spa-btn-secondary"
                                    :class="{ 'is-muted': secondarySpaDisabled(user) }"
                                    :disabled="secondarySpaDisabled(user)"
                                    @click="onSecondarySpa(user)"
                                >
                                    {{ secondarySpaLabel(user) }}
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredUsers.length === 0">
                        <td colspan="9" class="empty-cell">
                            <div class="empty-state">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                </svg>
                                <p>暂无用户数据</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 分页 -->
        <div class="pagination" v-if="totalCount > 0">
            <span class="pagination-info">共 {{ totalCount }} 条记录</span>
            <div class="pagination-controls">
                <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">上一页</button>
                <span class="page-num">{{ currentPage }} / {{ totalPages }}</span>
                <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">下一页</button>
            </div>
        </div>

        <!-- 添加用户弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
            <div class="add-user-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent"></span>
                        <h3 class="modal-title">添加用户</h3>
                        <p class="modal-subtitle">填写账号信息，系统默认头像由用户后续自行设置</p>
                    </div>
                    <button type="button" class="modal-close" @click="closeModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-field">
                            <label>用户名 <span class="required">*</span></label>
                            <input type="text" v-model="formData.username" class="field-input" placeholder="请输入用户名" autocomplete="off" />
                        </div>
                        <div class="form-field">
                            <label>密码 <span class="required">*</span></label>
                            <input type="password" v-model="formData.password" class="field-input" placeholder="请输入密码" autocomplete="new-password" />
                        </div>
                        <div class="form-field">
                            <label>邮箱</label>
                            <input type="email" v-model="formData.email" class="field-input" placeholder="name@example.com" />
                        </div>
                        <div class="form-field">
                            <label>手机</label>
                            <input type="text" v-model="formData.phone" class="field-input" placeholder="11 位手机号" />
                        </div>
                        <div class="form-field form-field-full">
                            <label>状态</label>
                            <select v-model="formData.status" class="field-input field-select">
                                <option value="active">正常</option>
                                <option value="frozen">冻结</option>
                                <option value="deleted">已删除</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modal btn-modal-ghost" @click="closeModal">取消</button>
                    <button type="button" class="btn-modal btn-modal-primary" @click="handleSubmit">确定添加</button>
                </div>
            </div>
        </div>

        <!-- 发放/更新成功：展示安全码 -->
        <div class="modal-overlay" v-if="showTokenModal" @click.self="showTokenModal = false">
            <div class="token-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent"></span>
                        <h3 class="modal-title">安全码已生成</h3>
                        <p class="modal-subtitle">请复制并安全交付给用户；关闭后需通过「更新安全码」重新轮转</p>
                    </div>
                    <button type="button" class="modal-close" @click="showTokenModal = false" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="token-box">
                        <code class="token-hex">{{ lastTokenHex }}</code>
                        <button type="button" class="btn-copy" @click="copyToken">复制</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modal btn-modal-primary" @click="showTokenModal = false">知道了</button>
                </div>
            </div>
        </div>

        <!-- 轻提示 -->
        <div class="toast" v-if="toastMessage">{{ toastMessage }}</div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { issueSpaToken, disableSpaToken, enableSpaToken } from '@/api/spaAdmin.js'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showModal = ref(false)
const showTokenModal = ref(false)
const lastTokenHex = ref('')
const toastMessage = ref('')
const loadingSpaUserId = ref(null)

let toastTimer = null
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

const users = ref([
    { id: 1, username: 'admin', password: '******', email: 'admin@company.com', phone: '13800138000', avatar: '', status: 'active', created_at: '2026-01-01 10:00:00', updated_at: '2026-01-01 10:00:00', spaStatus: 'none' },
    { id: 2, username: 'zhangsan', password: '******', email: 'zhangsan@company.com', phone: '13800138001', avatar: '', status: 'active', created_at: '2026-02-15 14:30:00', updated_at: '2026-02-15 14:30:00', spaStatus: 'none' },
    { id: 3, username: 'lisi', password: '******', email: 'lisi@company.com', phone: '13800138002', avatar: '', status: 'frozen', created_at: '2026-03-01 09:00:00', updated_at: '2026-03-10 16:00:00', spaStatus: 'none' }
])

const formData = ref({
    username: '',
    password: '',
    email: '',
    phone: '',
    avatar: '',
    status: 'active'
})

const statusText = (status) => {
    const map = { active: '正常', frozen: '冻结', deleted: '已删除' }
    return map[status] || status
}

const filteredUsers = computed(() => {
    if (!searchKeyword.value) return users.value
    const keyword = searchKeyword.value.toLowerCase()
    return users.value.filter(user =>
        user.username.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    )
})

const pagedUsers = computed(() => {
    const list = filteredUsers.value
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
})

const totalCount = computed(() => filteredUsers.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

const handleSearch = () => {
    currentPage.value = 1
}

const closeModal = () => {
    showModal.value = false
}

const handleAdd = () => {
    formData.value = { username: '', password: '', email: '', phone: '', avatar: '', status: 'active' }
    showModal.value = true
}

const handleSubmit = () => {
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-')
    const newId = Math.max(...users.value.map(u => u.id), 0) + 1
    users.value.push({
        ...formData.value,
        avatar: '',
        id: newId,
        created_at: now,
        updated_at: now,
        spaStatus: 'none'
    })
    closeModal()
}

function findUserIndex(id) {
    return users.value.findIndex(u => u.id === id)
}

function setUserSpaStatus(userId, status) {
    const i = findUserIndex(userId)
    if (i !== -1) users.value[i].spaStatus = status
}

const spaStatusText = (s) => {
    const map = { none: '未发放', issued: '已发放', disabled: '已禁用', updating: '更新中' }
    return map[s] || map.none
}

const primarySpaLabel = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'none') return '发放安全码'
    return '更新安全码'
}

const secondarySpaLabel = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'none') return '禁用安全码'
    if (s === 'disabled') return '启用安全码'
    return '禁用安全码'
}

const primarySpaDisabled = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'updating') return true
    return loadingSpaUserId.value === user.id
}

const secondarySpaDisabled = (user) => {
    const s = user.spaStatus || 'none'
    if (s === 'none') return true
    if (s === 'updating') return true
    return loadingSpaUserId.value === user.id
}

async function onPrimarySpa(user) {
    const s = user.spaStatus || 'none'
    const rotate = s !== 'none'
    const spaBeforeRotate = s
    loadingSpaUserId.value = user.id
    if (rotate) setUserSpaStatus(user.id, 'updating')
    try {
        const res = await issueSpaToken(user.id, rotate)
        if (res.code === 200 && typeof res.data === 'string' && res.data) {
            lastTokenHex.value = res.data
            showTokenModal.value = true
            setUserSpaStatus(user.id, 'issued')
            showToast(rotate ? '安全码已轮转' : '安全码已发放')
            return
        }
        if (res.code === 500 && String(res.message || '').includes('已有安全码')) {
            setUserSpaStatus(user.id, 'issued')
            showToast('该用户已有安全码，请使用「更新安全码」轮转')
            return
        }
        showToast(res.message || '操作失败')
    } catch (e) {
        showToast(e?.message || '网络错误')
    } finally {
        loadingSpaUserId.value = null
        const i = findUserIndex(user.id)
        if (i !== -1 && users.value[i].spaStatus === 'updating') {
            users.value[i].spaStatus = spaBeforeRotate === 'disabled' ? 'disabled' : 'issued'
        }
    }
}

async function onSecondarySpa(user) {
    const s = user.spaStatus || 'none'
    if (s === 'none') return
    loadingSpaUserId.value = user.id
    try {
        if (s === 'disabled') {
            const res = await enableSpaToken(user.id)
            if (res.code === 200 && Number(res.data) > 0) {
                setUserSpaStatus(user.id, 'issued')
                showToast('安全码已启用')
            } else {
                showToast(res.message || '启用失败')
            }
        } else {
            const res = await disableSpaToken(user.id)
            if (res.code === 200 && Number(res.data) > 0) {
                setUserSpaStatus(user.id, 'disabled')
                showToast('安全码已禁用')
            } else {
                showToast(res.message || '禁用失败')
            }
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    } finally {
        loadingSpaUserId.value = null
    }
}

async function copyToken() {
    try {
        await navigator.clipboard.writeText(lastTokenHex.value)
        showToast('已复制到剪贴板', 2000)
    } catch {
        showToast('复制失败，请手动选择复制')
    }
}
</script>

<style scoped>
.user-management {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.search-box {
    display: flex;
    align-items: center;
    background: #f5f7fa;
    border-radius: 8px;
    padding: 4px 12px;
}

.search-input {
    border: none;
    background: transparent;
    padding: 8px;
    outline: none;
    width: 200px;
    font-size: 14px;
}

.search-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #909399;
    padding: 4px;
}

.search-btn:hover {
    color: #409eff;
}

.toolbar-actions {
    display: flex;
    gap: 12px;
}

.btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    border: 1px solid #dcdfe6;
    border-radius: 6px;
    background: white;
    color: #606266;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn:hover {
    border-color: #409eff;
    color: #409eff;
}

.btn-primary {
    background: #409eff;
    border-color: #409eff;
    color: white;
}

.btn-primary:hover {
    background: #66b1ff;
    border-color: #66b1ff;
    color: white;
}

.table-container {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th,
.data-table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
}

.data-table th {
    background: #fafafa;
    font-weight: 600;
    color: #606266;
    font-size: 14px;
}

.data-table th.phone-col,
.data-table td.phone-col {
    padding-left: 10px;
}

.data-table th.status-col,
.data-table td.status-col {
    width: 96px;
    text-align: left;
    padding-left: 10px;
}

.data-table tbody tr:hover {
    background: #f5f7fa;
}

.user-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.avatar-placeholder {
    color: #fff;
    font-weight: 600;
    font-size: 14px;
}

.status-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
}

.status-active {
    background: #f6ffed;
    color: #52c41a;
}

.status-frozen {
    background: #fff7e6;
    color: #fa8c16;
}

.status-deleted {
    background: #f5f5f5;
    color: #999;
}

.data-table th.spa-status-col,
.data-table td.spa-status-col {
    width: 96px;
    white-space: nowrap;
}

.data-table th.spa-actions-col,
.data-table td.spa-actions-col {
    min-width: 200px;
}

.spa-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 64px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
}

.spa-none {
    background: #f4f4f5;
    color: #909399;
}

.spa-issued {
    background: #ecfdf5;
    color: #059669;
}

.spa-disabled {
    background: #fef2f2;
    color: #dc2626;
}

.spa-updating {
    background: #eff6ff;
    color: #2563eb;
}

.spa-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
}

.spa-btn {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}

.spa-btn:disabled {
    opacity: 0.55;
    cursor: not-allowed;
}

.spa-btn-primary {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
}

.spa-btn-primary:hover:not(:disabled) {
    background: #66b1ff;
    border-color: #66b1ff;
}

.spa-btn-secondary {
    background: #fff;
    border-color: #e2e8f0;
    color: #475569;
}

.spa-btn-secondary:hover:not(:disabled) {
    border-color: #409eff;
    color: #409eff;
}

.spa-btn-secondary.is-muted {
    opacity: 0.45;
}

.token-modal {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
}

.token-box {
    display: flex;
    align-items: stretch;
    gap: 10px;
    padding: 4px 0 8px;
}

.token-hex {
    flex: 1;
    display: block;
    padding: 12px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 13px;
    word-break: break-all;
    color: #0f172a;
    line-height: 1.5;
}

.btn-copy {
    flex-shrink: 0;
    padding: 10px 16px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #409eff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
}

.btn-copy:hover {
    border-color: #409eff;
    background: #f0f9ff;
}

.toast {
    position: fixed;
    left: 50%;
    bottom: 32px;
    transform: translateX(-50%);
    z-index: 1100;
    padding: 10px 18px;
    border-radius: 10px;
    background: rgba(15, 23, 42, 0.92);
    color: #fff;
    font-size: 14px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    max-width: min(90vw, 420px);
    text-align: center;
}

.data-table td.empty-cell {
    text-align: center !important;
    padding: 60px 16px !important;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
}

.empty-state svg {
    display: block;
    margin: 0 auto 16px;
}

.empty-state p {
    margin: 0;
    text-align: center;
}

.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
}

.pagination-info {
    color: #909399;
    font-size: 14px;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-btn {
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background: white;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
    border-color: #409eff;
    color: #409eff;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-num {
    color: #606266;
    font-size: 14px;
}

.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.45);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
}

.add-user-modal {
    width: 100%;
    max-width: 520px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 22px 24px 18px;
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border-bottom: 1px solid #e2e8f0;
}

.modal-title-wrap {
    min-width: 0;
}

.modal-title-accent {
    display: block;
    width: 36px;
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    margin-bottom: 10px;
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.modal-subtitle {
    margin: 6px 0 0;
    font-size: 13px;
    color: #64748b;
    line-height: 1.45;
}

.modal-close {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 10px;
    background: #f1f5f9;
    color: #64748b;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
}

.modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.modal-body {
    padding: 20px 24px 8px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px 20px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-field-full {
    grid-column: 1 / -1;
}

.form-field label {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
}

.form-field label .required {
    color: #f56c6c;
    margin-left: 2px;
}

.field-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.field-input::placeholder {
    color: #94a3b8;
}

.field-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.field-select {
    cursor: pointer;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    padding: 16px 24px 20px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
}

.btn-modal {
    min-width: 96px;
    padding: 10px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
}

.btn-modal-ghost {
    border: 1px solid #e2e8f0;
    background: #fff;
    color: #475569;
}

.btn-modal-ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
}

.btn-modal-primary {
    border: none;
    background: linear-gradient(180deg, #409eff 0%, #3a8ee6 100%);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.btn-modal-primary:hover {
    background: linear-gradient(180deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.35);
}

@media (max-width: 540px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
