<script setup>
import { PhCheckCircle, PhInfo, PhWarningOctagon, PhX } from '@phosphor-icons/vue'
import { useToast } from '@/composables/useToast'

const { danhSach, go } = useToast()

const ICON = {
  'thanh-cong': PhCheckCircle,
  loi: PhWarningOctagon,
  info: PhInfo,
}

function chay(toast) {
  toast.hanhDong.chay()
  go(toast.id)
}
</script>

<template>
  <!--
    aria-live="polite" để screen reader đọc thông báo mà KHÔNG cướp focus của
    người dùng — họ vẫn đang gõ trong form.
  -->
  <div class="khu" role="region" aria-label="Thông báo" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="t in danhSach" :key="t.id" :class="['toast', `toast--${t.loai}`]">
        <component :is="ICON[t.loai]" :size="20" weight="fill" aria-hidden="true" class="toast__icon" />
        <p class="toast__chu">{{ t.noiDung }}</p>

        <button v-if="t.hanhDong" type="button" class="toast__hanh-dong" @click="chay(t)">
          {{ t.hanhDong.nhan }}
        </button>

        <button type="button" class="toast__dong" aria-label="Đóng thông báo" @click="go(t.id)">
          <PhX :size="16" aria-hidden="true" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.khu {
  position: fixed;
  z-index: var(--z-toast);
  bottom: var(--space-4);
  left: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  pointer-events: none;
}

@media (min-width: 640px) {
  .khu {
    left: auto;
    align-items: flex-end;
  }
}

.toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  max-width: 420px;
  padding: var(--space-3) var(--space-3) var(--space-3) var(--space-4);
  background: var(--color-surface);
  color: var(--color-fg);
  border: 1px solid var(--color-border-strong);
  border-left-width: 3px;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  pointer-events: auto;
}

.toast--thanh-cong {
  border-left-color: var(--color-success);
}
.toast--thanh-cong .toast__icon {
  color: var(--color-success-fg);
}

.toast--loi {
  border-left-color: var(--color-danger);
}
.toast--loi .toast__icon {
  color: var(--color-danger-fg);
}

.toast--info {
  border-left-color: var(--color-accent);
}
.toast--info .toast__icon {
  color: var(--color-accent);
}

.toast__icon {
  flex-shrink: 0;
}

.toast__chu {
  flex: 1;
  min-width: 0;
  font-size: var(--text-sm);
  overflow-wrap: anywhere;
}

.toast__hanh-dong {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-accent-subtle);
}

.toast__dong {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  color: var(--color-fg-subtle);
}

.toast__dong:hover {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

.toast-enter-active {
  transition:
    transform var(--dur-base) var(--ease-enter),
    opacity var(--dur-base) var(--ease-enter);
}
.toast-leave-active {
  transition:
    transform var(--dur-exit) var(--ease-exit),
    opacity var(--dur-exit) var(--ease-exit);
  position: absolute;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>
