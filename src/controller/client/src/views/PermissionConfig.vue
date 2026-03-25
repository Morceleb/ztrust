<template>
    <div class="permission-config-page">
        <div class="toolbar">
            <h2 class="toolbar-title">权限配置矩阵</h2>
            <button class="btn btn-primary" @click="handleSave">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                </svg>
                保存配置
            </button>
        </div>

        <div class="permission-matrix">
            <table class="matrix-table">
                <thead>
                    <tr>
                        <th class="corner-cell">角色组 / 资源组</th>
                        <th v-for="rg in resourceGroups" :key="rg.id">{{ rg.name }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="role in roleGroups" :key="role.id">
                        <td class="row-header">{{ role.name }}</td>
                        <td v-for="rg in resourceGroups" :key="rg.id" class="permission-cell">
                            <div v-if="getPermission(role.id, rg.id)" class="permission-config">
                                <select
                                    :value="getPermission(role.id, rg.id)?.highestLevel || 1"
                                    @change="updateLevel(role.id, rg.id, $event.target.value)"
                                    class="level-select"
                                >
                                    <option value="1">1级</option>
                                    <option value="2">2级</option>
                                    <option value="3">3级</option>
                                    <option value="4">4级</option>
                                </select>
                                <button class="btn-remove" @click="removePermission(role.id, rg.id)" title="移除权限">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            </div>
                            <button v-else class="btn-add" @click="addPermission(role.id, rg.id)">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                添加
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="permission-summary">
            <h3 class="summary-title">权限等级说明</h3>
            <div class="summary-content">
                <div class="summary-item">
                    <span class="summary-icon level-1"></span>
                    <span class="summary-text">1级</span>
                </div>
                <div class="summary-item">
                    <span class="summary-icon level-2"></span>
                    <span class="summary-text">2级</span>
                </div>
                <div class="summary-item">
                    <span class="summary-icon level-3"></span>
                    <span class="summary-text">3级</span>
                </div>
                <div class="summary-item">
                    <span class="summary-icon level-4"></span>
                    <span class="summary-text">4级</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const roleGroups = ref([
    { id: 1, name: '管理员' },
    { id: 2, name: '运维人员' },
    { id: 3, name: '普通用户' }
])

const resourceGroups = ref([
    { id: 1, name: '核心资源' },
    { id: 2, name: '普通资源' },
    { id: 3, name: '公开资源' }
])

const permissions = ref([
    { roleGroupId: 1, resourceGroupId: 1, highestLevel: 4 },
    { roleGroupId: 1, resourceGroupId: 2, highestLevel: 4 },
    { roleGroupId: 1, resourceGroupId: 3, highestLevel: 4 },
    { roleGroupId: 2, resourceGroupId: 1, highestLevel: 2 },
    { roleGroupId: 2, resourceGroupId: 2, highestLevel: 3 },
    { roleGroupId: 3, resourceGroupId: 3, highestLevel: 1 }
])

const getPermission = (roleGroupId, resourceGroupId) => {
    return permissions.value.find(p => p.roleGroupId === roleGroupId && p.resourceGroupId === resourceGroupId)
}

const addPermission = (roleGroupId, resourceGroupId) => {
    permissions.value.push({ roleGroupId, resourceGroupId, highestLevel: 1 })
}

const removePermission = (roleGroupId, resourceGroupId) => {
    const idx = permissions.value.findIndex(p => p.roleGroupId === roleGroupId && p.resourceGroupId === resourceGroupId)
    if (idx !== -1) permissions.value.splice(idx, 1)
}

const updateLevel = (roleGroupId, resourceGroupId, level) => {
    const perm = getPermission(roleGroupId, resourceGroupId)
    if (perm) perm.highestLevel = parseInt(level)
}

const handleSave = () => {
    alert('权限配置已保存')
}
</script>

<style scoped>
.permission-config-page { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.toolbar-title { font-size: 18px; font-weight: 600; color: #303133; margin: 0; }
.btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border: 1px solid #dcdfe6; border-radius: 6px; background: white; color: #606266; font-size: 14px; cursor: pointer; transition: all 0.3s; }
.btn:hover { border-color: #409eff; color: #409eff; }
.btn-primary { background: #409eff; border-color: #409eff; color: white; }
.btn-primary:hover { background: #66b1ff; }
.permission-matrix { overflow-x: auto; margin-bottom: 24px; }
.matrix-table { width: 100%; border-collapse: collapse; min-width: 600px; }
.matrix-table th, .matrix-table td { padding: 16px; text-align: center; border: 1px solid #ebeef5; }
.matrix-table th { background: #fafafa; font-weight: 600; color: #606266; font-size: 14px; }
.corner-cell { background: #f5f7fa !important; }
.row-header { background: #fafafa; font-weight: 600; color: #303133; text-align: left !important; }
.permission-cell { min-width: 120px; }
.permission-config { display: flex; align-items: center; gap: 8px; justify-content: center; }
.level-select { padding: 4px 8px; border: 1px solid #dcdfe6; border-radius: 4px; font-size: 12px; cursor: pointer; }
.level-select:focus { border-color: #409eff; outline: none; }
.btn-remove { width: 24px; height: 24px; padding: 0; border: none; background: #fff2f0; color: #f56c6c; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.btn-remove:hover { background: #ffccc7; }
.btn-add { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border: 1px dashed #dcdfe6; background: transparent; color: #909399; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.btn-add:hover { border-color: #409eff; color: #409eff; }
.permission-summary { background: #f5f7fa; border-radius: 8px; padding: 20px; }
.summary-title { font-size: 16px; font-weight: 600; color: #303133; margin: 0 0 16px 0; }
.summary-content { display: flex; flex-wrap: wrap; gap: 16px; }
.summary-item { display: flex; align-items: center; gap: 8px; }
.summary-icon { width: 16px; height: 16px; border-radius: 4px; }
.summary-icon.level-1 { background: #67c23a; }
.summary-icon.level-2 { background: #409eff; }
.summary-icon.level-3 { background: #e6a23c; }
.summary-icon.level-4 { background: #f56c6c; }
.summary-text { font-size: 14px; color: #606266; }
</style>
