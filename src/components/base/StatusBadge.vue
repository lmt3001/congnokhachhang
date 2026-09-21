<script setup>
import { computed } from 'vue'
import {
  PhCheckCircle,
  PhClock,
  PhProhibit,
  PhShieldCheck,
  PhUser,
  PhWarningCircle,
} from '@phosphor-icons/vue'

/**
 * Badge trạng thái luôn gồm icon + chữ.
 *
 * Sổ Excel gốc chỉ tô đỏ số tiền còn nợ — người mù màu hoặc in đen trắng là
 * mất thông tin. Ở đây màu chỉ là lớp nhấn mạnh thêm.
 */
const props = defineProps({
  loai: { type: String, required: true },
})

const CAU_HINH = {
  'con-no': { chu: 'Còn nợ', icon: PhWarningCircle, mau: 'do' },
  'da-tra': { chu: 'Đã trả đủ', icon: PhCheckCircle, mau: 'xanh' },
  'cho-duyet': { chu: 'Chờ duyệt', icon: PhClock, mau: 'vang' },
  'hoat-dong': { chu: 'Đang hoạt động', icon: PhCheckCircle, mau: 'xanh' },
  'da-khoa': { chu: 'Đã khoá', icon: PhProhibit, mau: 'xam' },
  admin: { chu: 'Quản trị viên', icon: PhShieldCheck, mau: 'tim' },
  user: { chu: 'Chỉ xem', icon: PhUser, mau: 'xam' },
}

const cauHinh = computed(() => CAU_HINH[props.loai] ?? CAU_HINH['da-khoa'])
</script>

<template>
  <span :class="['badge', `badge--${cauHinh.mau}`]">
    <component :is="cauHinh.icon" :size="14" weight="fill" aria-hidden="true" />
    {{ cauHinh.chu }}
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  padding: 2px var(--space-2);
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 600;
  white-space: nowrap;
  line-height: 1.6;
}

.badge svg {
  flex-shrink: 0;
}

.badge--do {
  background: var(--color-danger-subtle);
  color: var(--color-danger-fg);
}

.badge--xanh {
  background: var(--color-success-subtle);
  color: var(--color-success-fg);
}

.badge--vang {
  background: var(--color-warning-subtle);
  color: var(--color-warning-fg);
}

.badge--tim {
  background: var(--color-accent-subtle);
  color: var(--color-accent-hover);
}

.badge--xam {
  background: var(--color-surface-2);
  color: var(--color-fg-muted);
}
</style>
