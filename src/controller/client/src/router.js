import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from './views/AdminLayout.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import UserManagement from './views/UserManagement.vue'
import ResourceManagement from './views/ResourceManagement.vue'
import UserGroup from './views/UserGroup.vue'
import ResourceGroup from './views/ResourceGroup.vue'
import Callback from './views/Callback.vue'
import PermissionApproval from './views/PermissionApproval.vue'
import LoginPageSetting from './views/LoginPageSetting.vue'

const routes = [
  {
    path: '/callback',
    name: 'Callback',
    component: Callback
  },
  {
    path: '/',
    component: AdminLayout,
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: AdminDashboard },
      { path: 'users', component: UserManagement },
      { path: 'resources', component: ResourceManagement },
      { path: 'user-groups', component: UserGroup },
      { path: 'resource-groups', component: ResourceGroup },
      { path: 'permissions', component: PermissionApproval },
      { path: 'login-page-setting', component: LoginPageSetting }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
