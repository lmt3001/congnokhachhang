<script setup>
/**
 * Nút chỉ có icon — nhãn đọc được là BẮT BUỘC, không có mặc định.
 *
 * Vùng chạm 36×36 (vượt ngưỡng 24×24 CSS px của WCAG 2.2 Target Size) dù icon
 * bên trong nhỏ hơn.
 */
defineProps({
  nhan: { type: String, required: true },
  nguyHiem: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
</script>

<template>
  <button
    type="button"
    class="nut-icon"
    :class="{ 'nut-icon--nguy-hiem': nguyHiem }"
    :aria-label="nhan"
    :title="nhan"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>

<style scoped>
.nut-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  transition:
    background-color var(--dur-fast) var(--ease-enter),
    color var(--dur-fast) var(--ease-enter);
}

.nut-icon:hover:not(:disabled) {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

.nut-icon--nguy-hiem:hover:not(:disabled) {
  background: var(--color-danger-subtle);
  color: var(--color-danger-fg);
}

.nut-icon:disabled {
  opacity: 0.45;
}
</style>
