<script setup>
import { nextTick, ref, watch } from 'vue'
import { PhWarningOctagon } from '@phosphor-icons/vue'

/**
 * Bảng tóm tắt lỗi ở đầu form sau khi submit thất bại.
 *
 * Bổ sung cho — chứ không thay thế — lỗi hiển thị ngay dưới từng ô. Sau khi
 * submit hỏng thì khối này nhận focus để người dùng bàn phím và screen reader
 * biết ngay có chuyện gì, mỗi dòng là một liên kết nhảy thẳng tới ô sai.
 */
const props = defineProps({
  /** [{ id: 'id-cua-o', chu: 'Mô tả lỗi' }] */
  loi: { type: Array, default: () => [] },
})

const khoi = ref(null)

watch(
  () => props.loi.length,
  async (soLoi, truocDo) => {
    // Chỉ chuyển focus khi lỗi vừa xuất hiện, không giật focus mỗi lần blur.
    if (soLoi > 0 && !truocDo) {
      await nextTick()
      khoi.value?.focus()
    }
  },
)

function nhayToi(id) {
  const el = document.getElementById(id)
  el?.focus()
  el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
}
</script>

<template>
  <div v-if="loi.length" ref="khoi" class="tom-tat" role="alert" tabindex="-1">
    <h3 class="tom-tat__tieu-de">
      <PhWarningOctagon :size="18" weight="fill" aria-hidden="true" />
      {{ loi.length === 1 ? 'Có 1 chỗ cần sửa' : `Có ${loi.length} chỗ cần sửa` }}
    </h3>
    <ul class="tom-tat__ds">
      <li v-for="l in loi" :key="l.id">
        <a :href="`#${l.id}`" @click.prevent="nhayToi(l.id)">{{ l.chu }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tom-tat {
  margin-bottom: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-danger-subtle);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
}

.tom-tat__tieu-de {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  color: var(--color-danger-fg);
}

.tom-tat__ds {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-6);
  font-size: var(--text-sm);
}

.tom-tat__ds a {
  color: var(--color-danger-fg);
  font-weight: 500;
}
</style>
