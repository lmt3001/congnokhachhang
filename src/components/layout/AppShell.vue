<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  PhBookOpen,
  PhMoon,
  PhPackage,
  PhSignOut,
  PhSun,
  PhUsers,
  PhUsersThree,
  PhWallet,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/authStore'
import { useCongNoStore } from '@/stores/congNoStore'
import { useTheme } from '@/composables/useTheme'
import { supabase } from '@/lib/supabase'
import StatusBadge from '@/components/base/StatusBadge.vue'

const auth = useAuthStore()
const congNo = useCongNoStore()
const route = useRoute()
const { dangToi, doiCheDo } = useTheme()

const noiDungChinh = ref(null)
const soChoDuyet = ref(0)

const MUC_NAV = [
  { ten: 'nhat-ky', nhan: 'Nhật ký', icon: PhBookOpen },
  { ten: 'tong-hop', nhan: 'Tổng hợp', icon: PhWallet },
  { ten: 'khach-hang', nhan: 'Khách hàng', icon: PhUsers },
  { ten: 'mat-hang', nhan: 'Mặt hàng', icon: PhPackage },
]

const dsNav = computed(() =>
  auth.laAdmin
    ? [...MUC_NAV, { ten: 'nguoi-dung', nhan: 'Người dùng', icon: PhUsersThree, chiAdmin: true }]
    : MUC_NAV,
)

/**
 * Câu đầy đủ cho vùng role="status" — screen reader đọc "2 tài khoản chờ
 * duyệt" chứ không phải một con số trơ trọi.
 */
const thongBaoChoDuyet = computed(() =>
  soChoDuyet.value > 0 ? `${soChoDuyet.value} tài khoản đang chờ duyệt` : '',
)

async function demChoDuyet() {
  if (!auth.laAdmin) {
    soChoDuyet.value = 0
    return
  }
  const { count } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
  soChoDuyet.value = count ?? 0
}

// Sau khi đổi trang, đưa focus vào vùng nội dung để người dùng bàn phím và
// screen reader không bị bỏ lại ở cuối menu.
watch(
  () => route.fullPath,
  () => {
    noiDungChinh.value?.focus()
    demChoDuyet()
  },
)

onMounted(async () => {
  await congNo.taiTatCa()
  congNo.batRealtime()
  demChoDuyet()
})

onUnmounted(() => congNo.tatRealtime())

async function dangXuat() {
  congNo.datLai()
  await auth.dangXuat()
  window.location.reload()
}
</script>

<template>
  <div class="vo">
    <a href="#noi-dung" class="skip-link">Bỏ qua tới nội dung chính</a>

    <header class="thanh-tren">
      <p class="thuong-hieu">
        <PhWallet :size="22" weight="fill" aria-hidden="true" />
        <span>Quản lý công nợ</span>
      </p>

      <div class="thanh-tren__phai">
        <button
          type="button"
          class="nut-theme"
          :aria-label="dangToi ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'"
          @click="doiCheDo"
        >
          <component :is="dangToi ? PhSun : PhMoon" :size="18" aria-hidden="true" />
        </button>
      </div>
    </header>

    <div class="than">
      <!-- ≥1024px: sidebar dọc. Nhỏ hơn: dải tab cuộn ngang ngay dưới header. -->
      <nav class="dieu-huong" aria-label="Điều hướng chính">
        <ul class="dieu-huong__ds">
          <li v-for="muc in dsNav" :key="muc.ten">
            <RouterLink :to="{ name: muc.ten }" class="muc" active-class="muc--dang-o">
              <component :is="muc.icon" :size="20" aria-hidden="true" />
              <!-- Luôn kèm nhãn chữ, không dùng nav chỉ có icon -->
              <span class="muc__nhan">{{ muc.nhan }}</span>
              <span v-if="muc.chiAdmin && soChoDuyet > 0" class="muc__badge">{{ soChoDuyet }}</span>
            </RouterLink>
          </li>
        </ul>

        <div class="dieu-huong__day">
          <div class="nguoi-dung">
            <p class="nguoi-dung__ten wrap-anywhere">{{ auth.tenHienThi }}</p>
            <StatusBadge :loai="auth.laAdmin ? 'admin' : 'user'" />
          </div>
          <!-- Đăng xuất tách hẳn khỏi nhóm điều hướng thường -->
          <button type="button" class="muc muc--thoat" @click="dangXuat">
            <PhSignOut :size="20" aria-hidden="true" />
            <span class="muc__nhan">Đăng xuất</span>
          </button>
        </div>
      </nav>

      <main id="noi-dung" ref="noiDungChinh" class="noi-dung" tabindex="-1">
        <slot />
      </main>
    </div>

    <!-- Một vùng status duy nhất cho cả app, tránh nhiều live region tranh nhau -->
    <p class="sr-only" role="status">{{ thongBaoChoDuyet }}</p>
  </div>
</template>

<style scoped>
.vo {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.thanh-tren {
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  height: var(--header-h);
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.thuong-hieu {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 700;
  color: var(--color-fg);
}

.thuong-hieu svg {
  color: var(--color-accent);
}

.nut-theme {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
}

.nut-theme:hover {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

.than {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* --- Điều hướng: mobile = dải tab ngang --- */
.dieu-huong {
  position: sticky;
  top: var(--header-h);
  z-index: var(--z-sticky);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.dieu-huong__ds {
  display: flex;
  gap: var(--space-1);
  margin: 0;
  padding: var(--space-2);
  list-style: none;
  overflow-x: auto;
  scrollbar-width: thin;
}

.muc {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-height: 44px;
  padding: 0 var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-fg-muted);
  text-decoration: none;
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
  transition:
    background-color var(--dur-fast) var(--ease-enter),
    color var(--dur-fast) var(--ease-enter);
}

.muc:hover {
  background: var(--color-surface-hover);
  color: var(--color-fg);
}

/* Vị trí hiện tại phân biệt bằng cả nền, màu chữ và độ đậm — không chỉ màu */
.muc--dang-o {
  background: var(--color-surface-2);
  color: var(--color-fg);
  font-weight: 700;
}

.muc__badge {
  display: grid;
  place-items: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--color-danger);
  color: var(--color-on-danger);
  font-size: var(--text-xs);
  font-weight: 700;
}

.dieu-huong__day {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-3) var(--space-2);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-2);
}

.nguoi-dung {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--text-sm);
}

.nguoi-dung__ten {
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 18ch;
}

.muc--thoat {
  color: var(--color-fg-muted);
}

.muc--thoat:hover {
  background: var(--color-danger-subtle);
  color: var(--color-danger-fg);
}

.noi-dung {
  flex: 1;
  min-width: 0;
  padding: var(--space-4);
}

.noi-dung:focus {
  outline: none;
}

/* --- ≥1024px: chuyển sang sidebar dọc --- */
@media (min-width: 1024px) {
  .than {
    flex-direction: row;
  }

  .dieu-huong {
    position: sticky;
    top: var(--header-h);
    align-self: flex-start;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    width: var(--sidebar-w);
    flex-shrink: 0;
    height: calc(100dvh - var(--header-h));
    border-bottom: none;
    border-right: 1px solid var(--color-border);
  }

  .dieu-huong__ds {
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-3);
    overflow-x: visible;
    overflow-y: auto;
  }

  .muc {
    min-height: 40px;
    font-size: var(--text-base);
  }

  .muc__badge {
    margin-left: auto;
  }

  .dieu-huong__day {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-2);
    padding: var(--space-3);
  }

  .nguoi-dung {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-1);
  }

  .nguoi-dung__ten {
    max-width: 100%;
  }

  .noi-dung {
    padding: var(--space-6);
    max-width: 1400px;
  }
}
</style>
