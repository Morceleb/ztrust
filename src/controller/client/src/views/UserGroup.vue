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
            <div class="resource-modal">
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-resources"></span>
                        <h3 class="modal-title">访问资源</h3>
                    </div>
                    <button type="button" class="modal-close" @click="closeResourcesModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-fixed">
                    <!-- 可添加的资源组区域 -->
                    <div class="pool-section">
                        <div class="pool-header">
                            <span class="pool-title">可添加的资源组</span>
                        </div>
                        <div class="pool-search">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                type="text"
                                v-model="resourceSearchKeyword"
                                placeholder="搜索可添加的资源组..."
                                class="pool-search-input"
                            />
                        </div>
                        <div class="resource-pool resource-pool-fixed">
                            <div class="resource-pool-list">
                                <div
                                    v-for="rg in filteredAvailableResourceGroups"
                                    :key="rg.id"
                                    class="pool-item"
                                    :class="{ selected: formData.selectedResourceNames?.includes(rg.name) }"
                                    @click="toggleResourceSelection(rg.name)"
                                >
                                    <span class="pool-checkbox" @click.stop="toggleResourceSelection(rg.name)">
                                        <svg v-if="formData.selectedResourceNames?.includes(rg.name)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </span>
                                    <span class="pool-item-name" @click.stop="toggleResourceSelection(rg.name)">{{ rg.name }}</span>
                                    <span class="pool-item-id">ID: {{ rg.id }}</span>
                                </div>
                                <div v-if="filteredAvailableResourceGroups.length === 0" class="pool-empty">
                                    {{ resourceSearchKeyword ? '未找到匹配的资源组' : '暂无可添加的资源组' }}
                                </div>
                            </div>
                        </div>
                        <div class="pool-actions">
                            <div class="pool-selected-info">
                                已选中 <strong>{{ formData.selectedResourceNames?.length || 0 }}</strong> 项资源组
                            </div>
                            <button
                                type="button"
                                class="btn-add-resources"
                                :disabled="!formData.selectedResourceNames?.length"
                                @click="addSelectedResources"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                添加选中资源组 ({{ formData.selectedResourceNames?.length || 0 }})
                            </button>
                        </div>
                    </div>

                    <!-- 已添加的资源组区域 -->
                    <div class="selected-section">
                        <div class="selected-header">
                            <span class="selected-title">已添加的资源组</span>
                            <span class="selected-count">{{ formData.resourceGroups?.length || 0 }} 项</span>
                        </div>
                        <div class="selected-scroll-area">
                            <div class="selected-tags" v-if="formData.resourceGroups?.length">
                                <span class="selected-tag" v-for="(rgName, idx) in formData.resourceGroups" :key="rgName">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                    </svg>
                                    {{ rgName }}
                                    <button type="button" class="tag-remove" @click="removeResource(idx)" title="移除">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </span>
                            </div>
                            <div v-else class="selected-empty">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                </svg>
                                <p>尚未添加任何资源组</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-modal-ghost" @click="closeResourcesModal">取消</button>
                    <button class="btn-modal btn-modal-primary" @click="handleResourcesSubmit">保存</button>
                </div>
            </div>
        </div>

        <!-- 编辑组成员弹窗 -->
        <div class="modal-overlay" v-if="showMembersModal" @click.self="closeMembersModal">
            <div class="member-modal">
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-members"></span>
                        <h3 class="modal-title">组成员</h3>
                    </div>
                    <button type="button" class="modal-close" @click="closeMembersModal" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-fixed">
                    <!-- 可添加的用户区域 -->
                    <div class="pool-section">
                        <div class="pool-header">
                            <span class="pool-title">可添加的用户</span>
                        </div>
                        <div class="pool-search">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                type="text"
                                v-model="memberSearchKeyword"
                                placeholder="搜索可添加的用户..."
                                class="pool-search-input"
                            />
                        </div>
                        <div class="member-pool member-pool-fixed">
                            <div class="member-pool-list">
                                <div
                                    v-for="u in filteredAvailableUsers"
                                    :key="u.id"
                                    class="member-pool-item"
                                    :class="{ selected: formData.selectedUserIds?.includes(u.id) }"
                                    @click="toggleMemberSelection(u)"
                                >
                                    <span class="member-checkbox" @click.stop="toggleMemberSelection(u)">
                                        <svg v-if="formData.selectedUserIds?.includes(u.id)" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                            <polyline points="20 6 9 17 4 12"/>
                                        </svg>
                                    </span>
                                    <span class="member-pool-avatar" @click.stop="toggleMemberSelection(u)">{{ u.username.charAt(0).toUpperCase() }}</span>
                                    <span class="member-pool-name" @click.stop="toggleMemberSelection(u)">{{ u.username }}</span>
                                    <span class="member-pool-email" @click.stop="toggleMemberSelection(u)">{{ u.email }}</span>
                                    <select
                                        class="member-level-select"
                                        v-model.number="formData.addLevel"
                                        @click.stop
                                    >
                                        <option v-for="lv in levelOptions" :key="lv.value" :value="lv.value">{{ lv.label }}</option>
                                    </select>
                                </div>
                                <div v-if="filteredAvailableUsers.length === 0" class="pool-empty">
                                    {{ memberSearchKeyword ? '未找到匹配的用户' : '暂无可添加的用户' }}
                                </div>
                            </div>
                        </div>
                        <div class="pool-actions">
                            <div class="pool-selected-info">
                                已选中 <strong>{{ formData.selectedUserIds?.length || 0 }}</strong> 项用户
                            </div>
                            <button
                                type="button"
                                class="btn-add-resources"
                                :disabled="!formData.selectedUserIds?.length"
                                @click="addSelectedMembers"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                添加选中用户 ({{ formData.selectedUserIds?.length || 0 }})
                            </button>
                        </div>
                    </div>

                    <!-- 已添加的成员区域 -->
                    <div class="selected-section">
                        <div class="selected-header">
                            <span class="selected-title">已在组成员</span>
                            <span class="selected-count">{{ formData.members?.length || 0 }} 项</span>
                        </div>
                        <div class="member-tags-area">
                            <div class="member-tags" v-if="formData.members?.length">
                                <div class="member-tag" v-for="(m, idx) in formData.members" :key="m.userId">
                                    <span class="member-tag-avatar">{{ m.username.charAt(0).toUpperCase() }}</span>
                                    <span class="member-tag-name">{{ m.username }}</span>
                                    <select
                                        class="member-tag-level"
                                        v-model.number="m.level"
                                        @click.stop
                                    >
                                        <option v-for="lv in levelOptions" :key="lv.value" :value="lv.value">{{ lv.label }}</option>
                                    </select>
                                    <button type="button" class="member-tag-remove" @click="removeMember(idx)" title="移除">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="member-empty">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                    <circle cx="9" cy="7" r="4"/>
                                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                </svg>
                                <p>尚未添加任何成员</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-modal btn-modal-ghost" @click="closeMembersModal">取消</button>
                    <button class="btn-modal btn-modal-primary" @click="handleMembersSubmit">保存</button>
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
const resourceSearchKeyword = ref('')
const memberSearchKeyword = ref('')

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

const filteredAvailableResourceGroups = computed(() => {
    if (!resourceSearchKeyword.value) return availableResourceGroups.value
    return availableResourceGroups.value.filter(rg =>
        rg.name.toLowerCase().includes(resourceSearchKeyword.value.toLowerCase())
    )
})

const getResourceGroupId = (name) => {
    const rg = resourceGroups.value.find(r => r.name === name)
    return rg ? rg.id : '-'
}

const availableUsersForForm = computed(() => {
    const ids = new Set((formData.value.members || []).map(m => m.userId))
    return allUsers.value.filter(u => !ids.has(u.id) && u.id !== 1)
})

const filteredAvailableUsers = computed(() => {
    if (!memberSearchKeyword.value) return availableUsersForForm.value
    const keyword = memberSearchKeyword.value.toLowerCase()
    return availableUsersForForm.value.filter(u =>
        u.username.toLowerCase().includes(keyword) ||
        (u.email && u.email.toLowerCase().includes(keyword))
    )
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
    resourceSearchKeyword.value = ''
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
    memberSearchKeyword.value = ''
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
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border-bottom: 1px solid #ebeef5;
}

.modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.modal-title-accent {
    width: 4px;
    height: 36px;
    border-radius: 2px;
    flex-shrink: 0;
}

.modal-title-accent.accent-resources { background: linear-gradient(180deg, #409eff, #66b1ff); }
.modal-title-accent.accent-members { background: linear-gradient(180deg, #6666ff, #9999ff); }

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #909399;
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

/* 组成员弹窗 */
.member-modal {
    width: 100%;
    max-width: 680px;
    height: 580px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modal-in 0.2s ease;
}

/* 用户池列表 */
.member-pool {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
}

.member-pool-fixed {
    height: 140px;
}

.member-pool-list {
    height: 100%;
    overflow-y: auto;
    padding: 8px;
}

/* 滚动条样式 */
.member-pool-list::-webkit-scrollbar,
.member-scroll-area::-webkit-scrollbar {
    width: 6px;
}

.member-pool-list::-webkit-scrollbar-track,
.member-scroll-area::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.member-pool-list::-webkit-scrollbar-thumb,
.member-scroll-area::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.member-pool-list::-webkit-scrollbar-thumb:hover,
.member-scroll-area::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}

.member-pool-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.member-pool-item:hover {
    background: #f9fafb;
}

.member-pool-item.selected {
    background: #eff6ff;
}

.member-checkbox {
    width: 16px;
    height: 16px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    background: #fff;
}

.member-pool-item.selected .member-checkbox {
    background: #6666ff;
    border-color: #6666ff;
    color: white;
}

.member-pool-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
}

.member-pool-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    flex-shrink: 0;
}

.member-pool-email {
    font-size: 11px;
    color: #9ca3af;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.member-level-select {
    padding: 4px 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    background: #fff;
    color: #374151;
    flex-shrink: 0;
}

/* 成员标签区域 */
.member-tags-area {
    flex: 1;
    overflow-y: auto;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    min-height: 80px;
}

.member-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
}

.member-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px 6px 8px;
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #166534;
    transition: all 0.2s;
}

.member-tag:hover {
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border-color: #86efac;
}

.member-tag-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 600;
    flex-shrink: 0;
}

.member-tag-name {
    color: #1f2937;
}

.member-tag-level {
    padding: 2px 6px;
    border: 1px solid #86efac;
    border-radius: 4px;
    font-size: 11px;
    background: #fff;
    color: #166534;
    margin: 0 2px;
}

.member-tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    margin-left: 2px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #60a5fa;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.member-tag-remove:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
}

.member-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
}

.member-empty svg {
    color: #d1d5db;
    margin-bottom: 8px;
}

.member-empty p {
    margin: 0;
    font-size: 13px;
    color: #9ca3af;
}

/* 访问资源弹窗 */
.resource-modal {
    width: 100%;
    max-width: 680px;
    height: 580px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modal-in 0.2s ease;
}

.modal-body-fixed {
    padding: 16px 20px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* 资源池区域 */
.pool-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.pool-header {
    display: flex;
    align-items: center;
}

.pool-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.pool-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 6px 12px;
}

.pool-search svg {
    color: #9ca3af;
    flex-shrink: 0;
}

.pool-search-input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: #374151;
}

.pool-search-input::placeholder {
    color: #9ca3af;
}

.resource-pool {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
}

.resource-pool-fixed {
    height: 140px;
}

.resource-pool-list {
    height: 100%;
    overflow-y: auto;
    padding: 8px;
}

/* 滚动条样式 */
.resource-pool-list::-webkit-scrollbar,
.manage-list::-webkit-scrollbar {
    width: 6px;
}

.resource-pool-list::-webkit-scrollbar-track,
.manage-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.resource-pool-list::-webkit-scrollbar-thumb,
.manage-list::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.resource-pool-list::-webkit-scrollbar-thumb:hover,
.manage-list::-webkit-scrollbar-thumb:hover {
    background: #a1a1a1;
}

.pool-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.pool-item:hover {
    background: #f9fafb;
}

.pool-item.selected {
    background: #eff6ff;
}

.pool-checkbox {
    width: 16px;
    height: 16px;
    border: 2px solid #d1d5db;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
    background: #fff;
}

.pool-item.selected .pool-checkbox {
    background: #409eff;
    border-color: #409eff;
    color: white;
}

.pool-item-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    min-width: 0;
}

.pool-item-id {
    font-size: 11px;
    color: #9ca3af;
    flex-shrink: 0;
}

.pool-empty {
    padding: 24px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
}

.pool-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pool-selected-info {
    font-size: 13px;
    color: #64748b;
}

.pool-selected-info strong {
    color: #409eff;
    font-weight: 600;
}

.btn-add-resources {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: linear-gradient(135deg, #409eff, #66b1ff);
    border: none;
    border-radius: 8px;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

.btn-add-resources:hover:not(:disabled) {
    background: linear-gradient(135deg, #66b1ff, #409eff);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.btn-add-resources:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
}

/* 已添加资源区域 */
.selected-section {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 0;
}

.selected-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
}

.selected-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.selected-count {
    font-size: 12px;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
}

.selected-scroll-area {
    flex: 1;
    overflow-y: auto;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    min-height: 100px;
}

.selected-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 12px;
}

.selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px 6px 12px;
    background: linear-gradient(135deg, #eff6ff, #dbeafe);
    border: 1px solid #bfdbfe;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #1e40af;
    transition: all 0.2s;
}

.selected-tag svg {
    color: #3b82f6;
    flex-shrink: 0;
}

.selected-tag:hover {
    background: linear-gradient(135deg, #dbeafe, #bfdbfe);
    border-color: #93c5fd;
}

.tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    margin-left: 2px;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: #60a5fa;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.tag-remove:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #ef4444;
}

.selected-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    text-align: center;
}

.selected-empty svg {
    color: #d1d5db;
    margin-bottom: 8px;
}

.selected-empty p {
    margin: 0;
    font-size: 13px;
    color: #9ca3af;
}

/* 弹窗底部 */
.modal-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-top: 1px solid #ebeef5;
    background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
}

.btn-modal {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 96px;
    padding: 10px 20px;
    border-radius: 10px;
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

@media (max-width: 540px) {
    .resource-modal {
        max-width: 100%;
        height: auto;
        max-height: 90vh;
        border-radius: 16px;
    }
}
</style>
