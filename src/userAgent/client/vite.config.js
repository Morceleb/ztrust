import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

const keyPath = path.join(__dirname, 'localhost+2-key.pem')
const certPath = path.join(__dirname, 'localhost+2.pem')


export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),  // @ 指向 src 目录
    }
  },
  server: {
    port: 5173,
    https: {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  }
})