<script setup>
import { ref } from 'vue'
import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

defineProps({
  mo: { type: Boolean, required: true },
  tieuDe: { type: String, default: 'Xác nhận' },
  noiDung: { type: String, required: true },
  /** Cảnh báo phụ, ví dụ "Khách này còn 3 giao dịch trong sổ." */
  canhBao: { type: String, default: '' },
  nhanDongY: { type: String, default: 'Xoá' },
  nguyHiem: { type: Boolean, default: true },
})

const emit = defineEmits(['dong', 'dong-y'])
const dangChay = ref(false)

async function dongY() {
  dangChay.value = true
  try {
    await emit('dong-y')
  } finally {
    dangChay.value = false
  }
}
</script>

<template>
  <BaseModal :mo="mo" :tieu-de="tieuDe" rong="440px" @dong="emit('dong')">
    <p class="noi-dung">{{ noiDung }}</p>
    <p v-if="canhBao" class="canh-bao">{{ canhBao }}</p>

    <template #chan>
      <!-- Nút huỷ đứng trước và tách khỏi nút phá huỷ để tránh bấm nhầm -->
      <BaseButton kieu="phu" @click="emit('dong')">Huỷ</BaseButton>
      <BaseButton :kieu="nguyHiem ? 'nguy-hiem' : 'chinh'" :dang-tai="dangChay" @click="dongY">
        {{ nhanDongY }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.noi-dung {
  overflow-wrap: anywhere;
}

.canh-bao {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--color-warning-subtle);
  color: var(--color-warning-fg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
}
</style>
