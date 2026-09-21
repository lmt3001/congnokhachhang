<script setup>
import { computed, useId } from 'vue'
import { PhWarningCircle } from '@phosphor-icons/vue'

const props = defineProps({
  nhan: { type: String, required: true },
  batBuoc: { type: Boolean, default: false },
  loi: { type: String, default: '' },
  goiY: { type: String, default: '' },
  /** Đặt id cố định để error summary có thể trỏ tới bằng href="#id". */
  idTruong: { type: String, default: '' },
})

const idTuDong = useId()
const id = computed(() => props.idTruong || idTuDong)
const idLoi = computed(() => `${id.value}-loi`)
const idGoiY = computed(() => `${id.value}-goi-y`)

// Nối cả gợi ý và lỗi để screen reader đọc đủ ngữ cảnh khi vào ô.
const moTaBoi = computed(
  () => [props.goiY ? idGoiY.value : '', props.loi ? idLoi.value : ''].filter(Boolean).join(' ') || undefined,
)

defineExpose({ id, idLoi, moTaBoi })
</script>

<template>
  <div class="truong" :class="{ 'truong--loi': loi }">
    <label class="truong__nhan" :for="id">
      {{ nhan }}
      <span v-if="batBuoc" class="truong__sao" aria-hidden="true">*</span>
      <span v-if="batBuoc" class="sr-only">(bắt buộc)</span>
    </label>

    <slot :id="id" :mo-ta-boi="moTaBoi" :co-loi="Boolean(loi)" />

    <!-- Gợi ý hiển thị cố định, không dùng placeholder thay cho nhãn -->
    <p v-if="goiY" :id="idGoiY" class="truong__goi-y">{{ goiY }}</p>

    <p v-if="loi" :id="idLoi" class="truong__loi" role="alert">
      <PhWarningCircle :size="16" weight="fill" aria-hidden="true" />
      <span>{{ loi }}</span>
    </p>
  </div>
</template>

<style scoped>
.truong {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.truong__nhan {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-fg);
}

.truong__sao {
  color: var(--color-danger-fg);
}

.truong__goi-y {
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

/* Lỗi có icon + chữ, không chỉ dựa vào màu đỏ */
.truong__loi {
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-danger-fg);
}

.truong__loi svg {
  flex-shrink: 0;
  margin-top: 1px;
}

/* Kiểu của <input> / <textarea> nằm ở assets/base.css (phạm vi toàn cục) —
   xem ghi chú ở đó về lý do không dùng :slotted(). Ở đây chỉ cần bảo đảm
   phần tử bọc do PasswordField / ComboBox truyền vào chiếm hết bề ngang. */
.truong :slotted(*) {
  width: 100%;
}
</style>
