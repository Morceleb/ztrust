<template>
    <div class="layout-container" :class="{
        'workbench-collapsed': !isExpanded || $route.path === '/settings' || $route.path === '/personal_info' || $route.path === '/terminal_management' || $route.path === '/apply_permission',
        'main-tight': $route.path === '/personal_info' || $route.path === '/terminal_management' || $route.path === '/apply_permission'
    }">
        <tittleBar class="new-tittle"></tittleBar>
        <aside class="sidebar">
            <div class="logo">
                <div class="logo-icon-bg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                </div>
                <span class="logo-text">XXX</span>
            </div>

            <nav class="nav-menu">
                <ul>
                    <li class="nav-item" :class="{ active: $route.path === '/' }">
                        <router-link to="/" class="nav-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <rect x="3" y="3" width="7" height="7" />
                                <rect x="14" y="3" width="7" height="7" />
                                <rect x="14" y="14" width="7" height="7" />
                                <rect x="3" y="14" width="7" height="7" />
                            </svg>
                            <span>工作台</span>
                        </router-link>
                    </li>
                    <li class="nav-item" :class="{ active: $route.path === '/settings' }">
                        <router-link to="/settings" class="nav-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path
                                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>设置</span>
                        </router-link>
                    </li>
                </ul>
            </nav>

            <!-- 下载客户端：仅图标居中，悬停显示「下载客户端」 -->
            <div class="sidebar-bottom">
                <div class="download-client-wrapper" @mouseenter="showDownloadTooltip = true"
                    @mouseleave="showDownloadTooltip = false">
                    <button type="button" class="download-client-btn" title="下载客户端" @click="handleDownloadClient">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none"
                            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                    </button>
                    <Transition name="download-tooltip">
                        <div v-show="showDownloadTooltip" class="download-client-tooltip">下载客户端</div>
                    </Transition>
                </div>
                <div class="sidebar-divider"></div>
            </div>

            <!-- 当前登录用户信息（悬停显示下拉菜单，后端接入后替换 currentUser 数据源即可） -->
            <div class="user-profile-wrapper" @mouseenter="showUserMenu = true" @mouseleave="showUserMenu = false">
                <div class="user-profile">
                    <div class="avatar-wrapper" :title="currentUser.name">
                        <span class="avatar-initial">{{ userInitial }}</span>
                    </div>
                </div>
                <Transition name="user-menu">
                    <div v-show="showUserMenu" class="user-menu-dropdown">
                        <div class="user-menu-header">
                            <div class="user-menu-avatar">
                                <span>{{ userInitial }}</span>
                            </div>
                            <div class="user-menu-name">{{ currentUser.name }}</div>
                        </div>
                        <div class="user-menu-divider"></div>
                        <div class="user-menu-item" @click="handlePersonalInfo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>个人信息</span>
                        </div>
                        <div class="user-menu-item" @click="handleApplyPermission">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3" />
                                <path
                                    d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            <span>申请权限</span>
                        </div>
                        <div class="user-menu-item" @click="handleTerminalManagement">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                <line x1="8" y1="21" x2="16" y2="21" />
                                <line x1="12" y1="17" x2="12" y2="21" />
                            </svg>
                            <span>终端管理</span>
                        </div>
                        <div class="user-menu-item" @click="handleLogout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                                fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                                stroke-linejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                            <span>注销登录</span>
                        </div>
                    </div>
                </Transition>
            </div>
        </aside>

        <aside
            v-if="$route.path !== '/settings' && $route.path !== '/personal_info' && $route.path !== '/terminal_management' && $route.path !== '/apply_permission' && $route.path !== '/login'"
            class="workbench" :class="{ collapsed: !isExpanded }">
            <button @click="toggleWorkbench" class="toggle-btn" title="切换侧边栏">
                <svg class="arrow-icon" :class="{ 'icon-rotated': !isExpanded }" xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                    stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                </svg>
            </button>

            <div class="workbench-content">
                <div class="content-header">资源列表</div>
                <div v-for="resource in resources" :key="resource.type ?? 'all'" class="resource-item"
                    :class="{ active: selectedCategory === resource.type }" @click="selectCategory(resource.type)">
                    <span class="dot"></span>
                    <span class="resource-text">{{ resource.name }}</span>
                </div>
            </div>
        </aside>

        <main class="main-content">
            <router-view />
        </main>
    </div>

    <!-- 注销登录确认弹窗 -->
    <teleport to="body">
        <Transition name="modal-fade">
            <div v-if="showLogoutModal" class="logout-modal-overlay" @click.self="showLogoutModal = false">
                <div class="logout-modal">
                    <div class="logout-modal-header">
                        <span class="logout-modal-title">注销登录</span>
                        <button type="button" class="logout-modal-close" @click="showLogoutModal = false">✕</button>
                    </div>
                    <div class="logout-modal-body">
                        <div class="logout-modal-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                                fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"
                                stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <span class="logout-modal-text">确定注销登录账号?</span>
                    </div>
                    <div class="logout-modal-footer">
                        <button type="button" class="logout-btn-confirm" @click="confirmLogout">确定</button>
                        <button type="button" class="logout-btn-cancel" @click="showLogoutModal = false">取消</button>
                    </div>
                </div>
            </div>
        </Transition>
    </teleport>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'
import store from '@/store'

import tittleBar from '@/components/TittleBar/index.vue'


const isExpanded = ref(true)
const showUserMenu = ref(false)
const showDownloadTooltip = ref(false)
const showLogoutModal = ref(false)
const router = useRouter()

// 当前登录用户（前端模拟：张三；后端登录接入后从此处或 store 读取）
const currentUser = ref({
    name: '张三',
    role: '用户'
})
const userInitial = computed(() => currentUser.value.name ? currentUser.value.name.charAt(0) : '?')

const handleLogout = () => {
    showLogoutModal.value = true
}

const confirmLogout = () => {
    showLogoutModal.value = false
    request.post('/auth/logout')
    localStorage.clear()
    store.dispatch('auth/logout')
    router.push('/login')
}

const handleDownloadClient = () => {
    showDownloadTooltip.value = false
    router.push('/down_client_new')
}

const handlePersonalInfo = () => {
    router.push('/personal_info')
}

const handleTerminalManagement = () => {
    router.push('/terminal_management')
}

const handleApplyPermission = () => {
    router.push('/apply_permission')
}
// 选中的资源类别，null 表示全部
const selectedCategory = ref(null)
provide('selectedCategory', selectedCategory)

const resources = ref([
    { type: null, name: '全部' },
    { type: 'web_page', name: '网页应用' },
    { type: 'api', name: 'API 接口管理' },
    { type: 'static', name: '静态资源库' },
    { type: 'log', name: '系统日志' }
])

const selectCategory = (type) => {
    selectedCategory.value = type
}

const toggleWorkbench = () => {
    isExpanded.value = !isExpanded.value
}
</script>

<style scoped>
/* 基础重置与布局 */

.new-tittle {
    position: absolute;
    width: 100%;
    right: 0;
    z-index: 1000;
}

.layout-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacOSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #334155;
}


.sidebar {
    background: #36435b;
    /* 参考图二：灰蓝侧边栏 */
    color: rgba(248, 250, 252, 0.92);
    display: flex;
    flex-direction: column;
    z-index: 20;
    /* 确保层级高于 workbench */
    box-shadow: 3px 0 10px rgba(0, 0, 0, 0.12);
}

.layout-container.workbench-collapsed .sidebar {

    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
}

.logo {
    height: 56px;
    display: flex;
    align-items: center;
    padding: 0 12px;
    gap: 8px;
    background: transparent;
}

.logo-icon-bg {
    color: #f8fafc;
    display: flex;
    align-items: center;
}

.logo-text {
    font-size: 14px;
    font-weight: 700;
    color: #f8fafc;
    letter-spacing: 0.2px;
}

.nav-menu {
    flex: 1;
    padding-top: 12px;
    width: 90px;
}

.nav-item {
    display: flex;
    align-items: center;
    transition: all 0.2s;
    font-size: 13px;
    font-weight: 500;
}

.nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 10px 10px;
    width: 100%;
    cursor: pointer;
    color: inherit;
    text-decoration: none;
}

.nav-item:hover .nav-link {
    background: rgba(255, 255, 255, 0.08);
    color: #f1f5f9;
}

.nav-item.active .nav-link {
    background: #3b82f6;
    color: white;
    box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.5);
}

/* 下载客户端：仅图标居中，悬停交互 + 显示「下载客户端」 */
.sidebar-bottom {
    background: transparent;
    padding: 10px 10px 0;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.download-client-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.download-client-btn {
    width: 28px;
    height: 28px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 6px;
    color: rgba(248, 250, 252, 0.85);
    cursor: pointer;
    transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}

.download-client-btn svg {
    width: 16px;
    height: 16px;
}

.download-client-btn:hover {
    background: rgba(255, 255, 255, 0.14);
    transform: scale(1.06);
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.18);
}

.download-client-tooltip {
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 10px;
    padding: 8px 14px;
    background: #e5e7eb;
    color: #374151;
    font-size: 13px;
    white-space: nowrap;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    z-index: 50;
    pointer-events: none;
}

.download-tooltip-enter-active,
.download-tooltip-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.download-tooltip-enter-from,
.download-tooltip-leave-to {
    opacity: 0;
    transform: translateY(-50%) translateX(-6px);
}

.sidebar-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.14);
    margin: 10px 0 0;
    width: 100%;
}

.user-profile-wrapper {
    position: relative;
}

.user-profile {
    padding: 10px 10px 14px;
    background: transparent;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
}

.avatar-wrapper {
    width: 28px;
    height: 28px;
    min-width: 28px;
    background: #60a5fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    line-height: 1;
}

.avatar-initial {
    line-height: 1;
}

.username {
    font-size: 14px;
    font-weight: 600;
    color: #f1f5f9;
    line-height: 1;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* 悬停下拉菜单 */
.user-menu-dropdown {
    position: absolute;
    left: 100%;
    bottom: 0;
    margin-left: 8px;
    width: max-content;
    max-width: 220px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    padding: 12px 0;
    z-index: 100;
}

.user-menu-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 20px 12px 16px;
}

.user-menu-avatar {
    width: 28px;
    height: 28px;
    min-width: 28px;
    background: #60a5fa;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-weight: 700;
    font-size: 13px;
    line-height: 1;
}

.user-menu-name {
    font-size: 16px;
    font-weight: 500;
    color: #111827;
    line-height: 1;
}

.user-menu-divider {
    height: 1px;
    background: #e2e8f0;
    margin: 8px 0;
}

.user-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 20px 10px 16px;
    font-size: 14px;
    color: #334155;
    cursor: pointer;
    transition: background 0.2s;
}

.user-menu-item:hover {
    background: #f1f5f9;
}

.user-menu-item svg {
    flex-shrink: 0;
    color: #64748b;
}

.user-menu-enter-active,
.user-menu-leave-active {
    transition: opacity 0.15s ease, transform 0.15s ease;
}

.user-menu-enter-from,
.user-menu-leave-to {
    opacity: 0;
    transform: translateX(-4px);
}


.workbench {
    width: 160px;
    /* 稍微加宽一点，更透气 */
    background: #ffffff;
    border-right: none;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* 使用贝塞尔曲线使动画更高级 */
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
    left: 100%;
    /* 紧贴右侧 */
    top: 50%;
    /* 垂直居中 */
    transform: translateY(-50%) translateX(-50%);
    /* 初始状态：压在边线上 */

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
    color: #3b82f6;
    /* 悬浮变为品牌色 */
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

    box-shadow: 2px 0 6px rgba(0, 0, 0, 0.1);
}

/* --- 内容区域 --- */
.workbench-content {
    flex: 1;
    padding: 16px 8px;
    transition: opacity 0.2s;
    /* 内容淡入淡出 */
    opacity: 1;
    width: 160px;
    /* 强制宽度，防止折叠时文字换行导致的跳动 */
}

/* 资源列表：与图三一致，标题中灰常规字重，列表项常规字重，选中项深蓝加粗 */
.content-header {
    font-size: 14px;
    color: #64748b;
    font-weight: 400;
    padding: 0 12px 12px;
    letter-spacing: 0;
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
    color: #334155;
    font-weight: 400;
}

.resource-item:hover {
    background: #f1f5f9;
    color: #0f172a;
}

.resource-item.active {
    background: #e0f2fe;
    color: #0369a1;
    font-weight: 600;
}

.resource-item.active .dot {
    background: #0ea5e9;
}

.dot {
    width: 6px;
    height: 6px;
    background: #cbd5e1;
    border-radius: 50%;
}

.resource-item:hover .dot {
    background: #3b82f6;
}

.resource-text {
    font-size: 14px;
    font-weight: inherit;
}


.main-content {
    flex: 1;
    background: #f1f5f9;
    position: relative;
    overflow: visible;
    padding: 0 16px 0 0;
    /* 左右留白一致，模仿图二 */
    border-top: none;
    /* 去除资源列表顶部线条 */
}

.layout-container.main-tight .main-content {
    padding-left: 0;
}

/* 注销确认弹窗 */
.logout-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.logout-modal {
    position: relative;
    background: #fff;
    border-radius: 8px;
    width: 380px;
    padding: 0;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
    overflow: hidden;
}

.logout-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 14px 20px;
    border-bottom: 1px solid #f0f0f0;
}

.logout-modal-title {
    font-size: 15px;
    font-weight: 600;
    color: #1e293b;
}

.logout-modal-close {
    background: none;
    border: none;
    font-size: 16px;
    color: #94a3b8;
    cursor: pointer;
    line-height: 1;
    padding: 2px 4px;
}

.logout-modal-close:hover {
    color: #475569;
}

.logout-modal-body {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 24px 28px 20px;
    margin-bottom: 0;
}

.logout-modal-icon {
    width: 36px;
    height: 36px;
    min-width: 36px;
    border-radius: 50%;
    background: #f59e0b;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logout-modal-text {
    font-size: 15px;
    color: #1e293b;
    font-weight: 500;
}

.logout-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 0 28px 20px;
}

.logout-btn-confirm {
    padding: 7px 24px;
    background: #3b82f6;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.logout-btn-confirm:hover {
    background: #2563eb;
}

.logout-btn-cancel {
    padding: 7px 24px;
    background: #fff;
    color: #374151;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    transition: background 0.2s;
}

.logout-btn-cancel:hover {
    background: #f1f5f9;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}
</style>