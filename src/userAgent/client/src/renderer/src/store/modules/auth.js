const state = {
    isLoggedIn: false,
    user: null,         // 可选：存用户信息
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
    },

    // 登出
    logout({ commit }) {
        commit('LOGOUT')
        // 可选：调用后端 logout 接口清除 httpOnly cookie
        // await api.post('/logout')
    },

    async checkAuth({ commit }) {
        try {
            // 调用后端接口验证（推荐使用 refresh token 自动刷新 access token 的方式）
            const response = await api.get('/api/me')   // 或 /api/user 或 /api/check-auth
            commit('SET_LOGGED_IN', true)
            commit('SET_USER', response.data.user || response.data)
        } catch (err) {
            // 401/403 或其他错误 → 未登录
            commit('LOGOUT')
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