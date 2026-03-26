<template>
    <div class="resource-group-page">
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
                        <div class="group-desc">ID: {{ group.id }}</div>
                    </div>
                    <div class="group-actions">
                        <button class="action-btn edit" @click="handleEdit(group)">编辑</button>
                        <button class="action-btn match" @click="manageMatches(group)">匹配管理</button>
                        <button class="action-btn delete" @click="handleDelete(group)">删除</button>
                    </div>
                </div>
                <div class="group-resources">
                    <div class="resource-title">包含资源 ({{ group.matchedResources.length }})</div>
                    <div class="resource-tags">
                        <span class="resource-tag" v-for="res in group.matchedResources.slice(0, 5)" :key="res.resourceId">
                            {{ res.resourceName }}
                            <span class="level-badge">{{ levelText(res.effectiveLevel) }}</span>
                        </span>
                        <span class="resource-more" v-if="group.matchedResources.length > 5">+{{ group.matchedResources.length - 5 }}</span>
                    </div>
                </div>
            </div>

            <div v-if="filteredGroups.length === 0" class="empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <p>暂无资源组</p>
            </div>
        </div>

        <!-- 创建/编辑弹窗 -->
        <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
            <div class="modal">
                <div class="modal-header">
                    <h3>{{ modalMode === 'add' ? '创建资源组' : '编辑资源组' }}</h3>
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

        <!-- 资源匹配管理弹窗 -->
        <div class="modal-overlay" v-if="showMatchModal" @click.self="showMatchModal = false">
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3>资源匹配管理 - {{ currentGroup?.name }}</h3>
                    <button class="modal-close" @click="showMatchModal = false">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="match-toolbar">
                        <button class="btn btn-primary btn-sm" @click="addMatch">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            添加资源匹配
                        </button>
                    </div>
                    <div class="match-list">
                        <div class="match-header">
                            <span class="col-resource">选择资源</span>
                            <span class="col-level">生效权限等级</span>
                            <span class="col-action">操作</span>
                        </div>
                        <div class="match-item" v-for="(match, idx) in currentMatches" :key="idx">
                            <select v-model="match.resourceId" class="resource-select">
                                <option value="">请选择资源</option>
                                <option v-for="res in availableResources" :key="res.id" :value="res.id">{{ res.name }}</option>
                            </select>
                            <select v-model="match.effectiveLevel" class="level-select">
                                <option value="1">1级</option>
                                <option value="2">2级</option>
                                <option value="3">3级</option>
                                <option value="4">4级</option>
                            </select>
                            <button class="btn-icon delete" @click="removeMatch(idx)" title="删除">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div v-if="currentMatches.length === 0" class="empty-matches">
                            暂无资源匹配，请点击添加
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn" @click="showMatchModal = false">取消</button>
                    <button class="btn btn-primary" @click="saveMatches">保存</button>
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
import { ref, computed } from 'vue'

const searchKeyword = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const showMatchModal = ref(false)
const modalMode = ref('add')
const currentGroup = ref(null)
const currentMatches = ref([])

const availableResources = ref([
    { id: 1, name: '公司堡垒机' },
    { id: 2, name: 'VPN控制台' },
    { id: 3, name: '财务数据库' },
    { id: 4, name: '核心服务器' },
    { id: 5, name: '员工手册' },
    { id: 6, name: '客户管理系统' }
])

const groups = ref([
    {
        id: 1,
        name: '核心资源',
        matchedResources: [
            { resourceId: 1, resourceName: '公司堡垒机', effectiveLevel: 4 },
            { resourceId: 3, resourceName: '财务数据库', effectiveLevel: 4 },
            { resourceId: 4, resourceName: '核心服务器', effectiveLevel: 3 }
        ]
    },
    {
        id: 2,
        name: '普通资源',
        matchedResources: [
            { resourceId: 2, resourceName: 'VPN控制台', effectiveLevel: 2 },
            { resourceId: 6, resourceName: '客户管理系统', effectiveLevel: 2 }
        ]
    },
    {
        id: 3,
        name: '公开资源',
        matchedResources: [
            { resourceId: 5, resourceName: '员工手册', effectiveLevel: 1 }
        ]
    }
])

const formData = ref({ name: '' })

const filteredGroups = computed(() => {
    if (!searchKeyword.value) return groups.value
    return groups.value.filter(g => g.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

const levelText = (level) => {
    const map = { 1: '1级', 2: '2级', 3: '3级', 4: '4级' }
    return map[level] || level
}

const handleAdd = () => {
    modalMode.value = 'add'
    formData.value = { name: '' }
    showModal.value = true
}

const handleEdit = (group) => {
    modalMode.value = 'edit'
    formData.value = { ...group }
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
    if (modalMode.value === 'add') {
        const newId = Math.max(...groups.value.map(g => g.id), 0) + 1
        groups.value.push({ id: newId, name: formData.value.name, matchedResources: [] })
    } else {
        const idx = groups.value.findIndex(g => g.id === formData.value.id)
        if (idx !== -1) groups.value[idx].name = formData.value.name
    }
    showModal.value = false
}

const manageMatches = (group) => {
    currentGroup.value = group
    currentMatches.value = group.matchedResources ? [...group.matchedResources.map(m => ({ ...m }))] : []
    showMatchModal.value = true
}

const addMatch = () => {
    currentMatches.value.push({ resourceId: '', effectiveLevel: 1 })
}

const removeMatch = (idx) => {
    currentMatches.value.splice(idx, 1)
}

const saveMatches = () => {
    const validMatches = currentMatches.value
        .filter(m => m.resourceId)
        .map(m => {
            const res = availableResources.value.find(r => r.id === m.resourceId)
            return {
                resourceId: m.resourceId,
                resourceName: res ? res.name : '',
                effectiveLevel: m.effectiveLevel
            }
        })

    const idx = groups.value.findIndex(g => g.id === currentGroup.value.id)
    if (idx !== -1) {
        groups.value[idx].matchedResources = validMatches
    }
    showMatchModal.value = false
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
.group-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.group-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.group-info { flex: 1; min-width: 0; }
.group-name { font-size: 16px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.group-desc { font-size: 13px; color: #909399; }
.group-actions { display: flex; gap: 6px; flex-wrap: wrap; }
.action-btn { padding: 4px 10px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.3s; }
.action-btn.edit { background: #e6f7ff; color: #1890ff; }
.action-btn.edit:hover { background: #bae7ff; }
.action-btn.match { background: #f0f5ff; color: #666ee8; }
.action-btn.match:hover { background: #e0e8ff; }
.action-btn.delete { background: #fff2f0; color: #f56c6c; }
.action-btn.delete:hover { background: #ffccc7; }
.group-resources { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ebeef5; }
.resource-title { font-size: 13px; color: #909399; margin-bottom: 8px; }
.resource-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.resource-tag { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; background: white; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 12px; color: #606266; }
.level-badge { padding: 1px 4px; background: #667eea; color: white; border-radius: 3px; font-size: 10px; }
.resource-more { display: inline-block; padding: 4px 10px; background: #f5f7fa; border-radius: 4px; font-size: 12px; color: #909399; }
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
</style>
