<script setup>
import { ref } from 'vue'
import { PhEye, PhEyeSlash } from '@phosphor-icons/vue'

defineProps({
  modelValue: { type: String, default: '' },
  id: { type: String, required: true },
  moTaBoi: { type: String, default: undefined },
  coLoi: { type: Boolean, default: false },
  /** 'current-password' khi đăng nhập, 'new-password' khi đăng ký. */
  autocomplete: { type: String, default: 'current-password' },
})

defineEmits(['update:modelValue', 'blur'])

const hien = ref(false)
</script>

<template>
  <div class="mk">
    <!--
      Cố ý KHÔNG chặn paste và không đặt thuộc tính nào cản trình quản lý mật
      khẩu (WCAG 2.2 Accessible Authentication, mức Critical).
    -->
    <input
      :id="id"
      :type="hien ? 'text' : 'password'"
      :value="modelValue"
      :autocomplete="autocomplete"
      :aria-invalid="coLoi || undefined"
      :aria-describedby="moTaBoi"
      spellcheck="false"
      @input="$emit('update:modelValue', $event.target.value)"
      @blur="$emit('blur', $event)"
    />
    <button
      type="button"
      class="mk__nut"
      :aria-label="hien ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
      :aria-pressed="hien"
      @click="hien = !hien"
    >
      <component :is="hien ? PhEyeSlash : PhEye" :size="18" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.mk {
  position: relative;
  display: flex;
}

/* Chừa chỗ cho nút hiện/ẩn nằm chồng bên trong ô */
.mk input {
  padding-right: 44px;
}

.mk__nut {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  color: var(--color-fg-muted);
}

.mk__nut:hover {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}
</style>
