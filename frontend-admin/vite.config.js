import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/admin/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/admin/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../backend/public/admin',  // 直接构建到后端静态目录
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
