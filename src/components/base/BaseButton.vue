<script setup>
import { computed } from 'vue'

const props = defineProps({
  kieu: { type: String, default: 'phu' }, // chinh | phu | nhe | nguy-hiem
  co: { type: String, default: 'vua' }, // vua | nho
  dangTai: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  type: { type: String, default: 'button' },
})

// Khi đang gọi API thì khoá nút lại để không gửi trùng (rule loading-buttons).
const biKhoa = computed(() => props.disabled || props.dangTai)
</script>

<template>
  <button
    :type="type"
    :class="['nut', `nut--${kieu}`, `nut--${co}`]"
    :disabled="biKhoa"
    :aria-busy="dangTai || undefined"
  >
    <span v-if="dangTai" class="nut__quay" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.nut {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  border-radius: var(--radius-md);
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;
  transition:
    background-color var(--dur-fast) var(--ease-enter),
    border-color var(--dur-fast) var(--ease-enter),
    color var(--dur-fast) var(--ease-enter);
}

/* Chiều cao ≥44px: đạt ngưỡng vùng chạm trên cảm ứng */
.nut--vua {
  min-height: 44px;
  padding: 0 var(--space-4);
  font-size: var(--text-base);
}

.nut--nho {
  min-height: 36px;
  padding: 0 var(--space-3);
  font-size: var(--text-sm);
}

.nut--chinh {
  background: var(--color-accent);
  color: var(--color-on-accent);
}
.nut--chinh:hover:not(:disabled) {
  background: var(--color-accent-hover);
}

.nut--phu {
  background: var(--color-surface);
  color: var(--color-fg);
  border-color: var(--color-border-strong);
}
.nut--phu:hover:not(:disabled) {
  background: var(--color-surface-hover);
}

.nut--nhe {
  background: transparent;
  color: var(--color-fg-muted);
}
.nut--nhe:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

.nut--nguy-hiem {
  background: var(--color-danger);
  color: var(--color-on-danger);
}
.nut--nguy-hiem:hover:not(:disabled) {
  background: var(--color-danger-hover);
}

/* Opacity 0.45 nằm trong khoảng 0.38–0.5 mà Material khuyến nghị cho disabled */
.nut:disabled {
  opacity: 0.45;
}

.nut__quay {
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: quay 0.6s linear infinite;
}

@keyframes quay {
  to {
    transform: rotate(360deg);
  }
}
</style>
