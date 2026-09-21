/* Cấu hình CHỈ để xem trước giao diện bằng dữ liệu giả.
   Chạy: npx vite --config .preview/vite.config.js
   Không ảnh hưởng tới bản build sản phẩm (npm run build dùng vite.config.js). */

import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const goc = new URL('../', import.meta.url)

export default defineConfig({
  root: fileURLToPath(goc),
  plugins: [vue()],
  resolve: {
    alias: [
      { find: '@/lib/supabase', replacement: fileURLToPath(new URL('./mock-supabase.js', import.meta.url)) },
      { find: '@/stores/congNoStore', replacement: fileURLToPath(new URL('./mock-stores.js', import.meta.url)) },
      { find: '@/stores/authStore', replacement: fileURLToPath(new URL('./mock-auth.js', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', goc)) },
    ],
  },
})
