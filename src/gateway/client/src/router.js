import { createRouter, createWebHistory } from 'vue-router'
import GatewayLayout from './views/GatewayLayout.vue'
import Overview from './views/Overview.vue'
import ResourceManagement from './views/ResourceManagement.vue'
import LogManagement from './views/LogManagement.vue'

const routes = [
  {
    path: '/',
    component: GatewayLayout,
    redirect: '/overview',
    children: [
      { path: 'overview', name: 'Overview', component: Overview, meta: { title: '概览' } },
      { path: 'resources', name: 'Resources', component: ResourceManagement, meta: { title: '资源管理' } },
      { path: 'logs', name: 'Logs', component: LogManagement, meta: { title: '日志管理' } }
    ]
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
