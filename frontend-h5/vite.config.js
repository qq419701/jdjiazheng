import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // base 设为 /jz，支持新版卡密链接格式：域名/jz/{卡密}
  // 旧的 域名/{卡密} 格式由 backend 通配兜底路由继续返回 h5 index.html，
  // 但 JS/CSS 资源路径会带 /jz 前缀，旧格式链接下资源加载依赖 nginx/backend 对 /jz 的静态托管
  base: '/jz',
  server: {
    port: 3000,
    // 开发环境代理到后端
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../backend/public/h5',  // 直接构建到后端静态目录
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
