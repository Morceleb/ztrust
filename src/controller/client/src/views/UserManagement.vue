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
                                <span v-else class="avatar-placeholder">{{ (user.name || user.username || '?').charAt(0).toUpperCase() }}</span>
                            </div>
                        </td>
                        <td>{{ user.name || user.username }}</td>
                        <td>{{ user.email }}</td>
                        <td class="phone-col">{{ user.phone }}</td>
                        <td class="status-col">
                            <span class="status-badge" :class="'status-' + getUserStatus(user)">{{ statusText(getUserStatus(user)) }}</span>
                        </td>
                        <td>{{ formatTime(user.createdTime) }}</td>
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
import { ref, computed, onMounted } from 'vue'
import { listUsers, issueSpaToken as apiIssue, disableSpaToken as apiDisable, enableSpaToken as apiEnable } from '@/api/user.js'

const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)

const showTokenModal = ref(false)
const lastTokenHex = ref('')
const toastMessage = ref('')
const loadingSpaUserId = ref(null)
const users = ref([])

let toastTimer = null
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

async function fetchUsers() {
    loading.value = true
    try {
        const res = await listUsers({ page: currentPage.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
        if (res.code === 200 && res.data) {
            // 标准结构：{ code: 200, data: { list: [...], total: N } }
            users.value = Array.isArray(res.data.list) ? res.data.list : (Array.isArray(res.data) ? res.data : [])
            totalCount.value = res.data.total || users.value.length
        } else if (Array.isArray(res)) {
            // 后端直接返回数组：[{...}, {...}]
            users.value = res
            totalCount.value = res.length
        }
    } catch (e) {
        showToast(e?.message || '加载用户列表失败')
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchUsers()
})

const handleSearch = () => {
    currentPage.value = 1
    fetchUsers()
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
        console.log('发放安全码请求:', { userId: user.id, rotate })
        const res = await apiIssue(user.id, rotate)
        console.log('发放安全码响应:', res)
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
        console.error('发放安全码异常:', e)
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
            const res = await apiEnable(user.id)
            if (res.code === 200 && Number(res.data) > 0) {
                setUserSpaStatus(user.id, 'issued')
                showToast('安全码已启用')
            } else {
                showToast(res.message || '启用失败')
            }
        } else {
            const res = await apiDisable(user.id)
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

const statusText = (status) => {
    const map = { active: '正常', frozen: '冻结', deleted: '已删除' }
    return map[status] || status || 'active'
}

const getUserStatus = (user) => {
    if (user.isDeleted) return 'deleted'
    if (user.isForbidden) return 'frozen'
    return 'active'
}

const formatTime = (time) => {
    if (!time) return '-'
    return time.replace('T', ' ').substring(0, 19)
}

const filteredUsers = computed(() => {
    if (!searchKeyword.value) return users.value
    const keyword = searchKeyword.value.toLowerCase()
    return users.value.filter(user =>
        (user.username || '').toLowerCase().includes(keyword) ||
        (user.email || '').toLowerCase().includes(keyword)
    )
})

const pagedUsers = computed(() => {
    const list = filteredUsers.value
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)
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

.data-table tbody tr {
    height: 56px;
}

.data-table td {
    vertical-align: middle;
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
    gap: 8px;
    align-items: center;
    white-space: nowrap;
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
    display: flex;
    flex-direction: column;
    max-height: 90vh;
}

/* 遮罩层 */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
}

/* 弹窗头部 */
.modal-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px 24px 0;
    gap: 12px;
}

.modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 10px;
}

.modal-title-accent {
    display: block;
    width: 4px;
    height: 20px;
    background: linear-gradient(180deg, #409eff, #66b1ff);
    border-radius: 2px;
    flex-shrink: 0;
}

.modal-title {
    margin: 0;
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
}

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #94a3b8;
    line-height: 1.5;
}

.modal-close {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    transition: background 0.2s, color 0.2s;
    padding: 0;
}

.modal-close:hover {
    background: #f1f5f9;
    color: #475569;
}

/* 弹窗主体 */
.modal-body {
    padding: 20px 24px;
    overflow-y: auto;
}

/* 弹窗底部 */
.modal-footer {
    padding: 0 24px 24px;
    display: flex;
    justify-content: flex-end;
}

/* 底部按钮 */
.btn-modal {
    padding: 10px 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}

.btn-modal-primary {
    background: #409eff;
    border-color: #409eff;
    color: #fff;
}

.btn-modal-primary:hover {
    background: #66b1ff;
    border-color: #66b1ff;
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
</style>
