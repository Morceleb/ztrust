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
                path: 'login',
                component: Login,
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
    // 检测环境
    const isTauri = typeof window !== 'undefined' && window.__TAURI__ !== undefined;
    console.log('[Router] 路由导航:', {
        from: from.path,
        to: to.path,
        isTauri: isTauri
    });

    const isAuthenticated = store.getters['auth/isAuthenticated']

    // 1. 如果去登录页，但已经登录了，直接去首页
    if (to.path === '/login' && isAuthenticated) {
        next('/index')
        return
    }

    // 2. 检查路由是否需要验证
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
        // 检查是否有 API 服务器配置
        const baseURL = localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL;

        if (!baseURL) {
            // 没有配置 API 服务器，跳转到登录页
            console.log('[Router] 未配置 API 服务器，跳转到登录页');
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
            return
        }

        try {
            console.log('[Router] 尝试静默鉴权，baseURL:', baseURL);
            const res = await request.get('/auth/test')
            console.log('[Router] 静默鉴权响应:', res);

            if (res.data.success) {
                // 静默鉴权成功，保存用户信息到 localStorage
                if (res.data.user) {
                    localStorage.setItem('user_info', JSON.stringify(res.data.user))
                }
                store.dispatch('auth/loginSuccess', res.data.user)
                next()
            } else {
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
            }
        } catch (err) {
            console.error('[Router] 静默鉴权失败:', {
                message: err.message,
                status: err.response?.status,
                isTauri: isTauri
            });
            // 静默鉴权失败，跳转到登录页
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
        }
    }
})

export default router