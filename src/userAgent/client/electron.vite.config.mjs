import { defineConfig } from 'electron-vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

const keyPath = path.join(__dirname, 'localhost+2-key.pem')
const certPath = path.join(__dirname, 'localhost+2.pem')

export default defineConfig({
  main: {
    // 主进程配置（暂时保持为空）
  },

  preload: {
    // preload 配置（暂时保持为空）
  },

  renderer: {
    plugins: [vue()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer/src')   // 对应你新的目录结构
      }
    },

    // 这里放入原来 vite.config.js 中的 server、build 等配置
    vite: {
      server: {
        port: 5173,
        strictPort: true,
        host: '127.0.0.1',
        https: {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      },

      // 如果你以后有 build 相关配置，也可以加在这里
      build: {
        // base: './',        // 打包时建议加上
      }
    }
  }
})