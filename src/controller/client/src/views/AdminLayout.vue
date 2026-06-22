<template>
    <div class="admin-layout">
        <aside class="admin-sidebar">
            <div class="admin-logo">
                <div class="logo-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                </div>
                <span class="logo-text">控制系统</span>
            </div>

            <nav class="admin-nav">
                <ul>
                    <li
                        v-for="item in menuItems"
                        :key="item.path"
                        class="nav-item"
                        :class="{ active: activeMenu === item.path }"
                        @click="handleMenuClick(item.path)"
                    >
                        <component :is="item.icon" class="nav-icon" />
                        <span class="nav-text">{{ item.label }}</span>
                    </li>
                </ul>
            </nav>

            <!-- 当前登录用户信息（悬停显示下拉菜单） -->
            <div
                class="admin-user-wrapper"
                @mouseenter="showUserMenu = true"
                @mouseleave="showUserMenu = false"
            >
                <div class="admin-user">
                    <div class="user-avatar"><span>A</span></div>
                    <div class="user-info">
                        <span class="user-name">{{ currentUserName }}</span>
                        <span class="user-role">系统管理员</span>
                    </div>
                </div>
                <Transition name="user-menu">
                    <div v-show="showUserMenu" class="user-menu-dropdown">
                        <div class="user-menu-item" @click="handleLogout">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                            <span>注销登录</span>
                        </div>
                    </div>
                </Transition>
            </div>
        </aside>

        <main class="admin-main">
            <header class="admin-header">
                <div class="header-left">
                    <h1 class="page-title">{{ pageTitle }}</h1>
                </div>
                <div class="header-right"></div>
            </header>

            <div class="admin-content">
                <router-view />
            </div>
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                                stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="12" y1="8" x2="12" y2="12"/>
                                <line x1="12" y1="16" x2="12.01" y2="16"/>
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
import { computed, h, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiClient } from '@/api/axios.js'
import { clearAdminSession, getStoredAdminNickname, getStoredAdminUsername } from '@/utils/authStorage.js'

const router = useRouter()
const route = useRoute()

// 用户菜单状态
const showUserMenu = ref(false)
// 注销确认弹窗状态
const showLogoutModal = ref(false)

const currentUserName = computed(() => getStoredAdminNickname() || getStoredAdminUsername() || '管理员')

const DashboardIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('rect', { x: 3, y: 3, width: 7, height: 7 }),
        h('rect', { x: 14, y: 3, width: 7, height: 7 }),
        h('rect', { x: 14, y: 14, width: 7, height: 7 }),
        h('rect', { x: 3, y: 14, width: 7, height: 7 })
    ])
}

const UserIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
        h('circle', { cx: 9, cy: 7, r: 4 }),
        h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
        h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ])
}

const ResourceIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' })
    ])
}

const UserGroupIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
        h('circle', { cx: 9, cy: 7, r: 4 }),
        h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
        h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
    ])
}

const ResourceGroupIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('path', { d: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' }),
        h('line', { x1: 12, y1: 11, x2: 12, y2: 17 }),
        h('line', { x1: 9, y1: 14, x2: 15, y2: 14 })
    ])
}

const PermissionIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('rect', { x: 3, y: 11, width: 18, height: 11, rx: 2, ry: 2 }),
        h('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
    ])
}

const LoginPageIcon = {
    render: () => h('svg', { xmlns: 'http://www.w3.org/2000/svg', width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }, [
        h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 2 }),
        h('path', { d: 'M3 9h18' }),
        h('path', { d: 'M9 21V9' })
    ])
}

const menuItems = [
    { path: '/dashboard', label: '仪表盘', icon: DashboardIcon },
    { path: '/users', label: '人员管理', icon: UserIcon },
    { path: '/resources', label: '资源管理', icon: ResourceIcon },
    { path: '/user-groups', label: '用户组管理', icon: UserGroupIcon },
    { path: '/resource-groups', label: '资源组管理', icon: ResourceGroupIcon },
    { path: '/permissions', label: '权限审批', icon: PermissionIcon },
    { path: '/login-page-setting', label: '登录设置页面', icon: LoginPageIcon }
]

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => {
    const current = menuItems.find(item => item.path === route.path)
    return current ? current.label : '控制台'
})

const handleMenuClick = (path) => {
    router.push(path)
}

// 注销登录处理
const handleLogout = () => {
    showUserMenu.value = false
    showLogoutModal.value = true
}

// 确认注销登录
const confirmLogout = async () => {
    showLogoutModal.value = false
    try {
        await apiClient.post('/policy/auth/logout')
    } catch (e) {
        // 即使接口失败也清理本地状态
    }
    clearAdminSession()
    router.replace('/login')
}
</script>

<style scoped>
.admin-layout {
    display: flex;
    height: 100vh;
    background-color: #f5f7fa;
}

.admin-sidebar {
    width: 180px;
    background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
}

.admin-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 14px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-icon {
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
}

.logo-text {
    font-size: 16px;
    font-weight: 600;
    color: white;
}

.admin-nav {
    flex: 1;
    padding: 16px 0;
    overflow-y: auto;
}

.admin-nav ul {
    list-style: none;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
}

.nav-item:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.nav-item.active {
    background: linear-gradient(90deg, rgba(102, 126, 234, 0.3) 0%, transparent 100%);
    color: white;
}

.nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
}

.nav-icon {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
}

.nav-text {
    font-size: 14px;
}

/* 用户菜单区域 */
.admin-user-wrapper {
    position: relative;
    padding: 14px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    cursor: pointer;
}

.admin-user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.user-avatar {
    width: 34px;
    height: 34px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
}

.user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    color: white;
    font-size: 14px;
    font-weight: 500;
}

.user-role {
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
}

/* 用户下拉菜单 */
.user-menu-dropdown {
    position: absolute;
    bottom: 100%;
    left: 14px;
    right: 14px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    margin-bottom: 8px;
}

.user-menu-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    color: #606266;
    font-size: 14px;
    transition: all 0.2s ease;
}

.user-menu-item:hover {
    background: #f5f7fa;
    color: #409eff;
}

.user-menu-item svg {
    flex-shrink: 0;
}

/* 下拉菜单动画 */
.user-menu-enter-active,
.user-menu-leave-active {
    transition: all 0.2s ease;
}

.user-menu-enter-from,
.user-menu-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.admin-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.admin-header {
    height: 64px;
    background: white;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
    flex-shrink: 0;
}

.page-title {
    font-size: 20px;
    font-weight: 600;
    color: #303133;
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.admin-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
}

/* 注销登录确认弹窗 */
.logout-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.logout-modal {
    background: white;
    border-radius: 12px;
    width: 360px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.logout-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
}

.logout-modal-title {
    font-size: 16px;
    font-weight: 600;
    color: #303133;
}

.logout-modal-close {
    background: none;
    border: none;
    font-size: 18px;
    color: #909399;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.logout-modal-close:hover {
    color: #606266;
}

.logout-modal-body {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 24px 20px;
    gap: 12px;
}

.logout-modal-icon {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, #e6a23c 0%, #f56c6c 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.logout-modal-text {
    font-size: 15px;
    color: #606266;
}

.logout-modal-footer {
    display: flex;
    gap: 12px;
    padding: 0 20px 20px;
}

.logout-btn-confirm,
.logout-btn-cancel {
    flex: 1;
    padding: 10px 0;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
}

.logout-btn-confirm {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.logout-btn-confirm:hover {
    opacity: 0.9;
}

.logout-btn-cancel {
    background: #f5f7fa;
    color: #606266;
    border: 1px solid #dcdfe6;
}

.logout-btn-cancel:hover {
    background: #e9e9e9;
}

/* 弹窗动画 */
.modal-fade-enter-active,
.modal-fade-leave-active {
    transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
    opacity: 0;
}

.modal-fade-enter-from .logout-modal,
.modal-fade-leave-to .logout-modal {
    transform: scale(0.9);
}
</style>
