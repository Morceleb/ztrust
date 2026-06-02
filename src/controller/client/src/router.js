import { createRouter, createWebHistory } from 'vue-router'
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

router.beforeEach((to) => {
  const isLoggedIn = localStorage.getItem('admin_logged_in') === 'true'

  if (to.meta.requiresAuth && !isLoggedIn) {
    return {
      path: '/login',
      query: { redirect: to.fullPath }
    }
  }

  if (to.meta.guestOnly && isLoggedIn) {
    return to.query.redirect ? String(to.query.redirect) : '/dashboard'
  }

  return true
})

export default router
