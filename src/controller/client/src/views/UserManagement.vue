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
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加人员
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
                        <th class="actions-col">操作</th>
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
                                <button class="action-btn action-edit" @click="handleEdit(user)" title="编辑">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    class="action-btn action-delete"
                                    @click="handleDelete(user)"
                                    title="删除"
                                    :disabled="deletingUserId === user.id"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                        <line x1="10" y1="11" x2="10" y2="17"/>
                                        <line x1="14" y1="11" x2="14" y2="17"/>
                                    </svg>
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

        <!-- 添加/编辑人员弹窗 -->
        <div class="modal-overlay" v-if="showUserModal" @click.self="closeUserModal">
            <div class="add-user-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <div class="modal-icon-wrap" :class="userModalMode === 'add' ? 'icon-add' : 'icon-edit'">
                            <svg v-if="userModalMode === 'add'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <div class="modal-title-text">
                            <h3 class="modal-title">{{ userModalMode === 'add' ? '添加人员' : '编辑人员' }}</h3>
                            <p class="modal-subtitle">{{ userModalMode === 'add' ? '填写账号信息，创建新的用户' : '修改用户账号信息' }}</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeUserModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-user">
                    <div class="form-card form-card-user">
                        <div class="form-user-grid">
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>登录账号 <span class="required">*</span></label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        <input type="text" v-model="userFormData.username" class="field-input" :class="{ 'field-error': userFormErrors.username }" placeholder="字母、数字或下划线" />
                                    </div>
                                    <span class="field-error-text" v-if="userFormErrors.username">{{ userFormErrors.username }}</span>
                                    <span class="field-hint">只能是字母、数字或下划线</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>密码</label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                                        </svg>
                                        <input type="password" v-model="userFormData.password" class="field-input" :placeholder="userModalMode === 'add' ? '不填默认为 123456' : '不修改请留空'" />
                                    </div>
                                    <span class="field-hint">{{ userModalMode === 'add' ? '不填默认为 123456' : '不修改请留空，将保持原密码' }}</span>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>邮箱</label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                            <polyline points="22,6 12,13 2,6"/>
                                        </svg>
                                        <input type="email" v-model="userFormData.email" class="field-input" placeholder="user@example.com" />
                                    </div>
                                </div>
                            </div>
                            <div class="form-field-group">
                                <div class="form-field">
                                    <label>手机号</label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                                            <line x1="12" y1="18" x2="12.01" y2="18"/>
                                        </svg>
                                        <input type="tel" v-model="userFormData.phone" class="field-input" placeholder="13800138000" />
                                    </div>
                                </div>
                            </div>
                            <div class="form-field-group form-field-span-2">
                                <div class="form-field">
                                    <label>头像 URL</label>
                                    <div class="input-wrapper">
                                        <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                            <circle cx="8.5" cy="8.5" r="1.5"/>
                                            <polyline points="21 15 16 10 5 21"/>
                                        </svg>
                                        <input type="text" v-model="userFormData.avatar" class="field-input" placeholder="https://example.com/avatar.png" />
                                    </div>
                                </div>
                            </div>
                            <div class="form-field-group form-field-status">
                                <div class="form-field">
                                    <label>账号状态</label>
                                    <div class="status-toggle-wrapper">
                                        <div
                                            class="status-toggle"
                                            :class="{ 'is-frozen': userFormData.status === 'frozen' }"
                                            @click="userFormData.status = userFormData.status === 'active' ? 'frozen' : 'active'"
                                        >
                                            <div class="status-toggle-knob"></div>
                                        </div>
                                        <span class="status-toggle-label" :class="{ 'label-frozen': userFormData.status === 'frozen' }">
                                            {{ userFormData.status === 'active' ? '正常' : '冻结' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer modal-footer-user">
                    <button type="button" class="btn-modal btn-modal-ghost" @click="closeUserModal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        取消
                    </button>
                    <button type="button" class="btn-modal btn-modal-primary" @click="handleUserSubmit" :disabled="submitting">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {{ submitting ? '提交中...' : (userModalMode === 'add' ? '确定添加' : '保存修改') }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 删除确认弹窗 -->
        <div class="modal-overlay" v-if="showDeleteModal" @click.self="cancelDelete">
            <div class="delete-confirm-dialog">
                <div class="delete-confirm-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                </div>
                <h3 class="delete-confirm-title">确认删除</h3>
                <p class="delete-confirm-message">
                    确定要删除用户「<span class="delete-username">{{ deleteTarget?.username || deleteTarget?.name }}</span>」吗？
                </p>
                <p class="delete-confirm-hint">此操作不可恢复</p>
                <div class="delete-confirm-footer">
                    <button class="delete-btn-cancel" @click="cancelDelete">取消</button>
                    <button
                        class="delete-btn-confirm"
                        @click="confirmDelete"
                        :disabled="deletingUserId !== null"
                    >
                        {{ deletingUserId !== null ? '删除中...' : '确认删除' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listUsers, issueSpaToken as apiIssue, disableSpaToken as apiDisable, enableSpaToken as apiEnable, saveUser as apiSaveUser, deleteUser as apiDeleteUser } from '@/api/user.js'

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

// 添加/编辑用户弹窗相关
const showUserModal = ref(false)
const userModalMode = ref('add')
const userFormErrors = ref({})
const submitting = ref(false)
const userFormData = ref({
    id: '',
    username: '',
    password: '',
    email: '',
    phone: '',
    avatar: '',
    status: 'active'
})

// 删除用户相关
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const deletingUserId = ref(null)

const handleDelete = (user) => {
    deleteTarget.value = user
    showDeleteModal.value = true
}

const cancelDelete = () => {
    showDeleteModal.value = false
    deleteTarget.value = null
}

const confirmDelete = async () => {
    if (!deleteTarget.value?.id) return
    deletingUserId.value = deleteTarget.value.id
    try {
        const res = await apiDeleteUser(deleteTarget.value.id)
        if (res.code === 200) {
            showToast('用户已删除')
            cancelDelete()
            await fetchUsers()
        } else {
            showToast(res.message || '删除失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    } finally {
        deletingUserId.value = null
    }
}

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

// 添加人员
const handleAdd = () => {
    userModalMode.value = 'add'
    userFormData.value = {
        id: '',
        username: '',
        password: '',
        email: '',
        phone: '',
        avatar: '',
        status: 'active'
    }
    userFormErrors.value = {}
    showUserModal.value = true
}

// 编辑人员
const handleEdit = (user) => {
    userModalMode.value = 'edit'
    userFormData.value = {
        id: user.id,
        username: user.username || user.name || '',
        password: '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
        status: user.status || 'active'
    }
    userFormErrors.value = {}
    showUserModal.value = true
}

// 关闭用户弹窗
const closeUserModal = () => {
    showUserModal.value = false
    userFormErrors.value = {}
}

// 提交用户表单
const handleUserSubmit = async () => {
    userFormErrors.value = {}

    if (!userFormData.value.username || userFormData.value.username.trim() === '') {
        userFormErrors.value.username = '请输入登录账号'
    } else if (!/^[a-zA-Z0-9_]+$/.test(userFormData.value.username)) {
        userFormErrors.value.username = '账号只能包含字母、数字或下划线'
    }

    if (Object.keys(userFormErrors.value).length > 0) return

    submitting.value = true
    try {
        // 如果新增时未设置密码，默认为 123456
        const password = userFormData.value.password?.trim() || '123456'
        const payload = {
            ...(userFormData.value.id && { id: userFormData.value.id }),
            username: userFormData.value.username.trim(),
            password: password,
            ...(userFormData.value.email && { email: userFormData.value.email.trim() }),
            ...(userFormData.value.phone && { phone: userFormData.value.phone.trim() }),
            ...(userFormData.value.avatar && { avatar: userFormData.value.avatar.trim() }),
            status: userFormData.value.status
        }

        console.log('提交用户数据:', payload)
        const res = await apiSaveUser(payload)

        if (res.code === 200) {
            showToast(userModalMode.value === 'add' ? '用户添加成功' : '用户信息已更新')
            closeUserModal()
            currentPage.value = 1
            await fetchUsers()
        } else {
            showToast(res.message || '操作失败，错误码：' + res.code)
        }
    } catch (e) {
        showToast(e?.message || '网络错误，请检查网络或后端服务')
    } finally {
        submitting.value = false
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
        (user.username || user.name || '').toLowerCase().includes(keyword) ||
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

/* 工具栏按钮样式 */
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

/* 添加/编辑用户弹窗 */
.add-user-modal {
    width: 100%;
    max-width: 680px;
    max-height: none;
    overflow: hidden;
    background: #fff;
    border-radius: 28px;
    box-shadow: 0 28px 72px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    animation: modal-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.add-user-modal .modal-header {
    padding: 18px 28px 14px;
    border-radius: 28px 28px 0 0;
}

.add-user-modal .modal-icon-wrap {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
}

.add-user-modal .modal-icon-wrap.icon-add {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    color: #3b82f6;
}

.add-user-modal .modal-icon-wrap.icon-edit {
    background: linear-gradient(135deg, #fef3c7, #fef9c3);
    color: #f59e0b;
}

.add-user-modal .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.add-user-modal .modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.add-user-modal .modal-close {
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

.add-user-modal .modal-close:hover {
    background: #e2e8f0;
    color: #0f172a;
}

.add-user-modal .form-card {
    background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 20px;
}

.add-user-modal .form-field-group {
    padding: 0 0 4px;
}

.add-user-modal .form-field-group + .form-field-group {
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
    margin-top: 12px;
}

.add-user-modal .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.add-user-modal .form-field label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.01em;
}

.add-user-modal .form-field label .required {
    color: #f56c6c;
    margin-left: 2px;
}

.add-user-modal .input-wrapper {
    position: relative;
}

.add-user-modal .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.add-user-modal .field-input {
    width: 100%;
    padding: 11px 14px 11px 40px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
}

.add-user-modal .field-input::placeholder {
    color: #94a3b8;
}

.add-user-modal .field-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.add-user-modal .field-error {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.12) !important;
}

.add-user-modal .field-error-text {
    font-size: 12px;
    color: #f56c6c;
}

.add-user-modal .field-hint {
    font-size: 12px;
    color: #94a3b8;
}

.add-user-modal .select-wrapper {
    position: relative;
}

.add-user-modal .select-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.add-user-modal .field-select {
    width: 100%;
    padding: 11px 14px 11px 40px;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    font-size: 14px;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    box-sizing: border-box;
    appearance: none;
    -webkit-appearance: none;
    -moz-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2394A3B8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 36px;
    cursor: pointer;
}

.add-user-modal .field-select:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

/* 账号状态开关样式 */
.form-field-status {
    padding-top: 16px;
    margin-top: 4px;
    border-top: 1px solid #f1f5f9;
}

.status-toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 14px;
}

.status-toggle {
    position: relative;
    width: 48px;
    height: 26px;
    background: #e2e8f0;
    border-radius: 13px;
    cursor: pointer;
    transition: background 0.25s;
}

.status-toggle.is-frozen {
    background: linear-gradient(90deg, #f59e0b, #d97706);
}

.status-toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.status-toggle.is-frozen .status-toggle-knob {
    transform: translateX(22px);
}

.status-toggle-label {
    font-size: 15px;
    font-weight: 600;
    color: #52c41a;
    transition: color 0.2s;
    min-width: 32px;
}

.status-toggle-label.label-frozen {
    color: #f59e0b;
}

.add-user-modal .modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 18px 28px 24px;
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    border-top: 1px solid #f1f5f9;
}

.add-user-modal .btn-modal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 108px;
    padding: 10px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.add-user-modal .btn-modal-ghost {
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #64748b;
}

.add-user-modal .btn-modal-ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
}

.add-user-modal .btn-modal-primary {
    border: none;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.35);
}

.add-user-modal .btn-modal-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    transform: translateY(-1px);
}

.add-user-modal .btn-modal-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

@keyframes modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.add-user-modal .modal-title {
    font-size: 19px;
}

.add-user-modal .modal-subtitle {
    margin-top: 4px;
    font-size: 13px;
}

.add-user-modal .modal-body-user {
    padding: 14px 28px 8px;
}

.add-user-modal .modal-footer-user {
    padding: 16px 28px 22px;
    border-radius: 0 0 28px 28px;
}

.add-user-modal .form-card-user {
    padding: 16px 18px;
    border-radius: 18px;
}

.add-user-modal .form-user-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 22px;
    align-items: start;
}

.add-user-modal .form-field-group {
    padding: 0;
    margin: 0;
}

.add-user-modal .form-field-group + .form-field-group {
    border: none;
    padding-top: 0;
    margin-top: 0;
}

.add-user-modal .form-field {
    gap: 6px;
}

.add-user-modal .form-field label {
    font-size: 13px;
}

.add-user-modal .field-input {
    padding: 9px 12px 9px 38px;
    font-size: 14px;
    border-radius: 12px;
}

.add-user-modal .input-icon {
    left: 12px;
}

.add-user-modal .field-hint {
    font-size: 12px;
    color: #94a3b8;
}

/* 操作列编辑按钮 */
.action-buttons {
    display: flex;
    gap: 6px;
}

.action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-edit {
    background: #e6f7ff;
    color: #1890ff;
}

.action-edit:hover {
    background: #1890ff;
    color: #fff;
}

.user-actions {
    display: flex;
    gap: 6px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #e2e8f0;
}

.action-delete {
    background: #fff1f0;
    color: #ff4d4f;
}

.action-delete:hover {
    background: #ff4d4f;
    color: #fff;
}

.action-delete:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.spa-actions {
    display: flex;
    gap: 6px;
    align-items: center;
}

/* 删除确认弹窗样式 */
.delete-confirm-dialog {
    background: #fff;
    border-radius: 16px;
    padding: 32px 28px 24px;
    width: 360px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    animation: dialogEnter 0.2s ease-out;
}

@keyframes dialogEnter {
    from {
        opacity: 0;
        transform: scale(0.92);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.delete-confirm-icon {
    width: 56px;
    height: 56px;
    margin: 0 auto 16px;
    background: linear-gradient(135deg, #fff1f0, #ffebe9);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ff4d4f;
}

.delete-confirm-title {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 600;
    color: #1a1a2e;
}

.delete-confirm-message {
    margin: 0 0 6px;
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
}

.delete-username {
    color: #1a1a2e;
    font-weight: 600;
}

.delete-confirm-hint {
    margin: 0 0 24px;
    font-size: 13px;
    color: #94a3b8;
}

.delete-confirm-footer {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.delete-btn-cancel {
    flex: 1;
    padding: 10px 20px;
    background: #f1f5f9;
    color: #64748b;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn-cancel:hover {
    background: #e2e8f0;
    color: #475569;
}

.delete-btn-confirm {
    flex: 1;
    padding: 10px 20px;
    background: linear-gradient(135deg, #ff4d4f, #ff7875);
    color: #fff;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn-confirm:hover:not(:disabled) {
    background: linear-gradient(135deg, #ff7875, #ff4d4f);
    box-shadow: 0 4px 12px rgba(255, 77, 79, 0.3);
}

.delete-btn-confirm:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
</style>
