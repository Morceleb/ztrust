import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  // Load environment variables with fallback defaults
  const env = loadEnv(mode, process.cwd(), '')
  
  // Default values for Casdoor configuration
  const casdoorDefaults = {
    VITE_CASDOOR_SERVER_URL: 'http://localhost:8080',
    VITE_CASDOOR_CLIENT_ID: '1234567890',
    VITE_CASDOOR_APP_NAME: 'app-built-in',
    VITE_CASDOOR_ORG_NAME: 'Built-in',
    VITE_CASDOOR_REDIRECT_PATH: '/callback',
  }

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 5174,
      proxy: {
        '^/api': {
          target: 'http://47.120.25.166:9013',
          changeOrigin: true
        },
        '/identity': {
          target: 'http://47.120.25.166:8002',
          changeOrigin: true
        }
      }
    },
    define: {
      'import.meta.env.VITE_CASDOOR_SERVER_URL': JSON.stringify(env.VITE_CASDOOR_SERVER_URL || casdoorDefaults.VITE_CASDOOR_SERVER_URL),
      'import.meta.env.VITE_CASDOOR_CLIENT_ID': JSON.stringify(env.VITE_CASDOOR_CLIENT_ID || casdoorDefaults.VITE_CASDOOR_CLIENT_ID),
      'import.meta.env.VITE_CASDOOR_APP_NAME': JSON.stringify(env.VITE_CASDOOR_APP_NAME || casdoorDefaults.VITE_CASDOOR_APP_NAME),
      'import.meta.env.VITE_CASDOOR_ORG_NAME': JSON.stringify(env.VITE_CASDOOR_ORG_NAME || casdoorDefaults.VITE_CASDOOR_ORG_NAME),
      'import.meta.env.VITE_CASDOOR_REDIRECT_PATH': JSON.stringify(env.VITE_CASDOOR_REDIRECT_PATH || casdoorDefaults.VITE_CASDOOR_REDIRECT_PATH),
    }
  }
})
