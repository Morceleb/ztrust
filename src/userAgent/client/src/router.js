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
        path: '/login',
        component: Login,
        meta: { requiresAuth: false }
    },
    {
        path: '/', component: Layout,
        meta: { requiresAuth: true },
        children: [
            { path: '', redirect: '/index' },
            { path: '/index', component: Home },
            { path: '/settings', component: Settings },
            { path: '/personal_info', component: PersonalInfo },
            { path: '/terminal_management', component: TerminalManagerment },
            { path: '/apply_permission', component: ApplyPermission },
        ]
    },
    {
        path: '/down_client_new',
        component: DownloadClientNew,
    },
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach(async (to, from, next) => {
    // 如果是去登录页，且已经登录 → 跳首页
    if (to.path === '/login' && store.getters['auth/isAuthenticated']) {
        next('/index')
        return
    }

    // 不需要登录的页面直接放行
    if (!to.meta.requiresAuth) {
        next()
        return
    }

    // 需要登录的页面
    const isAuth = store.getters['auth/isAuthenticated']

    if (isAuth) {
        next()
    } else {
        // 未登录 → 跳转登录，并带上原本想去的页面（登录后可回跳）
        try {
            const res = await request.get('/api/auth/test')
            if (res.data.success) {
                store.dispatch('auth/loginSuccess', res.data.user) // 这里可以根据实际情况设置用户信息
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

