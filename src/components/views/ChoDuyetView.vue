<script setup>
import { computed, ref } from 'vue'
import { PhArrowClockwise, PhClock, PhProhibit } from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/authStore'
import AuthLayout from '@/components/layout/AuthLayout.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const auth = useAuthStore()
const dangTaiLai = ref(false)

const biKhoa = computed(() => auth.trangThai === 'disabled')

const noiDung = computed(() =>
  biKhoa.value
    ? {
        icon: PhProhibit,
        tieuDe: 'Tài khoản đã bị khoá',
        chu: 'Tài khoản của bạn đã bị quản trị viên vô hiệu hoá nên hiện không truy cập được dữ liệu. Hãy liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.',
      }
    : {
        icon: PhClock,
        tieuDe: 'Đang chờ duyệt',
        chu: 'Tài khoản đã được tạo. Quản trị viên cần duyệt trước khi bạn xem được sổ công nợ. Sau khi được duyệt, bấm "Kiểm tra lại" hoặc đăng nhập lại.',
      },
)

async function kiemTraLai() {
  dangTaiLai.value = true
  try {
    await auth.taiHoSo()
    // Router guard sẽ tự đưa vào app khi trạng thái đã chuyển sang 'active'.
    if (auth.laThanhVien) window.location.reload()
  } finally {
    dangTaiLai.value = false
  }
}

async function dangXuat() {
  await auth.dangXuat()
  window.location.reload()
}
</script>

<template>
  <AuthLayout :tieu-de="noiDung.tieuDe">
    <div class="khoi">
      <component :is="noiDung.icon" :size="40" weight="fill" aria-hidden="true" class="khoi__icon" />
      <p class="khoi__chu">{{ noiDung.chu }}</p>
      <p class="khoi__email wrap-anywhere">{{ auth.profile?.email }}</p>
    </div>

    <div class="hanh-dong">
      <BaseButton v-if="!biKhoa" kieu="chinh" :dang-tai="dangTaiLai" @click="kiemTraLai">
        <PhArrowClockwise :size="18" aria-hidden="true" />
        Kiểm tra lại
      </BaseButton>
      <BaseButton kieu="phu" @click="dangXuat">Đăng xuất</BaseButton>
    </div>
  </AuthLayout>
</template>

<style scoped>
.khoi {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding: var(--space-5);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.khoi__icon {
  color: var(--color-warning);
}

.khoi__chu {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.khoi__email {
  font-size: var(--text-sm);
  font-weight: 600;
}

.hanh-dong {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-5);
}
</style>
