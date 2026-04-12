import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // 三角洲H5 base 路径
  base: '/sjz/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 构建输出到 backend/public/sjz
    outDir: '../backend/public/sjz',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
