import { createRouter, createWebHistory } from 'vue-router'
import store from './store'
import request from '@/utils/request'

const isTauriRuntime = typeof window !== 'undefined' && window.__TAURI__ !== undefined

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
    console.log('[Router] 路由导航:', {
        from: from.path,
        to: to.path,
        isTauri: isTauriRuntime
    });

    const isAuthenticated = store.getters['auth/isAuthenticated']
    console.log('[Router] 当前认证状态 isAuthenticated:', isAuthenticated, '| store.state.auth.isLoggedIn:', store.state.auth.isLoggedIn);

    // 1. 如果去登录页，但已经登录了，直接去首页
    if (to.path === '/login' && isAuthenticated) {
        console.log('[Router] 已登录访问登录页，重定向到 /index');
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
        const baseURL = localStorage.getItem('companyAddress') || import.meta.env.VITE_API_BASE_URL;

        if (!baseURL) {
            console.log('[Router] 未配置 API 服务器，跳转到登录页');
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
            return
        }

        if (isTauriRuntime) {
            console.log('[Router] Tauri 冷启动跳过静默鉴权，直接进入登录页');
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
            return
        }

        try {
            console.log('[Router] 尝试静默鉴权，baseURL:', baseURL);
            const res = await request.get('/auth/test')
            console.log('[Router] 静默鉴权响应:', JSON.stringify(res));

            const resData = res.data;
            console.log('[Router] 静默鉴权响应结构:', {
                hasData: 'data' in resData,
                keys: Object.keys(resData),
                hasSuccess: 'success' in resData,
                successValue: resData.success,
                hasUser: 'user' in resData,
            });

            // 判断登录成功：兼容两种响应结构
            // 结构1: { success: true, user: {} }  结构2: { code: 0/200, data: { user } }
            const isAuthSuccess =
                resData.success === true ||
                resData.code === 200 ||
                resData.code === 0 ||
                (resData.data && resData.data.user);

            console.log('[Router] 静默鉴权结果判断:', {
                resDataSuccess: resData.success,
                resDataCode: resData.code,
                hasDataUser: !!(resData.data?.user),
                isAuthSuccess,
            });

            if (isAuthSuccess) {
                const user = resData.user || resData.data?.user || resData.data;
                if (user) {
                    sessionStorage.setItem('user_info', JSON.stringify(user))
                }
                store.dispatch('auth/loginSuccess', user || resData)
                console.log('[Router] 静默鉴权成功，准备 next()');
                next()
            } else {
                console.log('[Router] 静默鉴权失败: 响应不满足成功条件');
                next({
                    path: '/login',
                    query: { redirect: to.fullPath }
                })
            }
        } catch (err) {
            console.error('[Router] 静默鉴权失败:', {
                message: err.message,
                status: err.response?.status,
                isTauri: isTauriRuntime
            });
            next({
                path: '/login',
                query: { redirect: to.fullPath }
            })
        }
    }
})

export default router