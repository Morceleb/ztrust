import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
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
  }
})
