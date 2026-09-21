<script setup>
import { PhGear } from '@phosphor-icons/vue'
</script>

<template>
  <main class="nen">
    <div class="the">
      <PhGear :size="40" aria-hidden="true" class="icon" />
      <h1>Chưa cấu hình Supabase</h1>
      <p>
        Ứng dụng cần hai biến môi trường để kết nối tới cơ sở dữ liệu. Tạo file
        <code>.env.local</code> ở thư mục gốc của dự án với nội dung:
      </p>
      <pre><code>VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...</code></pre>
      <p>
        Hai giá trị này lấy ở Supabase Dashboard → <strong>Project Settings → API</strong>. Sau khi
        tạo file, khởi động lại <code>npm run dev</code>.
      </p>
      <p class="ghi-chu">
        Khi deploy lên GitHub Pages, khai báo hai biến này trong
        <strong>Settings → Secrets and variables → Actions → Variables</strong>.
      </p>
    </div>
  </main>
</template>

<style scoped>
.nen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-4);
}

.the {
  max-width: 560px;
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.icon {
  color: var(--color-accent);
}

h1 {
  margin: var(--space-3) 0 var(--space-4);
  font-size: var(--text-xl);
}

p {
  margin-bottom: var(--space-4);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--color-surface-2);
  padding: 1px 4px;
  border-radius: var(--radius-sm);
}

pre {
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background: var(--color-surface-2);
  border-radius: var(--radius-md);
  overflow-x: auto;
  font-size: var(--text-sm);
}

pre code {
  background: none;
  padding: 0;
}

.ghi-chu {
  margin-bottom: 0;
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--text-xs);
}
</style>
