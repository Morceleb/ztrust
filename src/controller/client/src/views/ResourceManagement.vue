<template>
    <div class="resource-management">
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

        <div class="table-container">
            <table class="data-table">
                <thead>
                    <tr>
                        <th width="60">序号</th>
                        <th>图标</th>
                        <th>资源名称</th>
                        <th>资源类型</th>
                        <th>允许访问方法</th>
                        <th>URL数量</th>
                        <th>创建时间</th>
                        <th width="180">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(resource, index) in filteredResources" :key="resource.id">
                        <td>{{ index + 1 }}</td>
                        <td>
                            <div class="resource-icon" v-html="resource.icon || defaultIcon"></div>
                        </td>
                        <td>{{ resource.name }}</td>
                        <td>{{ resource.type }}</td>
                        <td>
                            <span class="method-tag" v-for="method in parseMethods(resource.allow_method)" :key="method">{{ method }}</span>
                        </td>
                        <td>
                            <span class="url-count">{{ resource.urls ? resource.urls.length : 0 }}</span>
                        </td>
                        <td>{{ resource.created_at }}</td>
                        <td>
                            <button class="action-btn edit" @click="handleEdit(resource)">编辑</button>
                            <button class="action-btn url" @click="manageUrls(resource)">URL管理</button>
                            <button class="action-btn delete" @click="handleDelete(resource)">删除</button>
                        </td>
                    </tr>
                    <tr v-if="filteredResources.length === 0">
                        <td colspan="8" class="empty-cell">
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

        <!-- 添加/编辑弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modalMode === 'add' ? '添加资源' : '编辑资源' }}</h3>
                    <button class="modal-close" @click="showModal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>资源名称 <span class="required">*</span></label>
                        <input type="text" v-model="formData.name" placeholder="请输入资源名称" />
                    </div>
                    <div class="form-group">
                        <label>图标</label>
                        <input type="text" v-model="formData.icon" placeholder="SVG图标代码或图标URL" />
                    </div>
                    <div class="form-group">
                        <label>资源类型</label>
                        <input type="text" v-model="formData.type" placeholder="如：服务器、数据库、应用系统" />
                    </div>
                    <div class="form-group">
                        <label>允许访问方法</label>
                        <div class="method-checkboxes">
                            <label class="checkbox-item">
                                <input type="checkbox" value="GET" v-model="formData.allowMethods" />
                                <span>GET</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value="POST" v-model="formData.allowMethods" />
                                <span>POST</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value="PUT" v-model="formData.allowMethods" />
                                <span>PUT</span>
                            </label>
                            <label class="checkbox-item">
                                <input type="checkbox" value="DELETE" v-model="formData.allowMethods" />
                                <span>DELETE</span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="handleSubmit">确定</button>
                </div>
            </div>
        </div>

        <!-- URL管理弹窗 -->
        <div class="modal-overlay" v-if="showUrlModal" @click.self="showUrlModal = false">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>URL管理 - {{ currentResource?.name }}</h3>
                    <button class="modal-close" @click="showUrlModal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="url-toolbar">
                        <button class="btn btn-primary btn-sm" @click="addUrl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            添加URL
                        </button>
                    </div>
                    <div class="url-list">
                        <div class="url-item" v-for="(url, idx) in currentUrls" :key="idx">
                            <input type="text" v-model="url.url" placeholder="请输入URL路径" class="url-input" />
                            <label class="url-active">
                                <input type="checkbox" v-model="url.is_active" />
                                <span>启用</span>
                            </label>
                            <button class="btn-icon delete" @click="removeUrl(idx)" title="删除">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div v-if="currentUrls.length === 0" class="empty-urls">
                            暂无URL，请点击添加
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showUrlModal = false">取消</button>
                    <button class="btn btn-primary" @click="saveUrls">保存</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const showModal = ref(false)
const showUrlModal = ref(false)
const modalMode = ref('add')
const currentResource = ref(null)
const currentUrls = ref([])

const defaultIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>'

const resources = ref([
    {
        id: 1,
        name: '公司堡垒机',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        type: '服务器',
        allow_method: 'GET,POST',
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00',
        urls: [
            { id: 1, resource_id: 1, url: '/ssh/*', is_active: true },
            { id: 2, resource_id: 1, url: '/telnet/*', is_active: true }
        ]
    },
    {
        id: 2,
        name: 'VPN控制台',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        type: '应用系统',
        allow_method: 'GET,POST,PUT',
        created_at: '2026-02-01 14:30:00',
        updated_at: '2026-02-01 14:30:00',
        urls: [
            { id: 3, resource_id: 2, url: '/vpn/login', is_active: true },
            { id: 4, resource_id: 2, url: '/vpn/connect', is_active: true }
        ]
    },
    {
        id: 3,
        name: '财务数据库',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>',
        type: '数据库',
        allow_method: 'GET,POST,PUT,DELETE',
        created_at: '2026-02-20 09:00:00',
        updated_at: '2026-02-20 09:00:00',
        urls: []
    }
])

const formData = ref({
    name: '',
    icon: '',
    type: '',
    allowMethods: []
})

const filteredResources = computed(() => {
    if (!searchKeyword.value) return resources.value
    return resources.value.filter(r => r.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const parseMethods = (methods) => {
    if (!methods) return []
    return methods.split(',').filter(m => m.trim())
}

const formatMethods = (methods) => {
    return methods.join(',')
}

const handleSearch = () => {}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = { name: '', icon: '', type: '', allowMethods: ['GET', 'POST'] }
    showModal.value = true
}

const handleEdit = (resource) => {
    modalMode.value = 'edit'
    formData.value = {
        name: resource.name,
        icon: resource.icon,
        type: resource.type,
        allowMethods: parseMethods(resource.allow_method)
    }
    currentResource.value = resource
    showModal.value = true
}

const handleDelete = (resource) => {
    if (confirm(`确定删除资源 "${resource.name}" 吗？`)) {
        resources.value = resources.value.filter(r => r.id !== resource.id)
    }
}

const handleSubmit = () => {
    const now = new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\//g, '-')
    if (modalMode.value === 'add') {
        resources.value.push({
            id: Date.now(),
            ...formData.value,
            allow_method: formatMethods(formData.value.allowMethods),
            created_at: now,
            updated_at: now,
            urls: []
        })
    } else {
        const idx = resources.value.findIndex(r => r.id === currentResource.value.id)
        if (idx !== -1) {
            resources.value[idx] = {
                ...resources.value[idx],
                ...formData.value,
                allow_method: formatMethods(formData.value.allowMethods),
                updated_at: now
            }
        }
    }
    showModal.value = false
}

const manageUrls = (resource) => {
    currentResource.value = resource
    currentUrls.value = resource.urls ? [...resource.urls.map(u => ({ ...u }))] : []
    showUrlModal.value = true
}

const addUrl = () => {
    currentUrls.value.push({
        id: null,
        resource_id: currentResource.value.id,
        url: '',
        is_active: true
    })
}

const removeUrl = (idx) => {
    currentUrls.value.splice(idx, 1)
}

const saveUrls = () => {
    const idx = resources.value.findIndex(r => r.id === currentResource.value.id)
    if (idx !== -1) {
        resources.value[idx].urls = currentUrls.value
    }
    showUrlModal.value = false
}
</script>

<style scoped>
.resource-management { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.search-box { display: flex; align-items: center; background: #f5f7fa; border-radius: 8px; padding: 4px 12px; }
.search-input { border: none; background: transparent; padding: 8px; outline: none; width: 200px; font-size: 14px; }
.search-btn { background: none; border: none; cursor: pointer; color: #909399; }
.search-btn:hover { color: #409eff; }
.toolbar-actions { display: flex; gap: 12px; }
.btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn:hover { border-color: #409eff; color: #409eff; }
.btn-primary { background: #409eff; border-color: #409eff; color: white; }
.btn-primary:hover { background: #66b1ff; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #ebeef5; }
.data-table th { background: #fafafa; font-weight: 600; color: #606266; font-size: 14px; }
.data-table tbody tr:hover { background: #f5f7fa; }
.resource-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: #409eff; }
.method-tag { display: inline-block; padding: 2px 8px; margin-right: 4px; background: #e6f7ff; color: #1890ff; border-radius: 4px; font-size: 12px; }
.url-count { color: #409eff; cursor: pointer; }
.url-count:hover { text-decoration: underline; }
.action-btn { padding: 4px 10px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; margin-right: 6px; transition: all 0.3s; }
.action-btn.edit { background: #e6f7ff; color: #1890ff; }
.action-btn.edit:hover { background: #bae7ff; }
.action-btn.url { background: #f0f5ff; color: #666ee8; }
.action-btn.url:hover { background: #e0e8ff; }
.action-btn.delete { background: #fff2f0; color: #f56c6c; }
.action-btn.delete:hover { background: #ffccc7; }
.empty-cell { text-align: center; padding: 60px 0 !important; }
.empty-state { color: #909399; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; width: 500px; max-width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
.modal-lg { width: 640px; }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #ebeef5; }
.modal-header h3 { font-size: 18px; font-weight: 600; color: #303133; }
.modal-close { background: none; border: none; font-size: 24px; color: #909399; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #ebeef5; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; color: #606266; font-size: 14px; }
.form-group label .required { color: #f56c6c; }
.form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 14px; outline: none; }
.form-group input:focus, .form-group select:focus { border-color: #409eff; }
.method-checkboxes { display: flex; gap: 16px; flex-wrap: wrap; }
.checkbox-item { display: flex; align-items: center; gap: 6px; cursor: pointer; }
.checkbox-item input { width: 16px; height: 16px; }
.url-toolbar { margin-bottom: 16px; }
.url-list { max-height: 300px; overflow-y: auto; }
.url-item { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; padding: 10px; background: #f9fafb; border-radius: 6px; }
.url-input { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 4px; font-size: 14px; }
.url-active { display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.url-active input { width: 14px; height: 14px; }
.btn-icon { width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-icon.delete { background: #fff2f0; color: #f56c6c; }
.btn-icon.delete:hover { background: #ffccc7; }
.empty-urls { text-align: center; padding: 40px; color: #909399; }
</style>
