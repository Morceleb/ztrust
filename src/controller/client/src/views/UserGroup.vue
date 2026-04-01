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
                        <button class="action-btn resources" @click="handleEditResources(group)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                                <path d="M2 17l10 5 10-5"/>
                                <path d="M2 12l10 5 10-5"/>
                            </svg>
                            访问资源
                        </button>
                        <button class="action-btn members" @click="handleEditMembers(group)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                            </svg>
                            组成员
                        </button>
                        <button class="action-btn delete" @click="handleDelete(group)">删除</button>
                    </div>
                </div>
                <div class="group-resources">
                    <div class="resource-title">可访问资源组 ({{ group.resourceGroups.length }})</div>
                    <div class="resource-tags">
                        <span class="resource-tag" v-for="rg in group.resourceGroups" :key="rg">{{ rg }}</span>
                    </div>
                </div>
                <div class="group-members-preview">
                    <div class="resource-title">组成员 ({{ (group.members || []).length }})</div>
                    <div class="member-preview-tags" v-if="(group.members || []).length">
                        <span class="member-preview-tag" v-for="m in group.members" :key="m.userId">
                            {{ m.username }}
                            <em>{{ m.level }}级</em>
                        </span>
                    </div>
                    <div class="member-preview-empty" v-else>暂无成员，可在编辑中添加</div>
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

        <!-- 创建角色组弹窗 -->
        <div class="modal-overlay" v-if="showAddModal" @click.self="closeAddModal">
            <div class="add-modal">
                <div class="modal-header">
                    <h3>创建角色组</h3>
                    <button class="modal-close" @click="closeAddModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>角色组名称 <span class="required">*</span></label>
                        <input type="text" v-model="formData.name" placeholder="请输入角色组名称" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="closeAddModal">取消</button>
                    <button class="btn btn-primary" @click="handleAddSubmit">确定</button>
                </div>
            </div>
        </div>

        <!-- 编辑访问资源弹窗 -->
        <div class="modal-overlay" v-if="showResourcesModal" @click.self="closeResourcesModal">
            <div class="edit-modal">
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-resources"></span>
                        <div>
                            <h3>访问资源</h3>
                            <p class="modal-subtitle">设置角色组「{{ formData.name }}」可访问的资源组</p>
                        </div>
                    </div>
                    <button class="modal-close" @click="closeResourcesModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>选择可访问的资源组</label>
                        <div class="select-add-area">
                            <div class="select-list">
                                <div
                                    class="select-item"
                                    v-for="rg in availableResourceGroups"
                                    :key="rg.id"
                                    @click="toggleResourceSelection(rg.name)"
                                    :class="{ selected: formData.selectedResourceNames?.includes(rg.name) }"
                                >
                                    <span class="checkbox">
                                        <svg v-if="formData.selectedResourceNames?.includes(rg.name)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </span>
                                    <span class="item-name">{{ rg.name }}</span>
                                </div>
                                <div v-if="availableResourceGroups.length === 0" class="empty-hint">暂无可选资源组</div>
                            </div>
                            <div class="select-action">
                                <button type="button" class="btn-add" :disabled="!formData.selectedResourceNames?.length" @click="addSelectedResources">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group" v-if="(formData.resourceGroups || []).length">
                        <label>已选资源组</label>
                        <div class="tag-list">
                            <span class="tag-item" v-for="(rg, idx) in formData.resourceGroups" :key="rg">
                                {{ rg }}
                                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" @click="removeResource(idx)">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </span>
                        </div>
                    </div>
                    <div class="form-group" v-else>
                        <div class="empty-selected">尚未添加任何资源组</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="closeResourcesModal">取消</button>
                    <button class="btn btn-primary" @click="handleResourcesSubmit">保存</button>
                </div>
            </div>
        </div>

        <!-- 编辑组成员弹窗 -->
        <div class="modal-overlay" v-if="showMembersModal" @click.self="closeMembersModal">
            <div class="edit-modal">
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-members"></span>
                        <div>
                            <h3>组成员</h3>
                            <p class="modal-subtitle">设置角色组「{{ formData.name }}」的成员及权限等级</p>
                        </div>
                    </div>
                    <button class="modal-close" @click="closeMembersModal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>添加成员</label>
                        <div class="select-add-area">
                            <div class="select-list">
                                <div
                                    class="select-item"
                                    v-for="u in availableUsersForForm"
                                    :key="u.id"
                                    @click="toggleMemberSelection(u)"
                                    :class="{ selected: formData.selectedUserIds?.includes(u.id) }"
                                >
                                    <span class="checkbox">
                                        <svg v-if="formData.selectedUserIds?.includes(u.id)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </span>
                                    <span class="item-name">{{ u.username }}</span>
                                </div>
                                <div v-if="availableUsersForForm.length === 0" class="empty-hint">暂无可选用户</div>
                            </div>
                            <div class="select-action">
                                <select v-model.number="formData.addLevel" class="level-select">
                                    <option v-for="lv in levelOptions" :key="lv.value" :value="lv.value">{{ lv.label }}</option>
                                </select>
                                <button type="button" class="btn-add" :disabled="!formData.selectedUserIds?.length" @click="addSelectedMembers">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                    </svg>
                                    添加
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>已选成员</label>
                        <div class="members-table-wrap" v-if="(formData.members || []).length">
                            <table class="members-table">
                                <thead>
                                    <tr>
                                        <th>用户名</th>
                                        <th>权限等级</th>
                                        <th width="60">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(m, idx) in formData.members" :key="m.userId">
                                        <td>{{ m.username }}</td>
                                        <td>
                                            <select v-model.number="m.level" class="level-select-row">
                                                <option v-for="lv in levelOptions" :key="lv.value" :value="lv.value">{{ lv.label }}</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button type="button" class="link-remove" @click="removeMember(idx)">移除</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="empty-selected" v-else>尚未添加任何成员</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="closeMembersModal">取消</button>
                    <button class="btn btn-primary" @click="handleMembersSubmit">保存</button>
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
                    确定要删除角色组「<strong>{{ deleteTarget?.name }}</strong>」吗？<br/>
                    <span class="confirm-sub">此操作不可恢复</span>
                </p>
                <div class="confirm-footer">
                    <button class="btn-modal btn-modal-ghost" @click="cancelDelete">取消</button>
                    <button class="btn-modal btn-modal-danger" @click="confirmDelete">确认删除</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const showAddModal = ref(false)
const showResourcesModal = ref(false)
const showMembersModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)

const levelOptions = [
    { value: 1, label: '1级' },
    { value: 2, label: '2级' },
    { value: 3, label: '3级' },
    { value: 4, label: '4级' }
]

const resourceGroups = ref([
    { id: 1, name: '核心资源' },
    { id: 2, name: '普通资源' },
    { id: 3, name: '公开资源' },
    { id: 4, name: '受限资源' }
])

const allUsers = ref([
    { id: 1, username: 'admin', email: 'admin@company.com' },
    { id: 2, username: 'zhangsan', email: 'zhangsan@company.com' },
    { id: 3, username: 'lisi', email: 'lisi@company.com' },
    { id: 4, username: 'wangwu', email: 'wangwu@company.com' }
])

const groups = ref([
    {
        id: 1,
        name: '管理员',
        resourceGroups: ['核心资源', '普通资源', '公开资源', '受限资源'],
        members: [
            { userId: 1, username: 'admin', level: 4 }
        ]
    },
    {
        id: 2,
        name: '运维人员',
        resourceGroups: ['核心资源', '普通资源'],
        members: [
            { userId: 2, username: 'zhangsan', level: 3 },
            { userId: 3, username: 'lisi', level: 2 }
        ]
    },
    {
        id: 3,
        name: '普通用户',
        resourceGroups: ['公开资源'],
        members: [
            { userId: 4, username: 'wangwu', level: 1 }
        ]
    }
])

const emptyForm = () => ({
    id: undefined,
    name: '',
    resourceGroups: [],
    selectedResourceNames: [],
    members: [],
    selectedUserIds: [],
    addLevel: 1
})

const formData = ref(emptyForm())

const filteredGroups = computed(() => {
    if (!searchKeyword.value) return groups.value
    return groups.value.filter(g => g.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const availableResourceGroups = computed(() => {
    const names = new Set(formData.value.resourceGroups || [])
    return resourceGroups.value.filter(rg => !names.has(rg.name))
})

const availableUsersForForm = computed(() => {
    const ids = new Set((formData.value.members || []).map(m => m.userId))
    return allUsers.value.filter(u => !ids.has(u.id) && u.id !== 1)
})

// 创建角色组
const handleAdd = () => {
    formData.value = emptyForm()
    showAddModal.value = true
}

const closeAddModal = () => {
    showAddModal.value = false
}

const handleAddSubmit = () => {
    if (!formData.value.name?.trim()) return
    const newId = Math.max(...groups.value.map(g => g.id), 0) + 1
    groups.value.push({
        id: newId,
        name: formData.value.name.trim(),
        resourceGroups: [],
        members: []
    })
    closeAddModal()
}

// 编辑访问资源
const handleEditResources = (group) => {
    formData.value = {
        id: group.id,
        name: group.name,
        resourceGroups: [...(group.resourceGroups || [])],
        selectedResourceNames: [],
        members: [],
        selectedUserIds: [],
        addLevel: 1
    }
    showResourcesModal.value = true
}

const closeResourcesModal = () => {
    showResourcesModal.value = false
}

const toggleResourceSelection = (name) => {
    if (!formData.value.selectedResourceNames) formData.value.selectedResourceNames = []
    const idx = formData.value.selectedResourceNames.indexOf(name)
    if (idx === -1) {
        formData.value.selectedResourceNames.push(name)
    } else {
        formData.value.selectedResourceNames.splice(idx, 1)
    }
}

const addSelectedResources = () => {
    if (!formData.value.selectedResourceNames?.length) return
    if (!formData.value.resourceGroups) formData.value.resourceGroups = []
    formData.value.selectedResourceNames.forEach(name => {
        if (!formData.value.resourceGroups.includes(name)) {
            formData.value.resourceGroups.push(name)
        }
    })
    formData.value.selectedResourceNames = []
}

const removeResource = (idx) => {
    formData.value.resourceGroups.splice(idx, 1)
}

const handleResourcesSubmit = () => {
    const idx = groups.value.findIndex(g => g.id === formData.value.id)
    if (idx !== -1) {
        groups.value[idx].resourceGroups = [...formData.value.resourceGroups]
    }
    closeResourcesModal()
}

// 编辑组成员
const handleEditMembers = (group) => {
    formData.value = {
        id: group.id,
        name: group.name,
        resourceGroups: [],
        selectedResourceNames: [],
        members: (group.members || []).map(m => ({ ...m, level: Number(m.level) || 1 })),
        selectedUserIds: [],
        addLevel: 1
    }
    showMembersModal.value = true
}

const closeMembersModal = () => {
    showMembersModal.value = false
}

const toggleMemberSelection = (user) => {
    if (!formData.value.selectedUserIds) formData.value.selectedUserIds = []
    const idx = formData.value.selectedUserIds.indexOf(user.id)
    if (idx === -1) {
        formData.value.selectedUserIds.push(user.id)
    } else {
        formData.value.selectedUserIds.splice(idx, 1)
    }
}

const addSelectedMembers = () => {
    if (!formData.value.selectedUserIds?.length) return
    const selected = availableUsersForForm.value.filter(u => formData.value.selectedUserIds.includes(u.id))
    if (!formData.value.members) formData.value.members = []
    selected.forEach(user => {
        if (!formData.value.members.some(m => m.userId === user.id)) {
            formData.value.members.push({ userId: user.id, username: user.username, level: formData.value.addLevel || 1 })
        }
    })
    formData.value.selectedUserIds = []
}

const removeMember = (idx) => {
    formData.value.members.splice(idx, 1)
}

const handleMembersSubmit = () => {
    const idx = groups.value.findIndex(g => g.id === formData.value.id)
    if (idx !== -1) {
        groups.value[idx].members = (formData.value.members || []).map(m => ({
            userId: m.userId,
            username: m.username,
            level: Math.min(4, Math.max(1, Number(m.level) || 1))
        }))
    }
    closeMembersModal()
}

// 删除
const handleDelete = (group) => {
    deleteTarget.value = group
    showDeleteModal.value = true
}

const cancelDelete = () => {
    showDeleteModal.value = false
    deleteTarget.value = null
}

const confirmDelete = () => {
    if (deleteTarget.value) {
        groups.value = groups.value.filter(g => g.id !== deleteTarget.value.id)
    }
    cancelDelete()
}
</script>

<style scoped>
.role-group { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.search-box { display: flex; align-items: center; background: #f5f7fa; border-radius: 8px; padding: 4px 12px; }
.search-input { border: none; background: transparent; padding: 8px; outline: none; width: 200px; font-size: 14px; }
.btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 14px; cursor: pointer; transition: all 0.3s; }
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
.group-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.action-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.action-btn.resources { background: #e6f7ff; color: #1890ff; }
.action-btn.resources:hover { background: #1890ff; color: white; }
.action-btn.members { background: #f0f5ff; color: #6666ff; }
.action-btn.members:hover { background: #6666ff; color: white; }
.action-btn.delete { background: #fff2f0; color: #f56c6c; }
.action-btn.delete:hover { background: #ffccc7; }
.group-resources,
.group-members-preview { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; }
.resource-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.resource-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.resource-tag { display: inline-block; padding: 4px 10px; background: white; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 12px; color: #606266; }
.member-preview-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.member-preview-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: #f0f5ff; border: 1px solid #d6e4ff; border-radius: 4px; font-size: 12px; color: #303133; }
.member-preview-tag em { font-style: normal; font-size: 11px; color: #409eff; }
.member-preview-empty { font-size: 12px; color: #c0c4cc; }
.empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #909399; }

/* 弹窗样式 */
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

.add-modal {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: modal-in 0.2s ease;
}

.edit-modal {
    width: 100%;
    max-width: 480px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    animation: modal-in 0.2s ease;
}

@keyframes modal-in {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #ebeef5;
}

.modal-header h3 { font-size: 18px; font-weight: 600; color: #1a1a2e; margin: 0; }

.modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-title-accent {
    width: 4px;
    height: 36px;
    border-radius: 2px;
}

.modal-title-accent.accent-resources { background: linear-gradient(180deg, #409eff, #66b1ff); }
.modal-title-accent.accent-members { background: linear-gradient(180deg, #6666ff, #9999ff); }

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #909399;
}

.modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #909399;
    cursor: pointer;
    line-height: 1;
    padding: 0;
    transition: color 0.2s;
}

.modal-close:hover { color: #f56c6c; }

.modal-body { padding: 20px 24px; }

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #ebeef5;
    background: #fafafa;
}

.form-group { margin-bottom: 16px; }
.form-group:last-child { margin-bottom: 0; }
.form-group label { display: block; margin-bottom: 8px; color: #374151; font-size: 14px; font-weight: 500; }
.form-group label .required { color: #f56c6c; margin-left: 2px; }
.form-group input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 14px;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
}
.form-group input:focus { border-color: #409eff; box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1); }

/* 选择+添加区域 */
.select-add-area {
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.select-list {
    flex: 1;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    max-height: 180px;
    overflow-y: auto;
    background: #fff;
}

.select-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.select-item:hover { background: #f9fafb; }
.select-item.selected { background: #eff6ff; }

.checkbox {
    width: 18px;
    height: 18px;
    border: 1.5px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    background: #fff;
}

.select-item.selected .checkbox {
    background: #409eff;
    border-color: #409eff;
    color: white;
}

.item-name { font-size: 14px; color: #374151; }

.select-action {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
}

.btn-add {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 9px 18px;
    background: #409eff;
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
}

.btn-add:hover:not(:disabled) { background: #66b1ff; }
.btn-add:disabled { background: #d1d5db; cursor: not-allowed; }

.level-select {
    padding: 9px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    background: #fff;
    min-width: 120px;
}

/* 已选标签 */
.tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.tag-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #bfdbfe;
    border-radius: 6px;
    font-size: 13px;
    color: #1e40af;
    cursor: pointer;
    transition: all 0.2s;
}

.tag-item svg { color: #60a5fa; transition: color 0.2s; }
.tag-item:hover { background: #eff6ff; border-color: #409eff; }
.tag-item:hover svg { color: #f56c6c; }

/* 成员表格 */
.members-table-wrap {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    overflow: hidden;
}

.members-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

.members-table th,
.members-table td {
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #ebeef5;
}

.members-table th {
    background: #fafafa;
    color: #606266;
    font-weight: 600;
    font-size: 12px;
}

.members-table tr:last-child td { border-bottom: none; }

.level-select-row {
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 13px;
    background: #fff;
    width: 100%;
}

.link-remove {
    background: none;
    border: none;
    color: #ef4444;
    cursor: pointer;
    font-size: 13px;
    padding: 0;
    font-weight: 500;
}

.link-remove:hover { text-decoration: underline; }

.empty-hint {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
}

.empty-selected {
    padding: 16px;
    text-align: center;
    font-size: 13px;
    color: #9ca3af;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px dashed #e5e7eb;
}

/* 删除确认弹窗 */
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

.confirm-message strong { color: #0f172a; }

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

.btn-modal-danger {
    border: none;
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
    color: #fff;
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.35);
}

.btn-modal-danger:hover {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4);
}
</style>
