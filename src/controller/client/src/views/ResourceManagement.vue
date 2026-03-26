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
                        <th>资源ID</th>
                        <th>资源名称</th>
                        <th>资源URL</th>
                        <th>资源是否可用</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(resource, index) in pagedResources" :key="resource.id">
                        <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                        <td>{{ resource.id }}</td>
                        <td>{{ resource.name }}</td>
                        <td>
                            <span class="url-tag">{{ resource.url }}</span>
                        </td>
                        <td>
                            <span
                                class="avail-tag"
                                :class="resource.available ? 'avail-yes' : 'avail-no'"
                            >{{ resource.available ? '可用' : '不可用' }}</span>
                        </td>
                    </tr>
                    <tr v-if="filteredResources.length === 0">
                        <td colspan="5" class="empty-cell">
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
                        <span class="modal-title-accent"></span>
                        <h3 class="modal-title">{{ modalMode === 'add' ? '添加资源' : '编辑资源' }}</h3>
                        <p class="modal-subtitle">{{ modalMode === 'add' ? '填写资源信息，创建新的资源项' : '修改资源基本信息' }}</p>
                    </div>
                    <button type="button" class="modal-close" @click="closeModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-field form-field-full">
                            <label>资源名称 <span class="required">*</span></label>
                            <input type="text" v-model="formData.name" class="field-input" :class="{ 'field-error': formErrors.name }" placeholder="请输入资源名称，如：VPN服务器" />
                            <span class="field-error-text" v-if="formErrors.name">{{ formErrors.name }}</span>
                        </div>
                        <div class="form-field form-field-full" v-if="modalMode === 'add'">
                            <label>资源URL <span class="required">*</span></label>
                            <input type="text" v-model="formData.url" class="field-input" :class="{ 'field-error': formErrors.url }" placeholder="请输入IP或域名，如：192.168.1.1" />
                            <span class="field-hint">添加资源时必须输入资源URL（IP地址或域名）</span>
                            <span class="field-error-text" v-if="formErrors.url">{{ formErrors.url }}</span>
                        </div>
                        <div class="form-field form-field-full">
                            <label>资源类型</label>
                            <select v-model="formData.type" class="field-input field-select">
                                <option value="">请选择资源类型</option>
                                <option value="服务器">服务器</option>
                                <option value="数据库">数据库</option>
                                <option value="应用系统">应用系统</option>
                                <option value="网络设备">网络设备</option>
                            </select>
                        </div>
                        <div class="form-field form-field-full">
                            <label>资源是否可用</label>
                            <select v-model="formData.available" class="field-input field-select">
                                <option :value="true">可用</option>
                                <option :value="false">不可用</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-modal btn-modal-ghost" @click="closeModal">取消</button>
                    <button type="button" class="btn-modal btn-modal-primary" @click="handleSubmit">{{ modalMode === 'add' ? '确定添加' : '保存修改' }}</button>
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
        type: '服务器',
        available: true,
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00'
    },
    {
        id: 2,
        name: '财务数据库',
        url: '192.168.1.50',
        type: '数据库',
        available: true,
        created_at: '2026-02-01 14:30:00',
        updated_at: '2026-02-01 14:30:00'
    },
    {
        id: 3,
        name: '人力资源系统',
        url: '192.168.1.80',
        type: '应用系统',
        available: false,
        created_at: '2026-02-20 09:00:00',
        updated_at: '2026-02-20 09:00:00'
    },
    {
        id: 4,
        name: '核心交换机',
        url: '192.168.1.1',
        type: '网络设备',
        available: true,
        created_at: '2026-03-01 08:30:00',
        updated_at: '2026-03-01 08:30:00'
    }
])

const formData = ref({
    name: '',
    url: '',
    type: '',
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
    formData.value = { name: '', url: '', type: '', available: true }
    formErrors.value = {}
    showModal.value = true
}

const handleEdit = (resource) => {
    modalMode.value = 'edit'
    formData.value = {
        name: resource.name,
        url: '',
        type: resource.type,
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
    if (modalMode.value === 'add') {
        const url = (formData.value.url || '').trim()
        if (!url) {
            formErrors.value.url = '请输入资源URL'
        }
    }
    if (Object.keys(formErrors.value).length > 0) return

    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-')
    if (modalMode.value === 'add') {
        const newId = Math.max(...resources.value.map(r => r.id), 0) + 1
        resources.value.push({
            id: newId,
            name: formData.value.name.trim(),
            url: formData.value.url.trim(),
            type: formData.value.type || '',
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
                type: formData.value.type,
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

.url-tag {
    display: inline-flex;
    align-items: center;
    max-width: 200px;
    padding: 4px 10px;
    background: #f0f9ff;
    color: #0369a1;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'SF Mono', Monaco, 'Courier New', monospace;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
}

/* 资源是否可用：浅底 + 描边 + 圆角（与 UserManagement 的 status-badge 一致） */
.avail-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 56px;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.4;
    box-sizing: border-box;
}

.avail-yes {
    color: #52c41a;
    background: #f6ffed;
    border: 1px solid #b7eb8f;
}

.avail-no {
    color: #f5222d;
    background: #fff1f0;
    border: 1px solid #ffa39e;
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
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
