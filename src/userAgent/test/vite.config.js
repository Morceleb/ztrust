import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';
import fs from 'fs';

// 检查是否是 Tauri 环境
const isTauri = process.env.TAURI_ENV === 'true' || process.argv.includes('tauri');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
  ],

  // Vite 选项
  clearScreen: false,

  // 开发服务器配置
  server: {
    port: 5173,
    strictPort: true,
    host: '0.0.0.0',
    // 只有在非 Tauri 环境下才启用 HTTPS
    // Tauri 会自动处理前端资源的加载
    ...(isTauri ? {} : {
      https: fs.existsSync('./localhost+2-key.pem') && fs.existsSync('./localhost+2.pem') ? {
        key: fs.readFileSync('./localhost+2-key.pem'),
        cert: fs.readFileSync('./localhost+2.pem'),
      } : false,
    }),
    watch: {
      // 忽略文件变更
      ignored: ['**/src-tauri/**'],
    },
  },

  // 构建选项
  build: {
    // Tauri 使用 Chromium，需要 ES2020 以上的目标
    target: 'es2020',
  },

  // 路径别名
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src'),
      '@renderer': resolve(__dirname, 'src/renderer/src'),
    },
  },

  // 确保外部化 Tauri API 调用
  envPrefix: ['VITE_', 'TAURI_'],

  // 基础路径配置
  base: './',
});
