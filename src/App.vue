<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { isSupabaseConfigured } from '@/lib/supabase'
import AppShell from '@/components/layout/AppShell.vue'
import ToastHost from '@/components/base/ToastHost.vue'
import ChuaCauHinhView from '@/components/views/ChuaCauHinhView.vue'

const auth = useAuthStore()
const onLine = ref(navigator.onLine)

function capNhatMang() {
  onLine.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', capNhatMang)
  window.addEventListener('offline', capNhatMang)
})

onUnmounted(() => {
  window.removeEventListener('online', capNhatMang)
  window.removeEventListener('offline', capNhatMang)
})
</script>

<template>
  <ChuaCauHinhView v-if="!isSupabaseConfigured" />

  <template v-else>
    <!-- Báo mất mạng ở mức toàn app: người dùng biết vì sao thao tác hỏng -->
    <div v-if="!onLine" class="mat-mang" role="status">
      Mất kết nối mạng. Dữ liệu hiển thị có thể đã cũ và bạn chưa lưu được thay đổi.
    </div>

    <div v-if="auth.dangKhoiTao" class="dang-tai">
      <span class="dang-tai__quay" aria-hidden="true" />
      <p>Đang tải…</p>
    </div>

    <AppShell v-else-if="auth.laThanhVien">
      <RouterView />
    </AppShell>

    <!-- Màn hình đăng nhập / đăng ký / chờ duyệt tự lo bố cục riêng -->
    <RouterView v-else />

    <ToastHost />
  </template>
</template>

<style scoped>
.mat-mang {
  position: sticky;
  top: 0;
  z-index: var(--z-toast);
  padding: var(--space-2) var(--space-4);
  background: var(--color-warning-subtle);
  color: var(--color-warning-fg);
  font-size: var(--text-sm);
  font-weight: 500;
  text-align: center;
}

.dang-tai {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  min-height: 100dvh;
  color: var(--color-fg-muted);
}

.dang-tai__quay {
  width: 28px;
  height: 28px;
  border: 3px solid var(--color-border-strong);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: quay 0.7s linear infinite;
}

@keyframes quay {
  to {
    transform: rotate(360deg);
  }
}
</style>
