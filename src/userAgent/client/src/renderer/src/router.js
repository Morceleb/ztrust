import { createRouter, createWebHistory } from 'vue-router'
import store from './store'
import request from '@/utils/request'

import Home from './views/Home.vue'
import Layout from './views/Layout.vue'
import Settings from './views/Settings.vue'
import DownloadClientNew from './views/DownloadClientNew.vue'
import PersonalInfo from './views/PersonalInfo.vue'
import TerminalManagerment from './views/TerminalManagerment.vue'
import ApplyPermission from './views/ApplyPermission.vue'
import Login from './views/Login/index.vue'

const routes = [
    {
        path: '/',
        component: Layout,
        meta: { requiresAuth: true }, // 默认父栏目下所有页面需要验证
        children: [
            // 默认跳转到首页
            { path: '', redirect: '/index' },
            {
                path: 'index',
                component: Home
            },
            {
                path: 'login', // 访问路径为 /login
                component: Login,
                // 【关键】显式覆盖父级的 requiresAuth，允许未登录访问
                meta: { requiresAuth: false }
            },
            { path: 'settings', component: Settings, meta: { requiresAuth: false } },
            { path: 'personal_info', component: PersonalInfo },
            { path: 'terminal_management', component: TerminalManagerment },
            { path: 'apply_permission', component: ApplyPermission },
        ]
    },
    {
        path: '/down_client_new',
        component: DownloadClientNew,
        meta: { requiresAuth: false }
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    const isAuthenticated = store.getters['auth/isAuthenticated']

    // 1. 如果去登录页，但已经登录了，直接去首页
    if (to.path === '/login' && isAuthenticated) {
        next('/index')
        return
    }

    // 2. 检查路由是否需要验证
    // matched.some 会检查当前路由及其所有父路由，
    // 但因为我们在子路由 login 上显式写了 requiresAuth: false，
    // 这里需要精细化判断：如果当前子路由明确说不需要，就放行。
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
    const isLoginPath = to.meta.requiresAuth === false

    if (isLoginPath || !requiresAuth) {
        next()
        return
    }

    // 3. 需要登录的页面处理
    if (isAuthenticated) {
        next()
    } else {
        // 未登录状态，尝试静默鉴权（零信任评估）
        try {
            const res = await request.get('/api/auth/test')
            if (res.data.success) {
                store.dispatch('auth/loginSuccess', res.data.user)
                next()
            } else {
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
            }
        } catch (err) {
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
        }
    }
})

export default router