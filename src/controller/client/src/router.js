import { createRouter, createWebHistory } from 'vue-router'
import { clearAdminSession, isAdminLoggedIn } from '@/utils/authStorage.js'
import AdminLayout from './views/AdminLayout.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import UserManagement from './views/UserManagement.vue'
import ResourceManagement from './views/ResourceManagement.vue'
import UserGroup from './views/UserGroup.vue'
import ResourceGroup from './views/ResourceGroup.vue'
import Callback from './views/Callback.vue'
import PermissionApproval from './views/PermissionApproval.vue'
import LoginSettingsPage from './views/LoginPageSetting.vue'
import LoginPage from './views/LoginPage.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/callback',
    name: 'Callback',
    component: Callback,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: UserManagement },
      { path: 'resources', component: ResourceManagement },
      { path: 'user-groups', component: UserGroup },
      { path: 'resource-groups', component: ResourceGroup },
      { path: 'permissions', component: PermissionApproval },
      { path: 'login-page-setting', component: LoginSettingsPage }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 验证登录状态（通过 /check 接口检查 HttpOnly Cookie 是否有效）
async function checkAuthStatus() {
  try {
    const res = await fetch('/api/policy/auth/check', {
      credentials: 'include'
    })
    return res.status === 200
  } catch {
    return false
  }
}

// 路由守卫
router.beforeEach(async (to) => {
  if (to.meta.guestOnly) {
    // 访客专属页面（登录页）：已登录则跳转首页
    if (isAdminLoggedIn()) {
      return to.query.redirect ? String(to.query.redirect) : '/dashboard'
    }
    return true
  }

  if (to.meta.requiresAuth) {
    // 需要认证的页面：先检查本地标记，再通过 /check 验证 Cookie 有效性
    if (!isAdminLoggedIn()) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    const isValid = await checkAuthStatus()
    if (!isValid) {
      // Cookie 无效/过期，清除本地状态并跳转登录
      clearAdminSession()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    return true
  }

  return true
})

export default router
