<script setup>
import { PhArrowClockwise, PhWarningOctagon } from '@phosphor-icons/vue'
import BaseButton from './BaseButton.vue'

/**
 * Bọc quanh mọi vùng dữ liệu bất đồng bộ: skeleton khi tải, thông báo kèm nút
 * "Thử lại" khi lỗi, nội dung thật khi xong.
 *
 * Skeleton có cùng chiều cao với hàng thật nên không gây nhảy layout (CLS).
 */
defineProps({
  dangTai: { type: Boolean, default: false },
  loi: { type: String, default: '' },
  soDong: { type: Number, default: 6 },
  /** true khi đã có dữ liệu cũ trên màn hình — tải lại thì không xoá đi. */
  coDuLieu: { type: Boolean, default: false },
})

defineEmits(['thu-lai'])
</script>

<template>
  <div v-if="loi" class="loi" role="alert">
    <PhWarningOctagon :size="32" aria-hidden="true" />
    <p class="loi__chu">{{ loi }}</p>
    <BaseButton kieu="phu" co="nho" @click="$emit('thu-lai')">
      <PhArrowClockwise :size="16" aria-hidden="true" />
      Thử lại
    </BaseButton>
  </div>

  <div v-else-if="dangTai && !coDuLieu" class="khung" aria-busy="true">
    <span class="sr-only">Đang tải dữ liệu…</span>
    <div v-for="i in soDong" :key="i" class="khung__dong" aria-hidden="true" />
  </div>

  <slot v-else />
</template>

<style scoped>
.loi {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: var(--color-danger-fg);
}

.loi__chu {
  max-width: 52ch;
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.khung {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3) 0;
}

.khung__dong {
  height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(
    90deg,
    var(--color-surface-2) 25%,
    var(--color-surface-hover) 50%,
    var(--color-surface-2) 75%
  );
  background-size: 200% 100%;
  animation: loe 1.4s ease-in-out infinite;
}

@keyframes loe {
  to {
    background-position: -200% 0;
  }
}
</style>
