import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import CasdoorSdk from 'casdoor-vue-sdk'

const app = createApp(App)

const casdoorConfig = {
  serverUrl: import.meta.env.VITE_CASDOOR_SERVER_URL,
  clientId: import.meta.env.VITE_CASDOOR_CLIENT_ID,
  appName: import.meta.env.VITE_CASDOOR_APP_NAME,
  organizationName: import.meta.env.VITE_CASDOOR_ORG_NAME,
  redirectPath: import.meta.env.VITE_CASDOOR_REDIRECT_PATH || '/callback'
}

app.use(CasdoorSdk, casdoorConfig)
app.use(router)
app.mount('#app')
