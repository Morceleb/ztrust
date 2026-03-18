<template>
    <div class="role-group">
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索角色组..." class="search-input" />
            </div>
            <button class="btn btn-primary" @click="handleAdd">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                创建角色组
            </button>
        </div>

        <div class="group-list">
            <div class="group-card" v-for="group in filteredGroups" :key="group.id">
                <div class="group-header">
                    <div class="group-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <div class="group-info">
                        <div class="group-name">{{ group.name }}</div>
                        <div class="group-desc">ID: {{ group.id }}</div>
                    </div>
                    <div class="group-actions">
                        <button class="action-btn edit" @click="handleEdit(group)">编辑</button>
                        <button class="action-btn delete" @click="handleDelete(group)">删除</button>
                    </div>
                </div>
                <div class="group-resources">
                    <div class="resource-title">可访问资源组 ({{ group.resourceGroups.length }})</div>
                    <div class="resource-tags">
                        <span class="resource-tag" v-for="rg in group.resourceGroups" :key="rg">{{ rg }}</span>
                    </div>
                </div>
            </div>

            <div v-if="filteredGroups.length === 0" class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                <p>暂无角色组</p>
            </div>
        </div>

        <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modalMode === 'add' ? '创建角色组' : '编辑角色组' }}</h3>
                    <button class="modal-close" @click="showModal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>角色组名称 <span class="required">*</span></label>
                        <input type="text" v-model="formData.name" placeholder="请输入角色组名称" />
                    </div>
                    <div class="form-group">
                        <label>关联资源组</label>
                        <div class="resource-select">
                            <div class="resource-option" v-for="rg in resourceGroups" :key="rg.id" @click="toggleResourceGroup(rg.name)" :class="{ selected: formData.resourceGroups.includes(rg.name) }">
                                <span class="resource-name">{{ rg.name }}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="handleSubmit">确定</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const showModal = ref(false)
const modalMode = ref('add')

const resourceGroups = ref([
    { id: 1, name: '核心资源' },
    { id: 2, name: '普通资源' },
    { id: 3, name: '公开资源' }
])

const groups = ref([
    { id: 1, name: '管理员', resourceGroups: ['核心资源', '普通资源', '公开资源'] },
    { id: 2, name: '运维人员', resourceGroups: ['核心资源', '普通资源'] },
    { id: 3, name: '普通用户', resourceGroups: ['公开资源'] }
])

const formData = ref({ name: '', resourceGroups: [] })

const filteredGroups = computed(() => {
    if (!searchKeyword.value) return groups.value
    return groups.value.filter(g => g.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const toggleResourceGroup = (name) => {
    const idx = formData.value.resourceGroups.indexOf(name)
    if (idx === -1) formData.value.resourceGroups.push(name)
    else formData.value.resourceGroups.splice(idx, 1)
}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = { name: '', resourceGroups: [] }
    showModal.value = true
}

const handleEdit = (group) => {
    modalMode.value = 'edit'
    formData.value = { ...group }
    showModal.value = true
}

const handleDelete = (group) => {
    if (confirm(`确定删除角色组 "${group.name}" 吗？`)) {
        groups.value = groups.value.filter(g => g.id !== group.id)
    }
}

const handleSubmit = () => {
    if (modalMode.value === 'add') {
        const newId = Math.max(...groups.value.map(g => g.id), 0) + 1
        groups.value.push({ ...formData.value, id: newId })
    } else {
        const idx = groups.value.findIndex(g => g.id === formData.value.id)
        if (idx !== -1) groups.value[idx] = { ...groups.value[idx], ...formData.value }
    }
    showModal.value = false
}
</script>

<style scoped>
.role-group { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.search-box { display: flex; align-items: center; background: #f5f7fa; border-radius: 8px; padding: 4px 12px; }
.search-input { border: none; background: transparent; padding: 8px; outline: none; width: 200px; font-size: 14px; }
.btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn:hover { border-color: #409eff; color: #409eff; }
.btn-primary { background: #409eff; border-color: #409eff; color: white; }
.btn-primary:hover { background: #66b1ff; }
.group-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
.group-card { background: #fafafa; border-radius: 12px; padding: 20px; border: 1px solid #ebeef5; transition: all 0.3s; }
.group-card:hover { border-color: #409eff; box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1); }
.group-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.group-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.group-info { flex: 1; min-width: 0; }
.group-name { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.group-desc { font-size: 13px; color: #909399; }
.group-actions { display: flex; gap: 8px; }
.action-btn { padding: 4px 12px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.3s; }
.action-btn.edit { background: #e6f7ff; color: #1890ff; }
.action-btn.edit:hover { background: #bae7ff; }
.action-btn.delete { background: #fff2f0; color: #f56c6c; }
.action-btn.delete:hover { background: #ffccc7; }
.group-resources { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; }
.resource-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.resource-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.resource-tag { display: inline-block; padding: 4px 10px; background: white; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 12px; color: #606266; }
.empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #909399; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; width: 480px; max-width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #ebeef5; }
.modal-header h3 { font-size: 18px; font-weight: 600; color: #303133; }
.modal-close { background: none; border: none; font-size: 24px; color: #909399; cursor: pointer; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #ebeef5; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; color: #606266; font-size: 14px; }
.form-group label .required { color: #f56c6c; margin-left: 2px; }
.form-group input { width: 100%; padding: 10px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 14px; outline: none; }
.form-group input:focus { border-color: #409eff; }
.resource-select { border: 1px solid #dcdfe6; border-radius: 6px; max-height: 150px; overflow-y: auto; }
.resource-option { display: flex; align-items: center; padding: 10px 12px; cursor: pointer; transition: background 0.3s; }
.resource-option:hover { background: #f5f7fa; }
.resource-option.selected { background: #e6f7ff; border-left: 3px solid #409eff; }
.resource-name { font-size: 14px; color: #303133; }
</style>
