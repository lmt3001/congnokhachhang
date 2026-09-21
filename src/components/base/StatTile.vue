<script setup>
import { tien } from '@/utils/format'

defineProps({
  nhan: { type: String, required: true },
  giaTri: { type: [Number, String], required: true },
  donVi: { type: String, default: '₫' },
  /** 'thuong' | 'canh-bao' — canh-bao dùng cho tổng còn nợ */
  nhanManh: { type: String, default: 'thuong' },
  icon: { type: [Object, Function], default: null },
  laTien: { type: Boolean, default: true },
})
</script>

<template>
  <div :class="['o', { 'o--canh-bao': nhanManh === 'canh-bao' }]">
    <div class="o__dau">
      <component :is="icon" v-if="icon" :size="18" aria-hidden="true" />
      <span class="o__nhan">{{ nhan }}</span>
    </div>
    <p class="o__gia-tri num">
      {{ laTien ? tien(giaTri) : giaTri }}<span v-if="laTien && donVi" class="o__don-vi">{{ donVi }}</span>
    </p>
  </div>
</template>

<style scoped>
.o {
  padding: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Nhấn mạnh bằng viền trái dày + màu, không chỉ bằng màu chữ */
.o--canh-bao {
  border-left: 3px solid var(--color-danger);
}

.o__dau {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-fg-muted);
}

.o__nhan {
  font-size: var(--text-sm);
  font-weight: 500;
}

.o__gia-tri {
  margin-top: var(--space-2);
  font-size: var(--text-xl);
  font-weight: 600;
  text-align: left;
  color: var(--color-fg);
}

.o--canh-bao .o__gia-tri {
  color: var(--color-danger-fg);
}

.o__don-vi {
  margin-left: 2px;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-fg-subtle);
}
</style>
