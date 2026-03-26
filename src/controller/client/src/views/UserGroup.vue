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
                            <div
                                class="resource-option"
                                v-for="rg in resourceGroups"
                                :key="rg.id"
                                @click="toggleResourceGroup(rg.name)"
                                :class="{ selected: formData.resourceGroups.includes(rg.name) }"
                            >
                                <span class="resource-name">{{ rg.name }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>组内成员与权限等级</label>
                        <p class="form-hint">用户等级与资源等级一致，分为 1～4 级；<strong>N 级用户可访问 N 级及以下资源</strong>。</p>
                        <div class="add-member-row">
                            <select v-model="pendingUserId" class="member-user-select">
                                <option disabled value="">选择用户添加到本组</option>
                                <option v-for="u in availableUsersForForm" :key="u.id" :value="u.id">
                                    {{ u.username }}
                                </option>
                            </select>
                            <button type="button" class="btn btn-add-member" :disabled="!pendingUserId" @click="addMemberToForm">
                                添加
                            </button>
                        </div>
                        <div v-if="availableUsersForForm.length === 0 && (formData.members || []).length >= allUsers.length" class="form-hint muted">全部系统用户已加入本组</div>
                        <div v-else-if="availableUsersForForm.length === 0 && (formData.members || []).length === 0" class="form-hint muted">暂无可选用户</div>
                        <div class="members-table-wrap" v-if="(formData.members || []).length">
                            <table class="members-table">
                                <thead>
                                    <tr>
                                        <th>用户名</th>
                                        <th>权限等级</th>
                                        <th width="72">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="(m, idx) in formData.members" :key="m.userId">
                                        <td>{{ m.username }}</td>
                                        <td>
                                            <select v-model.number="m.level" class="level-select">
                                                <option v-for="lv in levelOptions" :key="lv.value" :value="lv.value">{{ lv.label }}</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button type="button" class="link-remove" @click="removeMemberFromForm(idx)">移除</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div v-else class="members-empty">尚未添加成员，请从上方下拉框选择用户</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="handleSubmit">确定</button>
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
const showModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const modalMode = ref('add')
const pendingUserId = ref('')

const levelOptions = [
    { value: 1, label: '1级（可访问 1 级及以下资源）' },
    { value: 2, label: '2级（可访问 2 级及以下资源）' },
    { value: 3, label: '3级（可访问 3 级及以下资源）' },
    { value: 4, label: '4级（可访问 4 级及以下资源）' }
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
    members: []
})

const formData = ref(emptyForm())

const filteredGroups = computed(() => {
    if (!searchKeyword.value) return groups.value
    return groups.value.filter(g => g.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const availableUsersForForm = computed(() => {
    const ids = new Set((formData.value.members || []).map(m => m.userId))
    return allUsers.value.filter(u => !ids.has(u.id))
})

const toggleResourceGroup = (name) => {
    const idx = formData.value.resourceGroups.indexOf(name)
    if (idx === -1) formData.value.resourceGroups.push(name)
    else formData.value.resourceGroups.splice(idx, 1)
}

const addMemberToForm = () => {
    const id = Number(pendingUserId.value)
    if (!id) return
    const user = allUsers.value.find(u => u.id === id)
    if (!user || (formData.value.members || []).some(m => m.userId === id)) return
    if (!formData.value.members) formData.value.members = []
    formData.value.members.push({
        userId: user.id,
        username: user.username,
        level: 1
    })
    pendingUserId.value = ''
}

const removeMemberFromForm = (idx) => {
    formData.value.members.splice(idx, 1)
}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = emptyForm()
    pendingUserId.value = ''
    showModal.value = true
}

const handleEdit = (group) => {
    modalMode.value = 'edit'
    formData.value = {
        id: group.id,
        name: group.name,
        resourceGroups: [...(group.resourceGroups || [])],
        members: (group.members || []).map(m => ({ ...m, level: Number(m.level) || 1 }))
    }
    pendingUserId.value = ''
    showModal.value = true
}

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

const handleSubmit = () => {
    if (!formData.value.name?.trim()) return
    const payload = {
        name: formData.value.name.trim(),
        resourceGroups: [...formData.value.resourceGroups],
        members: (formData.value.members || []).map(m => ({
            userId: m.userId,
            username: m.username,
            level: Math.min(4, Math.max(1, Number(m.level) || 1))
        }))
    }
    if (modalMode.value === 'add') {
        const newId = Math.max(...groups.value.map(g => g.id), 0) + 1
        groups.value.push({ ...payload, id: newId })
    } else {
        const idx = groups.value.findIndex(g => g.id === formData.value.id)
        if (idx !== -1) {
            groups.value[idx] = { ...groups.value[idx], ...payload, id: formData.value.id }
        }
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
.btn-add-member { padding: 8px 14px; font-size: 13px; flex-shrink: 0; }
.btn-add-member:disabled { opacity: 0.5; cursor: not-allowed; }
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
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; width: 520px; max-width: 92%; max-height: 85vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #ebeef5; }
.modal-header h3 { font-size: 18px; font-weight: 600; color: #303133; margin: 0; }
.modal-close { background: none; border: none; font-size: 24px; color: #909399; cursor: pointer; line-height: 1; }
.modal-body { padding: 24px; }
.modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #ebeef5; }
.form-group { margin-bottom: 20px; }
.form-group label { display: block; margin-bottom: 8px; color: #606266; font-size: 14px; }
.form-group label .required { color: #f56c6c; margin-left: 2px; }
.form-hint { margin: 0 0 12px; font-size: 12px; color: #909399; line-height: 1.5; }
.form-hint.muted { margin-top: 8px; margin-bottom: 0; }
.form-group input { width: 100%; padding: 10px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box; }
.form-group input:focus { border-color: #409eff; }
.resource-select { border: 1px solid #dcdfe6; border-radius: 6px; max-height: 160px; overflow-y: auto; }
.resource-option { display: flex; align-items: center; padding: 10px 12px; cursor: pointer; transition: background 0.3s; }
.resource-option:hover { background: #f5f7fa; }
.resource-option.selected { background: #e6f7ff; border-left: 3px solid #409eff; }
.resource-name { font-size: 14px; color: #303133; }
.add-member-row { display: flex; gap: 10px; margin-bottom: 12px; align-items: center; }
.member-user-select { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 14px; background: #fff; }
.members-table-wrap { border: 1px solid #ebeef5; border-radius: 8px; overflow: hidden; }
.members-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.members-table th,
.members-table td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #ebeef5; }
.members-table th { background: #fafafa; color: #606266; font-weight: 600; }
.members-table tr:last-child td { border-bottom: none; }
.level-select { width: 100%; max-width: 280px; padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 6px; font-size: 13px; }
.link-remove { background: none; border: none; color: #f56c6c; cursor: pointer; font-size: 13px; padding: 0; }
.link-remove:hover { text-decoration: underline; }
.members-empty { padding: 16px; text-align: center; font-size: 13px; color: #c0c4cc; background: #fafafa; border-radius: 8px; }

/* 删除确认弹窗 */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 24px;
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
