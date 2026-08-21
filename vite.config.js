import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      // 本地后端（GitHub 数据层 + DeepSeek 大脑）
      '/api': 'http://localhost:8787',
    },
  },
  preview: {
    port: 4173,
    host: true,
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
})
