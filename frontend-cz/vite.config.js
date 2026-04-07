import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  // 充值H5 base 路径
  base: '/cz/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3003,
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 构建输出到 backend/public/cz
    outDir: '../backend/public/cz',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
