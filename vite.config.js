import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // Relative base so the build works from any GitHub Pages sub-path
  // without hard-coding the repository name.
  base: './',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    // ExcelJS (~930 kB) cố ý nằm trong một chunk riêng và chỉ được nạp khi
    // người dùng bấm "Xuất Excel", nên cảnh báo mặc định 500 kB không phản
    // ánh đúng tải trọng ban đầu.
    chunkSizeWarningLimit: 1000,
  },
})
