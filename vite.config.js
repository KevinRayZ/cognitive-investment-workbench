import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 纯静态站点（无后端）。base 用相对路径，便于 CloudStudio 子路径部署。
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
})
