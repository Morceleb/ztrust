import { createRouter, createWebHistory } from 'vue-router'
import { clearAdminSession, isAdminLoggedIn } from '@/utils/authStorage.js'
import GatewayLayout from './views/GatewayLayout.vue'
import Overview from './views/Overview.vue'
import ResourceManagement from './views/ResourceManagement.vue'
import LogManagement from './views/LogManagement.vue'
import LoginPage from './views/LoginPage.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { guestOnly: true }
  },
  {
    path: '/',
    component: GatewayLayout,
    redirect: '/overview',
    meta: { requiresAuth: true },
    children: [
      { path: 'overview', name: 'Overview', component: Overview, meta: { title: '概览' } },
      { path: 'resources', name: 'Resources', component: ResourceManagement, meta: { title: '资源管理' } },
      { path: 'logs', name: 'Logs', component: LogManagement, meta: { title: '日志管理' } }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

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

router.beforeEach(async (to) => {
  if (to.meta.guestOnly) {
    if (isAdminLoggedIn()) {
      return to.query.redirect ? String(to.query.redirect) : '/overview'
    }
    return true
  }

  if (to.meta.requiresAuth) {
    if (!isAdminLoggedIn()) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    const isValid = await checkAuthStatus()
    if (!isValid) {
      clearAdminSession()
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    return true
  }

  return true
})

export default router
