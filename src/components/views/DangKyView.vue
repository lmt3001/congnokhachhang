<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import PasswordField from '@/components/base/PasswordField.vue'
import ErrorSummary from '@/components/base/ErrorSummary.vue'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({ hoTen: '', email: '', matKhau: '', xacNhan: '' })
const loi = reactive({ hoTen: '', email: '', matKhau: '', xacNhan: '' })
const loiChung = ref('')
const dangGui = ref(false)
const daGui = ref(false)

const TRUONG = [
  { khoa: 'hoTen', id: 'dk-ho-ten' },
  { khoa: 'email', id: 'dk-email' },
  { khoa: 'matKhau', id: 'dk-mat-khau' },
  { khoa: 'xacNhan', id: 'dk-xac-nhan' },
]

function kiemTra(khoa) {
  switch (khoa) {
    case 'hoTen':
      return form.hoTen.trim() ? '' : 'Vui lòng nhập họ và tên để quản trị viên biết bạn là ai.'
    case 'email':
      if (!form.email.trim()) return 'Vui lòng nhập email.'
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
        ? ''
        : 'Email không đúng định dạng. Ví dụ: ten@congty.com'
    case 'matKhau':
      if (!form.matKhau) return 'Vui lòng nhập mật khẩu.'
      return form.matKhau.length >= 8 ? '' : 'Mật khẩu phải có ít nhất 8 ký tự.'
    case 'xacNhan':
      if (!form.xacNhan) return 'Vui lòng nhập lại mật khẩu.'
      return form.xacNhan === form.matKhau ? '' : 'Hai lần nhập mật khẩu chưa khớp nhau.'
    default:
      return ''
  }
}

// Kiểm tra khi rời ô, không phải mỗi lần gõ phím.
function roiO(khoa) {
  // Chỉ báo lỗi khi người dùng đã nhập gì đó hoặc đã từng submit hỏng.
  if (daGui.value || form[khoa]) loi[khoa] = kiemTra(khoa)
}

// Ô đang báo lỗi thì kiểm tra lại ngay khi gõ, để thông báo biến mất đúng lúc
// người dùng vừa sửa xong thay vì phải rời ô mới hết.
watch(
  () => ({ ...form }),
  () => {
    for (const { khoa } of TRUONG) {
      if (loi[khoa]) loi[khoa] = kiemTra(khoa)
    }
    // Đổi mật khẩu thì phần xác nhận cũng phải được soi lại.
    if (loi.xacNhan || form.xacNhan) loi.xacNhan = form.xacNhan ? kiemTra('xacNhan') : ''
  },
  { deep: true },
)

const danhSachLoi = computed(() =>
  TRUONG.filter(({ khoa }) => loi[khoa]).map(({ khoa, id }) => ({ id, chu: loi[khoa] })),
)

async function guiForm() {
  daGui.value = true
  loiChung.value = ''

  for (const { khoa } of TRUONG) loi[khoa] = kiemTra(khoa)
  if (danhSachLoi.value.length) return

  dangGui.value = true
  try {
    await auth.dangKy(form.email, form.matKhau, form.hoTen)
    await router.replace({ name: 'cho-duyet', query: { vuaDangKy: '1' } })
  } catch (e) {
    loiChung.value = e.message
  } finally {
    dangGui.value = false
  }
}
</script>

<template>
  <AuthLayout
    tieu-de="Đăng ký"
    mo-ta="Tạo tài khoản rồi chờ quản trị viên duyệt. Sau khi được duyệt bạn sẽ xem được sổ công nợ."
  >
    <form class="form" novalidate @submit.prevent="guiForm">
      <ErrorSummary :loi="danhSachLoi" />

      <p v-if="loiChung" class="loi-chung" role="alert">{{ loiChung }}</p>

      <BaseField
        v-slot="{ id, moTaBoi, coLoi }"
        nhan="Họ và tên"
        id-truong="dk-ho-ten"
        bat-buoc
        :loi="loi.hoTen"
      >
        <input
          :id="id"
          v-model="form.hoTen"
          type="text"
          autocomplete="name"
          :aria-invalid="coLoi || undefined"
          :aria-describedby="moTaBoi"
          @blur="roiO('hoTen')"
        />
      </BaseField>

      <BaseField
        v-slot="{ id, moTaBoi, coLoi }"
        nhan="Email"
        id-truong="dk-email"
        bat-buoc
        :loi="loi.email"
      >
        <input
          :id="id"
          v-model="form.email"
          type="email"
          autocomplete="email"
          inputmode="email"
          spellcheck="false"
          :aria-invalid="coLoi || undefined"
          :aria-describedby="moTaBoi"
          @blur="roiO('email')"
        />
      </BaseField>

      <BaseField
        v-slot="{ id, moTaBoi, coLoi }"
        nhan="Mật khẩu"
        id-truong="dk-mat-khau"
        bat-buoc
        goi-y="Ít nhất 8 ký tự."
        :loi="loi.matKhau"
      >
        <PasswordField
          v-model="form.matKhau"
          :id="id"
          :mo-ta-boi="moTaBoi"
          :co-loi="coLoi"
          autocomplete="new-password"
          @blur="roiO('matKhau')"
        />
      </BaseField>

      <BaseField
        v-slot="{ id, moTaBoi, coLoi }"
        nhan="Nhập lại mật khẩu"
        id-truong="dk-xac-nhan"
        bat-buoc
        :loi="loi.xacNhan"
      >
        <PasswordField
          v-model="form.xacNhan"
          :id="id"
          :mo-ta-boi="moTaBoi"
          :co-loi="coLoi"
          autocomplete="new-password"
          @blur="roiO('xacNhan')"
        />
      </BaseField>

      <BaseButton type="submit" kieu="chinh" :dang-tai="dangGui">Tạo tài khoản</BaseButton>
    </form>

    <p class="chan">
      Đã có tài khoản?
      <RouterLink :to="{ name: 'dang-nhap' }">Đăng nhập</RouterLink>
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

.chan {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  text-align: center;
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
</style>
