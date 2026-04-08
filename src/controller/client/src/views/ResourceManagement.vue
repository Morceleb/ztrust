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
                        <th>资源类型</th>
                        <th>资源URL</th>
                        <th>允许方法</th>
                        <th class="avail-col">是否启用</th>
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
                        <td>{{ resource.type || '-' }}</td>
                        <td>{{ resource.url || '-' }}</td>
                        <td>{{ resource.allow_method || '-' }}</td>
                        <td class="avail-col">
                            <span
                                class="status-badge"
                                :class="resource.is_active ? 'status-active' : 'status-unavailable'"
                            >{{ resource.is_active ? '启用' : '禁用' }}</span>
                        </td>
                        <td>{{ resource.created_at }}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn action-url" @click="openUrlModal(resource)" title="管理URL">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                    </svg>
                                </button>
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
                        <td colspan="9" class="empty-cell">
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
                                <label>资源类型</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <input type="text" v-model="formData.type" class="field-input" placeholder="如：Web服务、API接口" />
                                </div>
                            </div>
                        </div>
                        <div class="form-field-group">
                            <div class="form-field">
                                <label>允许方法</label>
                                <div class="input-wrapper">
                                    <svg class="input-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                                    </svg>
                                    <input type="text" v-model="formData.allow_method" class="field-input" placeholder="如：GET、POST、PUT、DELETE" />
                                </div>
                            </div>
                        </div>
                        <div class="form-field-group">
                            <div class="form-field">
                                <label>资源状态</label>
                                <div class="toggle-wrapper">
                                    <div class="toggle-switch" :class="{ active: formData.is_active }" @click="formData.is_active = !formData.is_active">
                                        <div class="toggle-knob"></div>
                                    </div>
                                    <span class="toggle-label" :class="formData.is_active ? 'label-active' : 'label-inactive'">
                                        {{ formData.is_active ? '启用' : '禁用' }}
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

        <!-- 管理资源URL弹窗 -->
        <div class="modal-overlay" v-if="showUrlModal" @click.self="closeUrlModal">
            <div class="url-modal" @click.stop>
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-url"></span>
                        <div class="modal-title-text">
                            <h3 class="modal-title">管理资源URL</h3>
                            <p class="modal-subtitle">资源「{{ currentUrlResource?.name }}」下的访问路径</p>
                        </div>
                    </div>
                    <button type="button" class="modal-close" @click="closeUrlModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-fixed">
                    <!-- 添加新URL区域 -->
                    <div class="url-add-section">
                        <div class="url-add-header">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            <span>添加新URL</span>
                        </div>
                        <div class="url-add-form">
                            <input type="text" v-model="urlForm.url" class="field-input" placeholder="输入资源路径，如：/api/vpn/connect" />
                            <div class="toggle-wrapper">
                                <div class="toggle-switch" :class="{ active: urlForm.is_active }" @click="urlForm.is_active = !urlForm.is_active">
                                    <div class="toggle-knob"></div>
                                </div>
                                <span class="toggle-label" :class="urlForm.is_active ? 'label-active' : 'label-inactive'">
                                    {{ urlForm.is_active ? '启用' : '禁用' }}
                                </span>
                            </div>
                            <button type="button" class="btn-add-url" @click="handleAddUrl" :disabled="!urlForm.url.trim()">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                添加
                            </button>
                        </div>
                    </div>

                    <!-- URL列表 -->
                    <div class="url-list-section">
                        <div class="url-list-header">
                            <span class="url-list-title">已添加的URL路径 ({{ urlList.length }})</span>
                        </div>
                        <div class="url-list">
                            <div v-for="url in urlList" :key="url.id" class="url-item">
                                <div class="url-item-info">
                                    <span class="url-item-path">{{ url.url }}</span>
                                    <span class="url-item-id">ID: {{ url.id }}</span>
                                </div>
                                <div class="url-item-status">
                                    <span class="status-badge" :class="url.is_active ? 'status-active' : 'status-unavailable'">
                                        {{ url.is_active ? '启用' : '禁用' }}
                                    </span>
                                </div>
                                <button type="button" class="btn-icon btn-remove" @click="handleDeleteUrl(url)" title="删除">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"/>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                    </svg>
                                </button>
                            </div>
                            <div v-if="urlList.length === 0" class="url-empty">
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                </svg>
                                <p>暂无URL路径</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-modal-ghost" @click="closeUrlModal">关闭</button>
                </div>
            </div>
        </div>

        <!-- 轻提示 -->
        <div class="toast" v-if="toastMessage">{{ toastMessage }}</div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { listResources, saveResource, deleteResource, listResourceUrls, saveResourceUrl, deleteResourceUrl } from '@/api/resource.js'

const loading = ref(false)
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const totalCount = ref(0)
const showModal = ref(false)
const showDeleteModal = ref(false)
const showUrlModal = ref(false)
const modalMode = ref('add')
const deleteTarget = ref(null)
const currentResource = ref(null)
const toastMessage = ref('')
const formErrors = ref({})
const resources = ref([])

const currentUrlResource = ref(null)
const urlList = ref([])
const urlForm = ref({
    url: '',
    is_active: true
})

let toastTimer = null
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

const formData = ref({
    name: '',
    type: '',
    url: '',
    allow_method: '',
    is_active: true
})

async function fetchResources() {
    loading.value = true
    try {
        const res = await listResources({ page: currentPage.value, pageSize: pageSize.value, keyword: searchKeyword.value || undefined })
        if (res.code === 200 && res.data) {
            // 后端直接返回数组：[{...}, {...}]
            if (Array.isArray(res.data)) {
                // 将驼峰字段映射为下划线字段
                resources.value = res.data.map(item => ({
                    ...item,
                    allow_method: item.allowMethod,
                    is_active: item.isActive
                }))
                totalCount.value = res.data.length
            }
            // 标准分页结构：{ code: 200, data: { list: [...], total: N } }
            else if (Array.isArray(res.data.list)) {
                resources.value = res.data.list.map(item => ({
                    ...item,
                    allow_method: item.allowMethod,
                    is_active: item.isActive
                }))
                totalCount.value = res.data.total || res.data.list.length
            } else {
                resources.value = []
                totalCount.value = 0
            }
        } else {
            resources.value = []
            totalCount.value = 0
        }
    } catch (e) {
        showToast(e?.message || '加载资源列表失败')
        resources.value = []
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchResources()
})

const handleSearch = () => {
    currentPage.value = 1
    fetchResources()
}

const closeModal = () => {
    showModal.value = false
    formErrors.value = {}
}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = { name: '', type: '', url: '', allow_method: '', is_active: true }
    formErrors.value = {}
    showModal.value = true
}

const handleEdit = (resource) => {
    modalMode.value = 'edit'
    formData.value = {
        name: resource.name,
        type: resource.type || '',
        url: resource.url || '',
        allow_method: resource.allow_method || '',
        is_active: resource.is_active !== false
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

const confirmDelete = async () => {
    if (!deleteTarget.value) return
    try {
        const res = await deleteResource(deleteTarget.value.id)
        if (res.code === 200) {
            showToast('资源已删除')
            await fetchResources()
        } else {
            showToast(res.message || '删除失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
    cancelDelete()
}

const handleSubmit = async () => {
    formErrors.value = {}
    if (!formData.value.name || formData.value.name.trim() === '') {
        formErrors.value.name = '请输入资源名称'
    }
    if (Object.keys(formErrors.value).length > 0) return

    try {
        const payload = {
            id: modalMode.value === 'edit' ? currentResource.value.id : undefined,
            name: formData.value.name.trim(),
            type: formData.value.type?.trim() || undefined,
            url: formData.value.url?.trim() || undefined,
            allow_method: formData.value.allow_method?.trim() || undefined,
            is_active: formData.value.is_active === true
        }
        const res = await saveResource(payload)
        if (res.code === 200) {
            showToast(modalMode.value === 'add' ? '资源添加成功' : '资源修改成功')
            closeModal()
            currentPage.value = 1
            await fetchResources()
        } else {
            showToast(res.message || '操作失败，错误码：' + res.code)
        }
    } catch (e) {
        showToast(e?.message || '网络错误，请检查网络或后端服务')
    }
}

const filteredResources = computed(() => {
    if (!searchKeyword.value) return resources.value
    return resources.value.filter(r => (r.name || '').toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const pagedResources = computed(() => {
    const list = filteredResources.value
    const start = (currentPage.value - 1) * pageSize.value
    return list.slice(start, start + pageSize.value)
})

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value) || 1)

// ==================== 资源URL管理 ====================

async function openUrlModal(resource) {
    currentUrlResource.value = resource
    urlForm.value = { url: '', is_active: true }
    urlList.value = []
    showUrlModal.value = true
    await fetchUrls(resource.id)
}

function closeUrlModal() {
    showUrlModal.value = false
    currentUrlResource.value = null
    urlList.value = []
}

async function fetchUrls(resourceId) {
    try {
        const res = await listResourceUrls(resourceId)
        if (res.code === 200) {
            urlList.value = Array.isArray(res.data) ? res.data : []
        }
    } catch (e) {
        showToast(e?.message || '加载URL列表失败')
    }
}

async function handleAddUrl() {
    if (!urlForm.value.url || !urlForm.value.url.trim()) return
    if (!currentUrlResource.value) return
    try {
        const res = await saveResourceUrl({
            resource_id: currentUrlResource.value.id,
            url: urlForm.value.url.trim(),
            is_active: urlForm.value.is_active
        })
        if (res.code === 200) {
            showToast('URL添加成功')
            await fetchUrls(currentUrlResource.value.id)
            urlForm.value.url = ''
            urlForm.value.is_active = true
        } else {
            showToast(res.message || '添加失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
}

async function handleDeleteUrl(url) {
    try {
        const res = await deleteResourceUrl(url.id)
        if (res.code === 200) {
            showToast('URL已删除')
            await fetchUrls(currentUrlResource.value.id)
        } else {
            showToast(res.message || '删除失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
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

.action-btn-url {
    background: #f0f5ff;
    color: #6666ff;
}

.action-btn-url:hover {
    background: #6666ff;
    color: #fff;
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

/* 资源URL管理弹窗 */
.url-modal {
    width: 100%;
    max-width: 620px;
    max-height: 85vh;
    background: #fff;
    border-radius: 20px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modal-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-body-fixed {
    padding: 20px 24px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.modal-title-accent {
    width: 4px;
    height: 40px;
    border-radius: 2px;
    flex-shrink: 0;
}

.accent-url {
    background: linear-gradient(180deg, #10b981, #34d399);
}

/* 添加URL区域 */
.url-add-section {
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border: 1px solid #f1f5f9;
    border-radius: 12px;
    padding: 16px;
}

.url-add-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 12px;
}

.url-add-header svg {
    color: #10b981;
}

.url-add-form {
    display: flex;
    align-items: center;
    gap: 12px;
}

.url-add-form .field-input {
    flex: 1;
    padding: 10px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.url-add-form .field-input:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}

.url-add-form .toggle-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.url-add-form .toggle-switch {
    position: relative;
    width: 40px;
    height: 22px;
    background: #e2e8f0;
    border-radius: 11px;
    cursor: pointer;
    transition: background 0.25s;
}

.url-add-form .toggle-switch.active {
    background: linear-gradient(90deg, #409eff, #66b1ff);
}

.url-add-form .toggle-knob {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.15);
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.url-add-form .toggle-switch.active .toggle-knob {
    transform: translateX(18px);
}

.url-add-form .toggle-label {
    font-size: 13px;
    font-weight: 500;
}

.btn-add-url {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: linear-gradient(135deg, #10b981, #34d399);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
    flex-shrink: 0;
}

.btn-add-url:hover:not(:disabled) {
    background: linear-gradient(135deg, #059669, #10b981);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-add-url:disabled {
    background: #d1d5db;
    cursor: not-allowed;
    box-shadow: none;
}

/* URL列表区域 */
.url-list-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.url-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.url-list-title {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
}

.url-list {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    overflow-y: auto;
    padding: 8px;
}

.url-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-radius: 8px;
    background: #f9fafb;
    margin-bottom: 6px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s;
}

.url-item:last-child {
    margin-bottom: 0;
}

.url-item:hover {
    border-color: #d1d5db;
    background: #fff;
}

.url-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.url-item-path {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    word-break: break-all;
}

.url-item-id {
    font-size: 11px;
    color: #9ca3af;
}

.url-item-status {
    flex-shrink: 0;
}

.btn-icon {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.btn-remove {
    background: #fff1f0;
    color: #f56c6c;
}

.btn-remove:hover {
    background: #ffccc7;
    color: #fff;
}

.url-empty {
    padding: 48px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
}

.url-empty svg {
    margin-bottom: 12px;
    color: #d1d5db;
}

.url-empty p {
    margin: 0;
}
</style>
