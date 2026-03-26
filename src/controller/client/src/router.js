import { createRouter, createWebHistory } from 'vue-router'
import AdminLayout from './views/AdminLayout.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import UserManagement from './views/UserManagement.vue'
import ResourceManagement from './views/ResourceManagement.vue'
import UserGroup from './views/UserGroup.vue'
import ResourceGroup from './views/ResourceGroup.vue'
import DataImport from './views/DataImport.vue'
import Login from './views/Login.vue'
import Callback from './views/Callback.vue'
import PermissionApproval from './views/PermissionApproval.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
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
      { path: 'import', component: DataImport }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
