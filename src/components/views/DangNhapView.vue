<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import PasswordField from '@/components/base/PasswordField.vue'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()

const form = reactive({ email: '', matKhau: '' })
const loiChung = ref('')
const dangGui = ref(false)
const dangGuiReset = ref(false)

async function guiForm() {
  loiChung.value = ''

  if (!form.email.trim() || !form.matKhau) {
    loiChung.value = 'Vui lòng nhập đầy đủ email và mật khẩu.'
    return
  }

  dangGui.value = true
  try {
    await auth.dangNhap(form.email, form.matKhau)
    // Quay lại đúng trang người dùng định vào trước khi bị chặn.
    const tiepTuc = typeof route.query.tiepTuc === 'string' ? route.query.tiepTuc : null
    await router.replace(tiepTuc ?? { name: 'nhat-ky' })
  } catch (e) {
    loiChung.value = e.message
  } finally {
    dangGui.value = false
  }
}

async function quenMatKhau() {
  if (!form.email.trim()) {
    loiChung.value = 'Nhập email của bạn vào ô phía trên rồi bấm lại "Quên mật khẩu?".'
    return
  }
  dangGuiReset.value = true
  try {
    await auth.guiEmailDatLaiMatKhau(form.email)
    toast.thanhCong('Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư của bạn.')
  } catch (e) {
    loiChung.value = e.message
  } finally {
    dangGuiReset.value = false
  }
}
</script>

<template>
  <AuthLayout tieu-de="Đăng nhập" mo-ta="Đăng nhập để xem và quản lý sổ công nợ.">
    <form class="form" novalidate @submit.prevent="guiForm">
      <p v-if="loiChung" class="loi-chung" role="alert">{{ loiChung }}</p>

      <BaseField v-slot="{ id, moTaBoi }" nhan="Email" id-truong="dn-email" bat-buoc>
        <input
          :id="id"
          v-model="form.email"
          type="email"
          autocomplete="email"
          inputmode="email"
          spellcheck="false"
          :aria-describedby="moTaBoi"
        />
      </BaseField>

      <BaseField v-slot="{ id, moTaBoi }" nhan="Mật khẩu" id-truong="dn-mat-khau" bat-buoc>
        <PasswordField
          v-model="form.matKhau"
          :id="id"
          :mo-ta-boi="moTaBoi"
          autocomplete="current-password"
        />
      </BaseField>

      <BaseButton type="submit" kieu="chinh" :dang-tai="dangGui">Đăng nhập</BaseButton>

      <button type="button" class="lien-ket" :disabled="dangGuiReset" @click="quenMatKhau">
        {{ dangGuiReset ? 'Đang gửi…' : 'Quên mật khẩu?' }}
      </button>
    </form>

    <p class="chan">
      Chưa có tài khoản?
      <RouterLink :to="{ name: 'dang-ky' }">Đăng ký</RouterLink>
    </p>
  </AuthLayout>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-5);
}

.loi-chung {
  padding: var(--space-3);
  background: var(--color-danger-subtle);
  color: var(--color-danger-fg);
  border: 1px solid var(--color-danger);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
}

.lien-ket {
  align-self: center;
  min-height: 36px;
  padding: 0 var(--space-2);
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-accent);
  border-radius: var(--radius-sm);
}

.lien-ket:hover:not(:disabled) {
  text-decoration: underline;
}

.chan {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
</style>
