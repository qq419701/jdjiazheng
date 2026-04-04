import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  base: '/xi/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:5500',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../backend/public/xi',
    emptyOutDir: true,
    assetsDir: 'assets',
  },
})
