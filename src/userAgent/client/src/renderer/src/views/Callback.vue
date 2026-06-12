<template>
    <div>
        <h2>Callback</h2>
        <div v-if="error">{{ error }}</div>
        <div v-else-if="user">Hello, {{ user.displayName || user.name }}</div>
        <div v-else>Loading...</div>
    </div>
</template>

<script>
export default {
    data() {
        return { user: null, error: null }
    },
    async created() {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')

        // 验证 state
        const savedState = localStorage.getItem('casdoor_oauth_state')
        if (!savedState || savedState !== state) {
            this.error = 'Invalid state'
            return
        }
        localStorage.removeItem('casdoor_oauth_state')

        if (!code) {
            this.error = 'No code in callback'
            return
        }

        try {
            // 推荐：将 code 发送到后端，由后端使用 client_secret 与 Casdoor 交换 token
            // 这里给出最小示例：调用 /api/auth/casdoor/callback (后端需实现)
            const resp = await fetch('http://localhost:3000/api/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirectUri: window.location.origin + import.meta.env.VITE_REDIRECT_PATH })
            })
            if (!resp.ok) throw new Error('Token exchange failed')
            const data = await resp.json()
            // data 应包含 user info（后端用 access_token 去 Casdoor 获取）
            this.user = data.user
        } catch (e) {
            this.error = e.message
        }
    }
}
</script>
