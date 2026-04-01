<template>
    <div class="resource-management">
        <!-- 搜索和操作栏 -->
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索资源名称..." class="search-input" />
                <button class="search-btn" @click="handleSearch">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                </button>
            </div>
            <div class="toolbar-actions">
                <button class="btn btn-primary" @click="handleAdd">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    添加资源
                </button>
            </div>
        </div>

        <!-- 数据表格 -->
        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="60">序号</th>
                        <th>图标</th>
                        <th>资源名称</th>
                        <th>资源URL</th>
                        <th class="avail-col">是否可用</th>
                        <th>创建时间</th>
                        <th width="120">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(resource, index) in pagedResources" :key="resource.id">
                        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td>
                            <div class="resource-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                                </svg>
                            </div>
                        </td>
                        <td>{{ resource.name }}</td>
                        <td>{{ resource.url }}</td>
                        <td class="avail-col">
                            <span
                                class="status-badge"
                                :class="resource.available ? 'status-active' : 'status-unavailable'"
                            >{{ resource.available ? '可用' : '不可用' }}</span>
                        </td>
                        <td>{{ resource.created_at }}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn action-edit" @click="handleEdit(resource)" title="编辑">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                    </svg>
                                </button>
                                <button class="action-btn action-delete" @click="handleDelete(resource)" title="删除">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="filteredResources.length === 0">
                        <td colspan="7" class="empty-cell">
                            <div class="empty-state">
                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                </svg>
                                <p>暂无资源数据</p>
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

        <!-- 添加资源弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="closeModal">
            <div class="add-resource-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <div class="modal-icon-wrap" :class="modalMode === 'add' ? 'icon-add' : 'icon-edit'">
                            <svg v-if="modalMode === 'add'" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </div>
                        <div class="modal-title-text">
                            <h3 class="modal-title">{{ modalMode === 'add' ? '添加资源' : '编辑资源' }}</h3>
                            <p class="modal-subtitle">{{ modalMode === 'add' ? '填写资源信息，创建新的资源项' : '修改资源基本信息' }}</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-card">
                        <div class="form-field-group">
                            <div class="form-field">
                                <label>资源名称 <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                                    </svg>
                                    <input type="text" v-model="formData.name" class="field-input" :class="{ 'field-error': formErrors.name }" placeholder="请输入资源名称，如：VPN服务器" />
                                </div>
                                <span class="field-error-text" v-if="formErrors.name">{{ formErrors.name }}</span>
                            </div>
                        </div>
                        <div class="form-field-group">
                            <div class="form-field">
                                <label>资源URL <span class="required">*</span></label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                                    </svg>
                                    <input type="text" v-model="formData.url" class="field-input" :class="{ 'field-error': formErrors.url }" placeholder="请输入IP或域名，如：192.168.1.1" />
                                </div>
                                <span class="field-hint" v-if="modalMode === 'add'">添加资源时必须输入资源URL（IP地址或域名）</span>
                                <span class="field-error-text" v-if="formErrors.url">{{ formErrors.url }}</span>
                            </div>
                        </div>
                        <div class="form-field-group">
                            <div class="form-field">
                                <label>资源状态</label>
                                <div class="toggle-wrapper">
                                    <div class="toggle-switch" :class="{ active: formData.available }" @click="formData.available = !formData.available">
                                        <div class="toggle-knob"></div>
                                    </div>
                                    <span class="toggle-label" :class="formData.available ? 'label-active' : 'label-inactive'">
                                        {{ formData.available ? '可用' : '不可用' }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modal btn-modal-ghost" @click="closeModal">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        取消
                    </button>
                    <button type="button" class="btn-modal btn-modal-primary" @click="handleSubmit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        {{ modalMode === 'add' ? '确定添加' : '保存修改' }}
                    </button>
                </div>
            </div>
        </div>

        <!-- 删除确认弹窗 -->
        <div class="modal-overlay" v-if="showDeleteModal" @click.self="cancelDelete">
            <div class="confirm-dialog">
                <div class="confirm-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
                <h3 class="confirm-title">确认删除</h3>
                <p class="confirm-message">
                    确定要删除资源「<strong>{{ deleteTarget?.name }}</strong>」吗？<br/>
                    <span class="confirm-sub">此操作不可恢复</span>
                </p>
                <div class="confirm-footer">
                    <button class="btn-modal btn-modal-ghost" @click="cancelDelete">取消</button>
                    <button class="btn-modal btn-modal-danger" @click="confirmDelete">确认删除</button>
                </div>
            </div>
        </div>

        <!-- 轻提示 -->
        <div class="toast" v-if="toastMessage">{{ toastMessage }}</div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const showModal = ref(false)
const showDeleteModal = ref(false)
const modalMode = ref('add')
const deleteTarget = ref(null)
const currentResource = ref(null)
const toastMessage = ref('')
const formErrors = ref({})

let toastTimer = null
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

const resources = ref([
    {
        id: 1,
        name: '公司VPN服务器',
        url: '192.168.1.100',
        available: true,
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00'
    },
    {
        id: 2,
        name: '财务数据库',
        url: '192.168.1.50',
        available: true,
        created_at: '2026-02-01 14:30:00',
        updated_at: '2026-02-01 14:30:00'
    },
    {
        id: 3,
        name: '人力资源系统',
        url: '192.168.1.80',
        available: false,
        created_at: '2026-02-20 09:00:00',
        updated_at: '2026-02-20 09:00:00'
    },
    {
        id: 4,
        name: '核心交换机',
        url: '192.168.1.1',
        available: true,
        created_at: '2026-03-01 08:30:00',
        updated_at: '2026-03-01 08:30:00'
    }
])

const formData = ref({
    name: '',
    url: '',
    available: true
})

const filteredResources = computed(() => {
    if (!searchKeyword.value) return resources.value
    return resources.value.filter(r => r.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const pagedResources = computed(() => {
    const list = filteredResources.value
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
})

const totalCount = computed(() => filteredResources.value.length)
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

const handleSearch = () => {
    currentPage.value = 1
}

const closeModal = () => {
    showModal.value = false
    formErrors.value = {}
}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = { name: '', url: '', available: true }
    formErrors.value = {}
    showModal.value = true
}

const handleEdit = (resource) => {
    modalMode.value = 'edit'
    formData.value = {
        name: resource.name,
        url: resource.url || '',
        available: resource.available !== false
    }
    formErrors.value = {}
    currentResource.value = resource
    showModal.value = true
}

const handleDelete = (resource) => {
    deleteTarget.value = resource
    showDeleteModal.value = true
}

const cancelDelete = () => {
    showDeleteModal.value = false
    deleteTarget.value = null
}

const confirmDelete = () => {
    if (deleteTarget.value) {
        resources.value = resources.value.filter(r => r.id !== deleteTarget.value.id)
        showToast('资源已删除')
    }
    cancelDelete()
}

const handleSubmit = () => {
    formErrors.value = {}
    if (!formData.value.name || formData.value.name.trim() === '') {
        formErrors.value.name = '请输入资源名称'
    }
    const url = (formData.value.url || '').trim()
    if (!url) {
        formErrors.value.url = '请输入资源URL'
    }
    if (Object.keys(formErrors.value).length > 0) return

    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-')
    if (modalMode.value === 'add') {
        const newId = Math.max(...resources.value.map(r => r.id), 0) + 1
        resources.value.push({
            id: newId,
            name: formData.value.name.trim(),
            url: formData.value.url.trim(),
            available: formData.value.available === true,
            created_at: now,
            updated_at: now
        })
        showToast('资源添加成功')
    } else {
        const idx = resources.value.findIndex(r => r.id === currentResource.value.id)
        if (idx !== -1) {
            resources.value[idx] = {
                ...resources.value[idx],
                name: formData.value.name.trim(),
                url,
                available: formData.value.available === true,
                updated_at: now
            }
        }
        showToast('资源修改成功')
    }
    closeModal()
}
</script>

<style scoped>
.resource-management {
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

.data-table tbody tr:hover {
    background: #f5f7fa;
}

.data-table tbody tr {
    height: 56px;
}

.data-table td {
    vertical-align: middle;
}

.data-table th.avail-col,
.data-table td.avail-col {
    width: 96px;
    text-align: left;
    padding-left: 10px;
}

.resource-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    overflow: hidden;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
}

.resource-icon svg {
    color: #fff;
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

.status-unavailable {
    background: #fff1f0;
    color: #f5222d;
}

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

.action-delete {
    background: #fff1f0;
    color: #ff4d4f;
}

.action-delete:hover {
    background: #ff4d4f;
    color: #fff;
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

.add-resource-modal {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    animation: modal-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-in {
    from { opacity: 0; transform: scale(0.9) translateY(12px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    padding: 24px 28px 20px;
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border-bottom: 1px solid #f1f5f9;
}

.modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.modal-icon-wrap {
    flex-shrink: 0;
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
}

.modal-icon-wrap.icon-add {
    background: linear-gradient(135deg, #e0f2fe, #dbeafe);
    color: #3b82f6;
}

.modal-icon-wrap.icon-edit {
    background: linear-gradient(135deg, #fef3c7, #fef9c3);
    color: #f59e0b;
}

.modal-title-text {
    min-width: 0;
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #94a3b8;
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
    padding: 24px 28px 8px;
}

.form-card {
    background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
    border: 1px solid #f1f5f9;
    border-radius: 16px;
    padding: 20px;
}

.form-field-group {
    padding: 0 0 4px;
}

.form-field-group + .form-field-group {
    border-top: 1px solid #f1f5f9;
    padding-top: 16px;
    margin-top: 12px;
}

.form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-field label {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    letter-spacing: 0.01em;
}

.form-field label .required {
    color: #f56c6c;
    margin-left: 2px;
}

.input-wrapper {
    position: relative;
}

.input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
}

.field-input {
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

.field-input::placeholder {
    color: #94a3b8;
}

.field-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.field-error {
    border-color: #f56c6c !important;
    box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.12) !important;
}

.field-error-text {
    font-size: 12px;
    color: #f56c6c;
}

.field-hint {
    font-size: 12px;
    color: #94a3b8;
}

.toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
}

.toggle-switch {
    position: relative;
    width: 44px;
    height: 24px;
    background: #e2e8f0;
    border-radius: 12px;
    cursor: pointer;
    transition: background 0.25s;
}

.toggle-switch.active {
    background: linear-gradient(90deg, #409eff, #66b1ff);
}

.toggle-knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toggle-switch.active .toggle-knob {
    transform: translateX(20px);
}

.toggle-label {
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
}

.label-active { color: #409eff; }
.label-inactive { color: #94a3b8; }

.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 18px 28px 24px;
    background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);
    border-top: 1px solid #f1f5f9;
}

.btn-modal {
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

.btn-modal-ghost {
    border: 1.5px solid #e2e8f0;
    background: #fff;
    color: #64748b;
}

.btn-modal-ghost:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
    color: #0f172a;
}

.btn-modal-primary {
    border: none;
    background: linear-gradient(135deg, #409eff 0%, #3a8ee6 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(64, 158, 255, 0.35);
}

.btn-modal-primary:hover {
    background: linear-gradient(135deg, #66b1ff 0%, #409eff 100%);
    box-shadow: 0 6px 20px rgba(64, 158, 255, 0.45);
    transform: translateY(-1px);
}

.btn-modal-danger {
    border: none;
    background: linear-gradient(180deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.btn-modal-danger:hover {
    background: linear-gradient(180deg, #f87171 0%, #ef4444 100%);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.35);
}

.confirm-dialog {
    width: 100%;
    max-width: 400px;
    background: #fff;
    border-radius: 18px;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
    padding: 36px 32px 28px;
    text-align: center;
    animation: dialog-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes dialog-in {
    from { opacity: 0; transform: scale(0.88) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}

.confirm-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 18px;
    background: linear-gradient(135deg, #fff5f5, #fff);
    border: 1.5px solid #fee2e2;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ef4444;
}

.confirm-title {
    margin: 0 0 10px;
    font-size: 19px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.confirm-message {
    margin: 0 0 28px;
    font-size: 14px;
    color: #475569;
    line-height: 1.65;
}

.confirm-message strong {
    color: #0f172a;
}

.confirm-sub {
    display: block;
    margin-top: 6px;
    font-size: 12px;
    color: #94a3b8;
}

.confirm-footer {
    display: flex;
    gap: 10px;
    justify-content: center;
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

@media (max-width: 540px) {
    .add-resource-modal {
        max-width: 100%;
        border-radius: 16px;
    }

    .modal-header {
        padding: 20px 20px 16px;
    }

    .modal-body {
        padding: 16px 20px 8px;
    }

    .modal-footer {
        padding: 16px 20px 20px;
    }
}
</style>
