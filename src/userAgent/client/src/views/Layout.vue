<template>
    <div class="layout-container" :class="{ 'workbench-collapsed': !isExpanded }">
        <aside class="sidebar">
            <div class="logo">
                <div class="logo-icon-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span class="logo-text">XXX公司</span>
            </div>

            <nav class="nav-menu">
                <ul>
                    <li class="nav-item active">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span>工作台</span>
                    </li>
                </ul>
            </nav>

            <div class="user-profile">
                <div class="avatar-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="avatar-icon">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </div>
                <div class="user-info">
                    <div class="username">Admin</div>
                    <div class="role">管理员</div>
                </div>
            </div>
        </aside>

        <aside class="workbench" :class="{ collapsed: !isExpanded }">
            <button @click="toggleWorkbench" class="toggle-btn" title="切换侧边栏">
                <svg 
                    class="arrow-icon" 
                    :class="{ 'icon-rotated': !isExpanded }"
                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
                    stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 18l-6-6 6-6"/>
                </svg>
            </button>

            <div class="workbench-content">
                <div class="content-header">资源列表</div>
                <div class="resource-item" v-for="resource in resources" :key="resource.type">
                    <span class="dot"></span>
                    <span class="resource-text">{{ resource.name }}</span>
                </div>
            </div>
        </aside>

        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const isExpanded = ref(true)

const resources = ref([
    { type: 'web_page', name: '网页应用' },
    { type: 'api', name: 'API 接口管理' },
    { type: 'static', name: '静态资源库' },
    { type: 'log', name: '系统日志' }
])

const toggleWorkbench = () => {
    isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
/* 基础重置与布局 */
.layout-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacOSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #334155;
}


.sidebar {
    width: 64px; 
    width: 140px; 
    background: #0f172a; /* 更深邃的蓝 */
    color: #94a3b8;
    display: flex;
    flex-direction: column;
    z-index: 20; /* 确保层级高于 workbench */
    box-shadow: 4px 0 10px rgba(0,0,0,0.1);
}

.layout-container.workbench-collapsed .sidebar {
    
    box-shadow: 2px 0 8px rgba(0,0,0,0.2); 
}

.logo {
    height: 60px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 10px;
    background: #020617;
}

.logo-icon-bg {
    color: #38bdf8;
    display: flex;
    align-items: center;
}

.logo-text {
    font-size: 16px;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: 0.5px;
}

.nav-menu {
    flex: 1;
    padding-top: 20px;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 15px;
}

.nav-item:hover {
    background: rgba(255,255,255,0.05);
    color: #f1f5f9;
}

.nav-item.active {
    background: #3b82f6;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
}

.user-profile {
    padding: 16px;
    background: #020617;
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar-wrapper {
    width: 32px;
    height: 32px;
    background: #1e293b;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #e2e8f0;
    border: 1px solid #334155;
}

.user-info {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.username {
    font-size: 14px;
    font-weight: 600;
    color: #f1f5f9;
}

.role {
    font-size: 10px;
}


.workbench {
    width: 160px; /* 稍微加宽一点，更透气 */
    background: #ffffff;
    border-right: none;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); /* 使用贝塞尔曲线使动画更高级 */
    position: relative;
    z-index: 10;
}

.workbench.collapsed {
    width: 0;
    border-right: none;
}

.workbench.collapsed .workbench-content {
    opacity: 0;
    pointer-events: none;
}

/* --- 切换按钮美化 --- */
.toggle-btn {
    position: absolute;
    left: 100%; /* 紧贴右侧 */
    top: 50%; /* 垂直居中 */
    transform: translateY(-50%) translateX(-50%); /* 初始状态：压在边线上 */
    
    /* 尺寸与形状 */
    width: 24px;
    height: 24px;
    border-radius: 50%;
    
    /* 颜色与边框 */
    background: #ffffff;
    border: 1px solid #e2e8f0;
    
    /* 阴影让其浮起来 */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    
    /* 交互设置 */
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    z-index: 50;
    transition: all 0.3s ease;
    
    /* 移除默认按钮样式 */
    padding: 0;
    outline: none;
}

/* 按钮悬浮态 */
.toggle-btn:hover {
    background: #f8fafc;
    color: #3b82f6; /* 悬浮变为品牌色 */
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    transform: translateY(-50%) translateX(-50%) scale(1.1);
}

/* 图标旋转动画 */
.arrow-icon {
    transition: transform 0.3s ease;
}

/* 当折叠时，图标旋转180度 (变成向右箭头) */
.icon-rotated {
    transform: rotate(180deg);
}


.workbench.collapsed .toggle-btn {
    
    box-shadow: 2px 0 6px rgba(0,0,0,0.1);
}

/* --- 内容区域 --- */
.workbench-content {
    flex: 1;
    padding: 16px 8px;
    transition: opacity 0.2s; /* 内容淡入淡出 */
    opacity: 1;
    width: 160px; /* 强制宽度，防止折叠时文字换行导致的跳动 */
}

.content-header {
    font-size: 13px;
    text-transform: uppercase;
    color: #94a3b8;
    font-weight: 700;
    padding: 0 12px 12px;
    letter-spacing: 0.5px;
}

.resource-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    margin-bottom: 4px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    color: #475569;
}

.resource-item:hover {
    background: #f1f5f9;
    color: #0f172a;
}

.dot {
    width: 6px;
    height: 6px;
    background: #cbd5e1;
    border-radius: 50%;
}

.resource-item:hover .dot {
    background: #3b82f6; /* 悬浮时点变蓝 */
}

.resource-text {
    font-size: 15px;
    font-weight: 500;
}


.main-content {
    flex: 1;
    background: #f1f5f9; 
    position: relative;
    overflow: visible;
    padding-left: 16px; /* 参考图二，几乎紧贴但有一点点空隙 */
    padding-right: 0;
}
</style>