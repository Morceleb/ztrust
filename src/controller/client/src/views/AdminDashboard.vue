<template>
    <div class="dashboard">
        <!-- 统计卡片 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon users">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.totalUsers }}</div>
                    <div class="stat-label">总人数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon resources">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.totalResources }}</div>
                    <div class="stat-label">资源总数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon user-groups">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.userGroups }}</div>
                    <div class="stat-label">用户组</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon resource-groups">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-value">{{ stats.resourceGroups }}</div>
                    <div class="stat-label">资源组</div>
                </div>
            </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
            <h2 class="section-title">快捷操作</h2>
            <div class="actions-grid">
                <div class="action-card" @click="$router.push('/users')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">人员管理</div>
                        <div class="action-desc">管理系统用户账号</div>
                    </div>
                </div>
                <div class="action-card" @click="$router.push('/resources')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                            <line x1="8" y1="21" x2="16" y2="21"/>
                            <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">资源管理</div>
                        <div class="action-desc">管理系统资源项</div>
                    </div>
                </div>
                <div class="action-card" @click="$router.push('/user-groups')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">用户组管理</div>
                        <div class="action-desc">管理用户角色组</div>
                    </div>
                </div>
                <div class="action-card" @click="$router.push('/resource-groups')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">资源组管理</div>
                        <div class="action-desc">管理资源分组</div>
                    </div>
                </div>
                <div class="action-card" @click="$router.push('/permissions')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">权限审批</div>
                        <div class="action-desc">审批用户资源权限申请</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { listUsers } from '@/api/user.js'
import { listResources } from '@/api/resource.js'
import { listRoleGroups } from '@/api/roleGroup.js'
import { listResourceGroups } from '@/api/resourceGroup.js'

const stats = ref({
    totalUsers: 0,
    totalResources: 0,
    userGroups: 0,
    resourceGroups: 0
})

// 组件挂载时获取统计数据
onMounted(async () => {
    try {
        // 并行获取所有统计数据
        const [usersRes, resourcesRes, roleGroupsRes, resourceGroupsRes] = await Promise.all([
            listUsers({ page: 1, pageSize: 1 }),
            listResources({ page: 1, pageSize: 1 }),
            listRoleGroups(),
            listResourceGroups()
        ])

        // 解析用户总数
        if (usersRes?.code === 200) {
            const data = usersRes.data
            stats.value.totalUsers = data?.total || (Array.isArray(data) ? data.length : 0)
        } else if (Array.isArray(usersRes)) {
            stats.value.totalUsers = usersRes.length
        }

        // 解析资源总数
        if (resourcesRes?.code === 200) {
            const data = resourcesRes.data
            stats.value.totalResources = data?.total || (Array.isArray(data) ? data.length : 0)
        } else if (Array.isArray(resourcesRes)) {
            stats.value.totalResources = resourcesRes.length
        }

        // 解析用户组总数
        if (roleGroupsRes?.code === 200) {
            const list = Array.isArray(roleGroupsRes.data) ? roleGroupsRes.data : []
            stats.value.userGroups = list.length
        } else if (Array.isArray(roleGroupsRes)) {
            stats.value.userGroups = roleGroupsRes.length
        }

        // 解析资源组总数
        if (resourceGroupsRes?.code === 200) {
            const list = Array.isArray(resourceGroupsRes.data) ? resourceGroupsRes.data : []
            stats.value.resourceGroups = list.length
        } else if (Array.isArray(resourceGroupsRes)) {
            stats.value.resourceGroups = resourceGroupsRes.length
        }
    } catch (e) {
        console.error('获取统计数据失败:', e)
    }
})
</script>

<style scoped>
.dashboard {
    width: 100%;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: clamp(12px, 2vw, 20px);
    margin-bottom: clamp(20px, 3vw, 32px);
}

.stat-card {
    background: white;
    border-radius: clamp(8px, 1.5vw, 12px);
    padding: clamp(16px, 2vw, 24px);
    display: flex;
    align-items: center;
    gap: clamp(12px, 1.5vw, 16px);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: clamp(44px, 5vw, 56px);
    height: clamp(44px, 5vw, 56px);
    border-radius: clamp(8px, 1.5vw, 12px);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.stat-icon.users {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.stat-icon.resources {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.stat-icon.user-groups {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: white;
}

.stat-icon.resource-groups {
    background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    color: white;
}

.stat-content {
    min-width: 0;
}

.stat-value {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 700;
    color: #303133;
    line-height: 1.2;
}

.stat-label {
    font-size: clamp(12px, 1.2vw, 14px);
    color: #909399;
    margin-top: 4px;
}

.section-title {
    font-size: clamp(16px, 1.8vw, 18px);
    font-weight: 600;
    color: #303133;
    margin-bottom: clamp(12px, 1.5vw, 16px);
}

.quick-actions {
    margin-bottom: clamp(20px, 3vw, 32px);
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: clamp(12px, 2vw, 20px);
}

.action-card {
    background: white;
    border-radius: clamp(8px, 1.5vw, 12px);
    padding: clamp(16px, 2vw, 24px);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: clamp(10px, 1.2vw, 16px);
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.action-card:hover {
    border-color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);
}

.action-icon {
    width: clamp(40px, 4.5vw, 48px);
    height: clamp(40px, 4.5vw, 48px);
    background: linear-gradient(135deg, #f0f7ff 0%, #e6f0ff 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #409eff;
}

.action-text {
    min-width: 0;
}

.action-title {
    font-size: clamp(13px, 1.4vw, 16px);
    font-weight: 600;
    color: #303133;
}

.action-desc {
    font-size: clamp(11px, 1.1vw, 13px);
    color: #909399;
    margin-top: 4px;
}

/* 响应式布局 */
@media (max-width: 1400px) {
    .actions-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (max-width: 1100px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 900px) {
    .actions-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .stats-grid {
        grid-template-columns: 1fr;
    }

    .actions-grid {
        grid-template-columns: 1fr;
    }

    .action-card {
        flex-direction: row;
        text-align: left;
        gap: 16px;
    }

    .action-icon {
        width: 48px;
        height: 48px;
    }
}
</style>
