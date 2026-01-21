<!-- App.vue 或 Layout.vue -->
<template>
    <div class="layout-container">
        <!-- 左侧导航栏 -->
        <aside class="sidebar">
            <!-- 公司图标 / Logo -->
            <div class="logo">
                <img src="@/assets/vue.svg" alt="Company Logo" class="logo-img" />
                <span class="logo-text">xxx公司</span>
            </div>

            <!-- 导航菜单（可后续扩展） -->
            <nav class="nav-menu">
                <ul>
                    <li class="nav-item active">
                        <span>工作台</span>
                    </li>
                    <!-- <li class="nav-item">
                        <span>数据分析</span>
                    </li>
                    <li class="nav-item">
                        <span>用户管理</span>
                    </li>
                    <li class="nav-item">
                        <span>设置</span>
                    </li> -->
                </ul>
            </nav>

            <!-- 底部个人头像区域 -->
            <div class="user-profile">
                <div class="avatar-wrapper">
                    <img src="@/assets/vue.svg" alt="User Avatar" class="avatar" />
                </div>
                <div class="user-info">
                    <div class="username">张三</div>
                    <div class="role">管理员</div>
                </div>
            </div>
        </aside>

        <!-- 右侧主内容区域 -->
        <main class="main-content">
            <router-view />
        </main>
    </div>
</template>

<script setup>
// 可以在这里引入路由、状态管理等
</script>

<style scoped>
.layout-container {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: -apple-system, BlinkMacOSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* 左侧导航栏 */
.sidebar {
    width: 240px;
    background: #1e293b;
    /* 深色背景 */
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #334155;
}

/* Logo 区域 */
.logo {
    padding: 20px 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #334155;
}

.logo-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.logo-text {
    font-size: 1.25rem;
    font-weight: 600;
    white-space: nowrap;
}

/* 导航菜单 */
.nav-menu {
    flex: 1;
    padding: 16px 0;
}

.nav-item {
    padding: 14px 24px;
    cursor: pointer;
    transition: all 0.2s;
}

.nav-item:hover {
    background: #334155;
}

.nav-item.active {
    background: #3b82f6;
    color: white;
    font-weight: 500;
}

/* 个人资料区域 */
.user-profile {
    padding: 16px 20px;
    border-top: 1px solid #334155;
    display: flex;
    align-items: center;
    gap: 12px;
}

.avatar-wrapper {
    flex-shrink: 0;
}

.avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #60a5fa;
}

.user-info {
    flex: 1;
    min-width: 0;
}

.username {
    font-weight: 600;
    font-size: 1rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.role {
    font-size: 0.8125rem;
    color: #94a3b8;
}

/* 右侧主内容 */
.main-content {
    flex: 1;
    background: #f8fafc;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}

.content-placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
}

.content-placeholder h2 {
    margin-bottom: 1rem;
    color: #1e293b;
}
</style>