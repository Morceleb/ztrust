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
                <div class="action-card" @click="$router.push('/import')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">导入数据</div>
                        <div class="action-desc">导入人员或资源名单</div>
                    </div>
                </div>
                <div class="action-card" @click="$router.push('/user-groups')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="8.5" cy="7" r="4"/>
                            <line x1="20" y1="8" x2="20" y2="14"/>
                            <line x1="23" y1="11" x2="17" y2="11"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">创建用户组</div>
                        <div class="action-desc">管理用户组成员</div>
                    </div>
                </div>
                <div class="action-card" @click="$router.push('/resource-groups')">
                    <div class="action-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                            <line x1="12" y1="11" x2="12" y2="17"/>
                            <line x1="9" y1="14" x2="15" y2="14"/>
                        </svg>
                    </div>
                    <div class="action-text">
                        <div class="action-title">创建资源组</div>
                        <div class="action-desc">管理资源组成员</div>
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

        <!-- 最近操作日志 -->
        <div class="recent-activity">
            <h2 class="section-title">最近操作</h2>
            <div class="activity-list">
                <div class="activity-item" v-for="(item, index) in recentActivities" :key="index">
                    <div class="activity-icon" :class="item.type">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    </div>
                    <div class="activity-content">
                        <div class="activity-text">{{ item.text }}</div>
                        <div class="activity-time">{{ item.time }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const stats = ref({
    totalUsers: 0,
    totalResources: 0,
    userGroups: 0,
    resourceGroups: 0
})

const recentActivities = ref([
    { type: 'info', text: '系统初始化完成', time: '2024-01-01 10:00:00' }
])
</script>

<style scoped>
.dashboard {
    max-width: 1400px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    margin-bottom: 32px;
}

.stat-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon {
    width: 56px;
    height: 56px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
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

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #303133;
}

.stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 4px;
}

.section-title {
    font-size: 18px;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16px;
}

.quick-actions {
    margin-bottom: 32px;
}

.actions-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

.action-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
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
    width: 48px;
    height: 48px;
    background: #f5f7fa;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #409eff;
}

.action-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.action-desc {
    font-size: 13px;
    color: #909399;
    margin-top: 4px;
}

.recent-activity {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.activity-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    border-radius: 8px;
    transition: background 0.3s ease;
}

.activity-item:hover {
    background: #f5f7fa;
}

.activity-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.activity-icon.info {
    background: #e6f7ff;
    color: #1890ff;
}

.activity-icon.success {
    background: #f6ffed;
    color: #52c41a;
}

.activity-icon.warning {
    background: #fffbe6;
    color: #faad14;
}

.activity-text {
    font-size: 14px;
    color: #303133;
}

.activity-time {
    font-size: 12px;
    color: #909399;
    margin-top: 4px;
}

@media (max-width: 1200px) {
    .stats-grid,
    .actions-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 768px) {
    .stats-grid,
    .actions-grid {
        grid-template-columns: 1fr;
    }
}
</style>
