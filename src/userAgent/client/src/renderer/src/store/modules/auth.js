import request from '@/utils/request'
import activityMonitor from '@/utils/activityMonitor'
import { SecurityConfig } from '@/config/security'

const state = {
    isLoggedIn: false,
    user: null,
}

const getters = {
    isAuthenticated: state => state.isLoggedIn,
    user: state => state.user
}

const mutations = {
    SET_LOGGED_IN(state, value) {
        state.isLoggedIn = value
    },
    SET_USER(state, user) {
        state.user = user
    },
    LOGOUT(state) {
        state.isLoggedIn = false
        state.user = null
    }
}

const actions = {
    // 登录成功后调用
    loginSuccess({ commit }, user) {
        commit('SET_LOGGED_IN', true)
        commit('SET_USER', user)

        // 初始化并启动行为监控
        if (SecurityConfig.activityMonitor.enabled) {
            activityMonitor.init({
                id: user.id,
                name: user.name || user.displayName
            })
            activityMonitor.start()
            // 设置登录状态，开始失活计时
            activityMonitor.setLoginState(true, {
                id: user.id,
                name: user.name || user.displayName
            })
        }
    },

    // 登出
    logout({ commit }) {
        // 先更新 Vuex 状态
        commit('LOGOUT')
        // 停止行为监控
        activityMonitor.stop()
        activityMonitor.performLogout('manual')
        // 重置登录状态，停止失活计时
        activityMonitor.setLoginState(false)
    },

    // 超时自动注销
    timeoutLogout({ commit }) {
        commit('LOGOUT')
        activityMonitor.stop()
        activityMonitor.setLoginState(false)
    },

    async checkAuth({ commit, dispatch }) {
        try {
            const response = await request.get('/auth/test')
            commit('SET_LOGGED_IN', true)
            commit('SET_USER', response.data.user || response.data)

            // 登录成功后初始化监控
            if (SecurityConfig.activityMonitor.enabled) {
                const user = response.data.user || response.data
                activityMonitor.init({
                    id: user.id,
                    name: user.name || user.displayName
                })
                activityMonitor.start()
                // 设置登录状态，开始失活计时
                activityMonitor.setLoginState(true, {
                    id: user.id,
                    name: user.name || user.displayName
                })
            }
        } catch (err) {
            // 401/403 或其他错误 → 未登录
            // 只有当前是登录状态才需要登出操作
            if (state.isLoggedIn) {
                activityMonitor.stop()
                activityMonitor.performLogout('manual')
                activityMonitor.setLoginState(false)
            }

            // commit('LOGOUT')

            throw err
        }
    }
}

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions
}
