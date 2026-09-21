<script setup>
defineProps({
  tieuDe: { type: String, required: true },
  moTa: { type: String, default: '' },
  icon: { type: [Object, Function], default: null },
})
</script>

<template>
  <div class="trong">
    <component :is="icon" v-if="icon" :size="40" aria-hidden="true" class="trong__icon" />
    <h3 class="trong__tieu-de">{{ tieuDe }}</h3>
    <p v-if="moTa" class="trong__mo-ta">{{ moTa }}</p>

    <!-- Các bước hướng dẫn khi người dùng chưa biết bắt đầu từ đâu -->
    <ol v-if="$slots.buoc" class="trong__buoc">
      <slot name="buoc" />
    </ol>

    <div v-if="$slots.default" class="trong__hanh-dong">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.trong {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--color-fg-muted);
}

.trong__icon {
  color: var(--color-fg-subtle);
  margin-bottom: var(--space-3);
}

.trong__tieu-de {
  font-size: var(--text-lg);
  color: var(--color-fg);
}

.trong__mo-ta {
  margin-top: var(--space-2);
  max-width: 48ch; /* giữ độ dài dòng dễ đọc */
  font-size: var(--text-sm);
}

.trong__buoc {
  margin: var(--space-5) 0 0;
  padding: 0;
  list-style: none;
  counter-reset: buoc;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  text-align: left;
  font-size: var(--text-sm);
}

.trong__buoc :slotted(li) {
  counter-increment: buoc;
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.trong__buoc :slotted(li)::before {
  content: counter(buoc);
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-surface-2);
  color: var(--color-fg);
  font-weight: 600;
  font-size: var(--text-xs);
}

.trong__hanh-dong {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--space-3);
  margin-top: var(--space-6);
}
</style>
