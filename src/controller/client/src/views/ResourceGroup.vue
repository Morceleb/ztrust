<template>
    <div class="resource-group-page">
        <!-- Toast 提示 -->
        <div class="toast" v-if="toastMessage">{{ toastMessage }}</div>
        <div class="toolbar">
            <div class="search-box">
                <input type="text" v-model="searchKeyword" placeholder="搜索资源组..." class="search-input" />
            </div>
            <button class="btn btn-primary" @click="handleAdd">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                创建资源组
            </button>
        </div>

        <div class="group-list">
            <div class="group-card" v-for="group in filteredGroups" :key="group.id">
                <div class="group-header">
                    <div class="group-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <div class="group-info">
                        <div class="group-name">{{ group.name }}</div>
                        <div class="group-name-actions">
                            <button class="action-btn edit" @click="handleEdit(group)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                编辑
                            </button>
                            <button class="action-btn add-res" @click="openAddResourceModal(group)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                添加资源
                            </button>
                            <button class="action-btn manage" @click="openManageResourceModal(group)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                                </svg>
                                管理资源
                            </button>
                            <button class="action-btn delete" @click="handleDelete(group)">删除</button>
                        </div>
                    </div>
                </div>
                <div class="group-resources">
                    <div class="resource-title">包含资源 ({{ group.matchedResources.length }})</div>
                    <div class="resource-card-list" v-if="group.matchedResources.length">
                        <div class="resource-card" v-for="res in group.matchedResources.slice(0, 8)" :key="res.resourceId">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            <span class="resource-card-name">{{ res.resourceName }}</span>
                            <span class="resource-card-level">{{ levelText(res.effectiveLevel) }}</span>
                        </div>
                        <div class="resource-more-card" v-if="group.matchedResources.length > 8">
                            +{{ group.matchedResources.length - 8 }} 更多
                        </div>
                    </div>
                    <div class="resource-empty" v-else>暂未添加资源</div>
                </div>
            </div>

            <div v-if="filteredGroups.length === 0" class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p>暂无资源组</p>
            </div>
        </div>

        <!-- 创建/编辑资源组弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ editingGroup ? '编辑资源组' : '创建资源组' }}</h3>
                    <button class="modal-close" @click="showModal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>资源组名称 <span class="required">*</span></label>
                        <input type="text" v-model="formData.name" placeholder="请输入资源组名称" />
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showModal = false">取消</button>
                    <button class="btn btn-primary" @click="handleSubmit">确定</button>
                </div>
            </div>
        </div>

        <!-- 添加资源弹窗 -->
        <div class="modal-overlay" v-if="showAddResourceModal" @click.self="showAddResourceModal = false">
            <div class="add-resource-modal">
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-add"></span>
                        <h3 class="modal-title">添加资源</h3>
                    </div>
                    <button class="modal-close" @click="showAddResourceModal = false" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-fixed">
                    <div class="pool-header">
                        <span class="pool-title">可添加的资源</span>
                        <span class="pool-count">{{ filteredPoolResources.length }} / {{ availablePoolResources.length }} 个</span>
                    </div>
                    <div class="pool-search">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            type="text"
                            v-model="poolSearchKeyword"
                            placeholder="搜索可添加的资源..."
                            class="pool-search-input"
                        />
                    </div>
                    <div class="resource-pool resource-pool-fixed">
                        <div class="resource-pool-list">
                            <div
                                v-for="res in filteredPoolResources"
                                :key="res.id"
                                class="pool-item"
                                :class="{ selected: selectedResourceMap[res.id] !== undefined }"
                                @click="toggleResourceSelection(res.id)"
                            >
                                <span class="pool-checkbox" @click.stop="toggleResourceSelection(res.id)">
                                    <svg v-if="selectedResourceMap[res.id] !== undefined" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                </span>
                                <span class="pool-item-name" @click.stop="toggleResourceSelection(res.id)">{{ res.name }}</span>
                                <select
                                    :value="selectedResourceMap[res.id] !== undefined ? selectedResourceMap[res.id] : 1"
                                    class="pool-item-level"
                                    @click.stop
                                    @change="setResourceLevel(res.id, $event)"
                                >
                                    <option value="1">1级</option>
                                    <option value="2">2级</option>
                                    <option value="3">3级</option>
                                    <option value="4">4级</option>
                                </select>
                            </div>
                            <div v-if="filteredPoolResources.length === 0" class="pool-empty">
                                {{ poolSearchKeyword ? '未找到匹配的资源' : '暂无可添加的资源，所有资源已在此组中' }}
                            </div>
                        </div>
                    </div>
                    <div class="pool-actions">
                        <div class="pool-selected-info">
                            已选中 <strong>{{ selectedCount }}</strong> 项资源
                        </div>
                        <button
                            type="button"
                            class="btn-add-resources"
                            :disabled="selectedCount === 0"
                            @click="addSelectedResources"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            添加选中资源 ({{ selectedCount }})
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 管理资源弹窗 -->
        <div class="modal-overlay" v-if="showManageResourceModal" @click.self="showManageResourceModal = false">
            <div class="manage-resource-modal">
                <div class="modal-header">
                    <div class="modal-title-wrap">
                        <span class="modal-title-accent accent-manage"></span>
                        <h3 class="modal-title">管理资源</h3>
                    </div>
                    <button class="modal-close" @click="showManageResourceModal = false" aria-label="关闭">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body modal-body-fixed">
                    <div class="manage-list manage-list-fixed">
                        <div
                            v-for="(match, idx) in currentMatches"
                            :key="match.resourceId"
                            class="manage-item"
                        >
                            <div class="manage-item-info">
                                <span class="manage-item-name">{{ match.resourceName }}</span>
                                <span class="manage-item-id">ID: {{ match.resourceId }}</span>
                            </div>
                            <select
                                v-model.number="match.effectiveLevel"
                                class="manage-item-level"
                                @change="markAsModified"
                            >
                                <option value="1">1级</option>
                                <option value="2">2级</option>
                                <option value="3">3级</option>
                                <option value="4">4级</option>
                            </select>
                            <button
                                type="button"
                                class="btn-remove"
                                @click="removeResourceFromGroup(idx)"
                                title="从组中移除"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div v-if="currentMatches.length === 0" class="manage-empty">
                            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            </svg>
                            <p>尚未添加任何资源到此组</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <div class="footer-info">
                        <span class="resource-count">共 {{ currentMatches.length }} 项资源</span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn-modal btn-modal-ghost" @click="handleCancelManage">取消</button>
                        <button class="btn-modal btn-modal-primary" @click="saveManageChanges">保存修改</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 删除资源组确认弹窗 -->
        <div class="delete-confirm-overlay" v-if="showDeleteModal" @click.self="cancelDelete">
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
                    确定要删除资源组「<strong>{{ deleteTarget?.name }}</strong>」吗？<br/>
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
import { ref, computed, onMounted } from 'vue'
import {
    listResourceGroups, saveResourceGroup, bindResourcesToGroup, deleteResourceGroup, getResourceGroupDetail
} from '@/api/resourceGroup.js'
import { listResources as apiListResources } from '@/api/resource.js'

const loading = ref(false)
const searchKeyword = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const showAddResourceModal = ref(false)
const showManageResourceModal = ref(false)
const currentGroup = ref(null)
const currentMatches = ref([])
const selectedResourceMap = ref({})
const poolSearchKeyword = ref('')
const availableResources = ref([])
const groups = ref([])
const hasModify = ref(false)
const editingGroup = ref(null)

const formData = ref({ name: '' })

let toastTimer = null
const toastMessage = ref('')
function showToast(msg, ms = 3200) {
    toastMessage.value = msg
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toastMessage.value = '' }, ms)
}

onMounted(async () => {
    await Promise.all([fetchGroups(), fetchAllResources()])
})

async function fetchGroups() {
    loading.value = true
    try {
        const res = await listResourceGroups()
        let groupList = []
        if (res.code === 200) {
            // 支持标准结构和直接返回数组
            const list = Array.isArray(res.data) ? res.data : (res.data?.list || [])
            if (list.length === 0 && Array.isArray(res)) {
                groupList = res
            } else {
                groupList = list
            }
        } else if (Array.isArray(res)) {
            groupList = res
        }
        // 为每个资源组获取详情（包含资源列表）
        const groupsWithDetails = await Promise.all(
            groupList.map(async (g) => {
                try {
                    const detailRes = await getResourceGroupDetail(g.id)
                    if (detailRes.code === 200 && detailRes.data) {
                        // 从详情中提取资源列表（接口返回字段为 resourceList）
                        const matchedResources = Array.isArray(detailRes.data.resourceList)
                            ? detailRes.data.resourceList.map(r => ({
                                resourceId: r.id || r.resourceId,
                                resourceName: r.name || r.resourceName || '',
                                effectiveLevel: r.importantLevel || 1
                            }))
                            : []
                        return {
                            ...g,
                            matchedResources
                        }
                    }
                } catch (e) {
                    console.error('获取资源组详情失败:', e)
                }
                return { ...g, matchedResources: [] }
            })
        )
        groups.value = groupsWithDetails
    } catch (e) {
        showToast('加载资源组列表失败')
    } finally {
        loading.value = false
    }
}

async function fetchAllResources() {
    try {
        const res = await apiListResources({ page: 1, pageSize: 1000 })
        if (res.code === 200) {
            const list = Array.isArray(res.data?.list) ? res.data.list : (Array.isArray(res.data) ? res.data : [])
            if (list.length === 0 && Array.isArray(res)) availableResources.value = res.map(r => ({ id: r.id, name: r.name || '' }))
            else availableResources.value = list.map(r => ({ id: r.id, name: r.name || '' }))
        } else if (Array.isArray(res)) {
            availableResources.value = res.map(r => ({ id: r.id, name: r.name || '' }))
        }
    } catch (e) {
        showToast('加载资源列表失败')
    }
}

const filteredGroups = computed(() => {
    if (!searchKeyword.value) return groups.value
    return groups.value.filter(g => (g.name || '').toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

// 可添加的资源池（排除已在此组中的）
const availablePoolResources = computed(() => {
    const matchedIds = new Set(currentMatches.value.map(m => m.resourceId))
    return availableResources.value.filter(res => !matchedIds.has(res.id))
})

// 根据搜索关键词过滤可添加的资源
const filteredPoolResources = computed(() => {
    if (!poolSearchKeyword.value) return availablePoolResources.value
    return availablePoolResources.value.filter(res =>
        (res.name || '').toLowerCase().includes(poolSearchKeyword.value.toLowerCase())
    )
})

const levelText = (level) => {
    const map = { 1: '1级', 2: '2级', 3: '3级', 4: '4级' }
    return map[level] || level
}

const handleAdd = () => {
    editingGroup.value = null
    formData.value = { name: '' }
    showModal.value = true
}

const handleEdit = (group) => {
    editingGroup.value = group
    formData.value = { name: group.name }
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

const confirmDelete = async () => {
    if (!deleteTarget.value) {
        cancelDelete()
        return
    }
    try {
        const res = await deleteResourceGroup(deleteTarget.value.id)
        if (res.code === 200) {
            showToast('资源组删除成功')
            await fetchGroups()
        } else {
            showToast(res.message || '删除失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
    cancelDelete()
}

const handleSubmit = async () => {
    if (!formData.value.name || !formData.value.name.trim()) return
    try {
        const data = editingGroup.value
            ? { id: editingGroup.value.id, name: formData.value.name.trim() }
            : { name: formData.value.name.trim() }
        const res = await saveResourceGroup(data)
        if (res.code === 200) {
            showToast(editingGroup.value ? '资源组更新成功' : '资源组创建成功')
            await fetchGroups()
            showModal.value = false
        } else {
            showToast(res.message || '操作失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
}

const openAddResourceModal = (group) => {
    currentGroup.value = group
    // 直接使用卡片上已加载的资源数据
    currentMatches.value = group.matchedResources ? [...group.matchedResources.map(m => ({ ...m }))] : []
    selectedResourceMap.value = {}
    poolSearchKeyword.value = ''
    showAddResourceModal.value = true
}

const openManageResourceModal = async (group) => {
    currentGroup.value = group
    // 重新获取资源组详情，确保数据最新
    try {
        const detailRes = await getResourceGroupDetail(group.id)
        if (detailRes.code === 200 && detailRes.data) {
            // 从详情中提取资源列表（接口返回字段为 resourceList）
            const matchedResources = Array.isArray(detailRes.data.resourceList)
                ? detailRes.data.resourceList.map(r => ({
                    resourceId: r.id || r.resourceId,
                    resourceName: r.name || r.resourceName || '',
                    effectiveLevel: r.importantLevel || 1
                }))
                : []
            currentMatches.value = matchedResources
        } else {
            currentMatches.value = group.matchedResources ? [...group.matchedResources.map(m => ({ ...m }))] : []
        }
    } catch (e) {
        currentMatches.value = group.matchedResources ? [...group.matchedResources.map(m => ({ ...m }))] : []
    }
    hasModify.value = false
    showManageResourceModal.value = true
}

const toggleResourceSelection = (resourceId) => {
    const map = { ...selectedResourceMap.value }
    if (map[resourceId] !== undefined) {
        delete map[resourceId]
    } else {
        map[resourceId] = 1
    }
    selectedResourceMap.value = map
}

const setResourceLevel = (resourceId, event) => {
    const map = { ...selectedResourceMap.value }
    map[resourceId] = Number(event.target.value)
    selectedResourceMap.value = map
}

const selectedCount = computed(() => Object.keys(selectedResourceMap.value).length)

const addSelectedResources = () => {
    const map = selectedResourceMap.value
    if (!Object.keys(map).length) return

    Object.entries(map).forEach(([idStr, level]) => {
        const id = Number(idStr)
        const res = availableResources.value.find(r => r.id === id)
        if (res && !currentMatches.value.some(m => m.resourceId === id)) {
            currentMatches.value.push({
                resourceId: res.id,
                resourceName: res.name,
                effectiveLevel: level
            })
        }
    })

    selectedResourceMap.value = {}
    saveGroupResources()
}

const removeResourceFromGroup = (idx) => {
    currentMatches.value.splice(idx, 1)
    hasModify.value = true
}

const markAsModified = () => {
    hasModify.value = true
}

const saveManageChanges = async () => {
    await saveGroupResources()
    hasModify.value = false
    showManageResourceModal.value = false
}

const handleCancelManage = () => {
    if (hasModify.value) {
        if (confirm('您有未保存的修改，确定要关闭吗？')) {
            showManageResourceModal.value = false
        }
    } else {
        showManageResourceModal.value = false
    }
}

const saveGroupResources = async () => {
    if (!currentGroup.value) return
    const payload = {
        groupId: currentGroup.value.id,
        resources: currentMatches.value.map(m => ({
            resourceId: m.resourceId,
            importantLevel: m.effectiveLevel || 1
        }))
    }
    console.log('发送数据:', JSON.stringify(payload, null, 2))
    try {
        const res = await bindResourcesToGroup(payload)
        if (res.code === 200) {
            showToast('资源组资源保存成功')
            await fetchGroups()
        } else {
            showToast(res.message || '保存失败')
        }
    } catch (e) {
        showToast(e?.message || '网络错误')
    }
}
</script>

<style scoped>
.resource-group-page { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.search-box { display: flex; align-items: center; background: #f5f7fa; border-radius: 8px; padding: 4px 12px; }
.search-input { border: none; background: transparent; padding: 8px; outline: none; width: 200px; font-size: 14px; }
.btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn:hover { border-color: #409eff; color: #409eff; }
.btn-primary { background: #409eff; border-color: #409eff; color: white; }
.btn-primary:hover { background: #66b1ff; }
.btn-sm { padding: 6px 12px; font-size: 13px; }
.group-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
.group-card { background: #fafafa; border-radius: 12px; padding: 20px; border: 1px solid #ebeef5; transition: all 0.3s; }
.group-card:hover { border-color: #409eff; box-shadow: 0 4px 12px rgba(64, 158, 255, 0.1); }
.group-header {
    display: grid;
    grid-template-columns: 48px 1fr;
    column-gap: 12px;
    row-gap: 12px;
    align-items: start;
    margin-bottom: 16px;
}
.group-icon {
    grid-row: 1;
    grid-column: 1;
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}
.group-info {
    grid-row: 1;
    grid-column: 2;
    min-width: 0;
}
.group-name {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 8px;
    line-height: 1.4;
    word-break: keep-all;
    overflow-wrap: anywhere;
}
.group-desc { font-size: 13px; color: #909399; }
/* 资源组名称右侧的按钮容器，与名称左对齐，一行显示 */
.group-name-actions {
    display: flex;
    flex-wrap: nowrap;
    gap: 4px;
    justify-content: flex-start;
    align-items: center;
}
.group-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.action-btn { display: inline-flex; align-items: center; gap: 3px; padding: 4px 8px; border: none; border-radius: 6px; font-size: 12px; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.action-btn.edit { background: #e6f7ff; color: #1890ff; }
.action-btn.edit:hover { background: #1890ff; color: white; }
.action-btn.add-res { background: #f0f5ff; color: #6666ff; }
.action-btn.add-res:hover { background: #6666ff; color: white; }
.action-btn.manage { background: #e6f7ff; color: #409eff; }
.action-btn.manage:hover { background: #409eff; color: white; }
.action-btn.delete { background: #fff2f0; color: #f56c6c; }
.action-btn.delete:hover { background: #f56c6c; color: white; }
.group-resources { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; }
.resource-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.resource-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.resource-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: white; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 12px; color: #606266; }
.level-badge { padding: 1px 4px; background: #667eea; color: white; border-radius: 3px; font-size: 10px; }
.resource-more { display: inline-block; padding: 4px 10px; background: #f5f7fa; border-radius: 4px; font-size: 12px; color: #909399; }
/* 资源卡片列表样式 */
.resource-card-list { display: flex; flex-wrap: wrap; gap: 8px; }
.resource-card {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 12px;
    color: #374151;
    transition: all 0.2s;
}
.resource-card:hover { border-color: #409eff; background: #f0f7ff; }
.resource-card svg { color: #667eea; flex-shrink: 0; }
.resource-card-name { font-weight: 500; white-space: nowrap; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
.resource-card-level { padding: 1px 5px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border-radius: 4px; font-size: 10px; flex-shrink: 0; }
.resource-more-card { display: inline-flex; align-items: center; padding: 6px 12px; background: #f5f7fa; border: 1px dashed #d1d5db; border-radius: 8px; font-size: 12px; color: #9ca3af; }
.resource-empty { font-size: 13px; color: #9ca3af; padding: 4px 0; }
.empty-state { grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #909399; }
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: white; border-radius: 12px; width: 480px; max-width: 90%; max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
.modal-lg { width: 640px; }
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
.match-toolbar { margin-bottom: 16px; }
.match-list { border: 1px solid #ebeef5; border-radius: 6px; overflow: hidden; }
.match-header { display: flex; gap: 12px; padding: 12px 16px; background: #fafafa; font-size: 13px; font-weight: 600; color: #606266; }
.col-resource { flex: 1; }
.col-level { width: 160px; }
.col-action { width: 40px; }
.match-item { display: flex; gap: 12px; padding: 12px 16px; border-top: 1px solid #ebeef5; align-items: center; }
.match-item:first-child { border-top: none; }
.resource-select, .level-select { padding: 6px 10px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 13px; }
.resource-select { flex: 1; }
.level-select { width: 160px; }
.btn-icon { width: 28px; height: 28px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-icon.delete { background: #fff2f0; color: #f56c6c; }
.btn-icon.delete:hover { background: #ffccc7; }
.empty-matches { text-align: center; padding: 40px; color: #909399; }

/* 添加资源弹窗 */
.add-resource-modal {
    width: 100%;
    max-width: 580px;
    height: 460px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modal-in 0.2s ease;
}

/* 管理资源弹窗 */
.manage-resource-modal {
    width: 100%;
    max-width: 580px;
    height: 460px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modal-in 0.2s ease;
}

@keyframes modal-in {
    from { opacity: 0; transform: scale(0.96) translateY(8px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px;
    background: linear-gradient(180deg, #f8fafc 0%, #fff 100%);
    border-bottom: 1px solid #e2e8f0;
}

.modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-title-accent {
    width: 4px;
    height: 40px;
    border-radius: 2px;
    background: linear-gradient(180deg, #6666ff, #9999ff);
}

.accent-add {
    background: linear-gradient(180deg, #6666ff, #9999ff);
}

.accent-manage {
    background: linear-gradient(180deg, #409eff, #66b1ff);
}

.modal-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    letter-spacing: -0.02em;
}

.modal-subtitle {
    margin: 4px 0 0;
    font-size: 13px;
    color: #64748b;
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
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.modal-body-fixed {
    padding: 20px 24px;
    overflow: hidden;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

/* 管理资源弹窗内部 */
.manage-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.manage-list {
    height: 360px;
    overflow-y: auto;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    padding: 8px;
}

.manage-list-fixed {
    height: 360px;
}

.manage-list::-webkit-scrollbar,
.manage-list {
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.manage-list::-webkit-scrollbar {
    display: none;
}

.manage-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #f9fafb;
    margin-bottom: 6px;
    border: 1px solid #f0f0f0;
    transition: all 0.2s;
}

.manage-item:last-child {
    margin-bottom: 0;
}

.manage-item:hover {
    border-color: #d1d5db;
    background: #fff;
}

.manage-item-name {
    flex: 1;
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.manage-item-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.manage-item-id {
    font-size: 11px;
    color: #9ca3af;
}

.manage-item-level {
    padding: 5px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    background: #fff;
    min-width: 70px;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
}

.manage-item-level:hover,
.manage-item-level:focus {
    border-color: #409eff;
}

.manage-empty {
    padding: 48px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
}

.manage-empty svg {
    margin-bottom: 12px;
    color: #d1d5db;
}

.manage-empty p {
    margin: 0;
}

.modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid #ebeef5;
    background: linear-gradient(180deg, #fafafa 0%, #fff 100%);
}

.footer-info {
    display: flex;
    align-items: center;
}

.resource-count {
    font-size: 13px;
    color: #64748b;
    background: #f3f4f6;
    padding: 4px 12px;
    border-radius: 12px;
}

.footer-actions {
    display: flex;
    gap: 10px;
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

/* 资源池区域 */
.resource-pool-area {
    display: flex;
    flex-direction: column;
}

.pool-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.pool-title {
    font-size: 14px;
    font-weight: 600;
    color: #374151;
}

.pool-count {
    font-size: 12px;
    color: #9ca3af;
    background: #f3f4f6;
    padding: 2px 8px;
    border-radius: 10px;
}

.pool-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 6px 12px;
    margin-bottom: 10px;
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
    height: 160px;
}

.resource-pool-list {
    height: 100%;
    overflow-y: auto;
    padding: 8px;
}

/* 隐藏原生滚动条样式，但保留滑动功能 */
.resource-pool-list::-webkit-scrollbar,
.selected-list::-webkit-scrollbar {
    width: 0px;
    background: transparent;
}

.resource-pool-list,
.selected-list {
    scrollbar-width: none;
    -ms-overflow-style: none;
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

.pool-item-level {
    padding: 4px 8px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    background: #fff;
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s;
    flex-shrink: 0;
}

.pool-item-level:hover,
.pool-item-level:focus {
    border-color: #6666ff;
}

.pool-empty {
    padding: 32px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
}

.pool-actions {
    margin-top: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pool-selected-info {
    font-size: 13px;
    color: #64748b;
}

.pool-selected-info strong {
    color: #6666ff;
    font-weight: 600;
}

.level-selector {
    display: flex;
    align-items: center;
    gap: 8px;
}

.level-label {
    font-size: 13px;
    color: #64748b;
}

.level-select {
    padding: 8px 12px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 13px;
    background: #fff;
    min-width: 100px;
}

.btn-add-resources {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #6666ff, #9999ff);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(102, 102, 255, 0.3);
}

.btn-add-resources:hover:not(:disabled) {
    background: linear-gradient(135deg, #5555ee, #8888ff);
    box-shadow: 0 4px 12px rgba(102, 102, 255, 0.4);
}

.btn-add-resources:disabled {
    background: #d1d5db;
    color: #9ca3af;
    cursor: not-allowed;
    box-shadow: none;
}

/* 已选择资源区域 - 占 1/3 */
.selected-resources-area {
    flex: 1;
    min-height: 180px;
    display: flex;
    flex-direction: column;
    border: 1px solid #f3f4f6;
    border-radius: 12px;
    background: #fafafa;
}

.selected-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;
    background: #fff;
    border-radius: 12px 12px 0 0;
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

.selected-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
}

.selected-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: #fff;
    margin-bottom: 6px;
    border: 1px solid #e5e7eb;
    transition: all 0.2s;
}

.selected-item:last-child {
    margin-bottom: 0;
}

.selected-item:hover {
    border-color: #d1d5db;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.selected-item-name {
    font-size: 13px;
    font-weight: 500;
    color: #1f2937;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.level-select-inline {
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 12px;
    background: #fff;
    min-width: 70px;
}

.btn-remove {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    background: #fff1f0;
    color: #f56c6c;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    flex-shrink: 0;
}

.btn-remove:hover {
    background: #ffccc7;
    color: #fff;
}

.selected-empty {
    padding: 24px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 24px;
    border-top: 1px solid #ebeef5;
    background: #fafafa;
}

/* 删除确认弹窗 */
.delete-confirm-overlay {
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
    to { opacity: 1; transform: scale(1) translateY(0); }
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
</style>
