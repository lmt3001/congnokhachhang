<script setup>
import { computed } from 'vue'
import { PhArrowDown, PhArrowUp, PhArrowsDownUp } from '@phosphor-icons/vue'

const props = defineProps({
  cot: { type: String, required: true },
  nhan: { type: String, required: true },
  sapXep: { type: Object, required: true }, // { cot, giamDan }
  canPhai: { type: Boolean, default: false },
})

defineEmits(['sap-xep'])

const dangSort = computed(() => props.sapXep.cot === props.cot)

// aria-sort cho screen reader biết cột nào đang sắp xếp và theo chiều nào.
const ariaSort = computed(() => {
  if (!dangSort.value) return 'none'
  return props.sapXep.giamDan ? 'descending' : 'ascending'
})

const icon = computed(() => {
  if (!dangSort.value) return PhArrowsDownUp
  return props.sapXep.giamDan ? PhArrowDown : PhArrowUp
})
</script>

<template>
  <th scope="col" :aria-sort="ariaSort" :class="{ 'th--phai': canPhai }">
    <button type="button" class="nut-sort" @click="$emit('sap-xep', cot)">
      <span>{{ nhan }}</span>
      <component :is="icon" :size="14" aria-hidden="true" :class="{ 'mo-nhat': !dangSort }" />
    </button>
  </th>
</template>

<style scoped>
.nut-sort {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 32px;
  padding: 0 var(--space-1);
  margin: 0 calc(-1 * var(--space-1));
  border-radius: var(--radius-sm);
  font: inherit;
  color: inherit;
}

.th--phai .nut-sort {
  flex-direction: row-reverse;
}

.nut-sort:hover {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

.mo-nhat {
  opacity: 0.4;
}
</style>
