//router.js
import { createRouter, createWebHistory } from 'vue-router'

import store from './store'

import Layout from './views/Layout.vue'
import Home from './views/Home.vue'
import Settings from './views/Settings.vue'
import Login from './views/Login.vue'


const routes = [
    {
        path: '/login',
        name: 'Login',
        component: Login,
        meta: { requiresAuth: false } // 不需要登录
    },
    {
        path: '/',
        component: Layout, // 带布局的保护路由
        meta: { requiresAuth: true }, // 需要登录
        children: [
            {
                path: '',
                redirect: '/index'
            },
            {
                path: 'index',
                name: 'Home',
                component: Home
            },
            {
                path: 'settings',
                name: 'Settings',
                component: Settings
            }
        ]
    },
    // 可选：404 处理
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 全局前置守卫
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
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        })
    }
})

export default router