<script setup>
import { PhWallet } from '@phosphor-icons/vue'

defineProps({
  tieuDe: { type: String, required: true },
  moTa: { type: String, default: '' },
})
</script>

<template>
  <div class="nen">
    <main class="the">
      <p class="thuong-hieu">
        <PhWallet :size="24" weight="fill" aria-hidden="true" />
        <span>Quản lý công nợ</span>
      </p>

      <h1 class="tieu-de">{{ tieuDe }}</h1>
      <p v-if="moTa" class="mo-ta">{{ moTa }}</p>

      <slot />
    </main>
  </div>
</template>

<style scoped>
.nen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: var(--space-4);
  background: var(--color-bg);
}

.the {
  width: 100%;
  max-width: 420px;
  padding: var(--space-6);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.thuong-hieu {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  font-weight: 700;
  color: var(--color-fg);
}

.thuong-hieu svg {
  color: var(--color-accent);
}

.tieu-de {
  font-size: var(--text-xl);
}

.mo-ta {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
</style>
