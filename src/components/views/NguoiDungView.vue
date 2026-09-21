<script setup>
import { computed, onMounted, ref } from 'vue'
import { PhCheck, PhProhibit, PhShieldCheck, PhUser, PhUsersThree } from '@phosphor-icons/vue'
import { moTaLoi, supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { ngayGioVN } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import StatusBadge from '@/components/base/StatusBadge.vue'
import TrangThaiTai from '@/components/base/TrangThaiTai.vue'

const auth = useAuthStore()
const toast = useToast()

const danhSach = ref([])
const dangTai = ref(false)
const loi = ref('')
const dangXuLy = ref(null)
const dangKhoa = ref(null)

const BADGE = { pending: 'cho-duyet', active: 'hoat-dong', disabled: 'da-khoa' }

/** Tài khoản chờ duyệt xếp lên đầu — đó là việc admin cần làm ngay. */
const daSapXep = computed(() => {
  const uuTien = { pending: 0, active: 1, disabled: 2 }
  return [...danhSach.value].sort(
    (a, b) => uuTien[a.status] - uuTien[b.status] || a.email.localeCompare(b.email),
  )
})

const soChoDuyet = computed(() => danhSach.value.filter((n) => n.status === 'pending').length)

const soAdminHoatDong = computed(
  () => danhSach.value.filter((n) => n.role === 'admin' && n.status === 'active').length,
)

/** Chặn tự khoá chết hệ thống — DB cũng có trigger chặn, đây là lớp UI. */
function laAdminCuoiCung(n) {
  return n.role === 'admin' && n.status === 'active' && soAdminHoatDong.value <= 1
}

async function tai() {
  dangTai.value = true
  loi.value = ''
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, ho_ten, role, status, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    danhSach.value = data ?? []
  } catch (e) {
    loi.value = moTaLoi(e, 'Không tải được danh sách người dùng.')
  } finally {
    dangTai.value = false
  }
}

async function capNhat(n, thayDoi, thongBao) {
  dangXuLy.value = n.id
  try {
    const { error } = await supabase.from('profiles').update(thayDoi).eq('id', n.id)
    if (error) throw error
    await tai()
    toast.thanhCong(thongBao)
  } catch (e) {
    toast.loi(moTaLoi(e))
  } finally {
    dangXuLy.value = null
  }
}

const duyet = (n) =>
  capNhat(n, { status: 'active' }, `Đã duyệt tài khoản ${n.email}.`)

const doiVaiTro = (n) =>
  capNhat(
    n,
    { role: n.role === 'admin' ? 'user' : 'admin' },
    n.role === 'admin'
      ? `${n.email} giờ chỉ xem được dữ liệu.`
      : `${n.email} giờ là quản trị viên.`,
  )

const moKhoa = (n) => capNhat(n, { status: 'active' }, `Đã mở khoá ${n.email}.`)

async function xacNhanKhoa() {
  const n = dangKhoa.value
  dangKhoa.value = null
  await capNhat(n, { status: 'disabled' }, `Đã vô hiệu hoá ${n.email}.`)
}

onMounted(tai)
</script>

<template>
  <div>
    <header class="dau-trang">
      <div>
        <h1>Người dùng</h1>
        <p class="dau-trang__phu">
          {{ danhSach.length }} tài khoản<span v-if="soChoDuyet"> · {{ soChoDuyet }} đang chờ duyệt</span>
        </p>
      </div>
    </header>

    <TrangThaiTai
      :dang-tai="dangTai"
      :loi="loi"
      :co-du-lieu="danhSach.length > 0"
      @thu-lai="tai"
    >
      <EmptyState
        v-if="danhSach.length === 0"
        :icon="PhUsersThree"
        tieu-de="Chưa có tài khoản nào"
        mo-ta="Khi có người đăng ký, tài khoản của họ sẽ xuất hiện ở đây để bạn duyệt."
      />

      <ul v-else class="ds">
        <li v-for="n in daSapXep" :key="n.id" class="the" :class="{ 'the--cho': n.status === 'pending' }">
          <div class="the__thong-tin">
            <p class="the__ten wrap-anywhere">{{ n.ho_ten || '(chưa đặt tên)' }}</p>
            <p class="the__email wrap-anywhere">{{ n.email }}</p>
            <p class="the__ngay">Đăng ký {{ ngayGioVN(n.created_at) }}</p>
          </div>

          <div class="the__badge">
            <StatusBadge :loai="BADGE[n.status]" />
            <StatusBadge :loai="n.role === 'admin' ? 'admin' : 'user'" />
            <span v-if="n.id === auth.profile?.id" class="la-ban">Bạn</span>
          </div>

          <div class="the__thao-tac">
            <BaseButton
              v-if="n.status === 'pending'"
              kieu="chinh"
              co="nho"
              :dang-tai="dangXuLy === n.id"
              @click="duyet(n)"
            >
              <PhCheck :size="16" aria-hidden="true" />
              Duyệt
            </BaseButton>

            <BaseButton
              v-if="n.status === 'disabled'"
              kieu="phu"
              co="nho"
              :dang-tai="dangXuLy === n.id"
              @click="moKhoa(n)"
            >
              Mở khoá
            </BaseButton>

            <BaseButton
              v-if="n.status === 'active'"
              kieu="phu"
              co="nho"
              :disabled="dangXuLy === n.id || laAdminCuoiCung(n)"
              :title="laAdminCuoiCung(n) ? 'Đây là quản trị viên hoạt động cuối cùng' : undefined"
              @click="doiVaiTro(n)"
            >
              <component :is="n.role === 'admin' ? PhUser : PhShieldCheck" :size="16" aria-hidden="true" />
              {{ n.role === 'admin' ? 'Chuyển thành Chỉ xem' : 'Cấp quyền quản trị' }}
            </BaseButton>

            <!-- Hành động phá huỷ tách khỏi nhóm trên bằng đường kẻ -->
            <BaseButton
              v-if="n.status !== 'disabled'"
              kieu="nguy-hiem"
              co="nho"
              class="nut-khoa"
              :disabled="dangXuLy === n.id || laAdminCuoiCung(n)"
              :title="laAdminCuoiCung(n) ? 'Không thể khoá quản trị viên hoạt động cuối cùng' : undefined"
              @click="dangKhoa = n"
            >
              <PhProhibit :size="16" aria-hidden="true" />
              Vô hiệu hoá
            </BaseButton>
          </div>
        </li>
      </ul>
    </TrangThaiTai>

    <ConfirmDialog
      :mo="Boolean(dangKhoa)"
      tieu-de="Vô hiệu hoá tài khoản?"
      :noi-dung="
        dangKhoa
          ? `${dangKhoa.email} sẽ không xem được dữ liệu nữa. Tài khoản không bị xoá, bạn có thể mở khoá lại sau.`
          : ''
      "
      :canh-bao="dangKhoa?.id === auth.profile?.id ? 'Đây là tài khoản của chính bạn — bạn sẽ bị đăng xuất khỏi dữ liệu ngay lập tức.' : ''"
      nhan-dong-y="Vô hiệu hoá"
      @dong="dangKhoa = null"
      @dong-y="xacNhanKhoa"
    />
  </div>
</template>

<style scoped>
.dau-trang {
  margin-bottom: var(--space-5);
}

h1 {
  font-size: var(--text-xl);
}

.dau-trang__phu {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.ds {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.the {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

/* Viền trái vàng để nhóm chờ duyệt nổi lên mà không cần đọc badge */
.the--cho {
  border-left: 3px solid var(--color-warning);
}

.the__thong-tin {
  flex: 1 1 200px;
  min-width: 0;
}

.the__ten {
  font-weight: 600;
}

.the__email {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.the__ngay {
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

.the__badge {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.la-ban {
  padding: 2px var(--space-2);
  border: 1px dashed var(--color-border-strong);
  border-radius: 999px;
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

.the__thao-tac {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  margin-left: auto;
}

/* Tách hành động phá huỷ khỏi các nút thường bằng khoảng trắng rộng hơn,
   để không bị bấm nhầm khi thao tác nhanh. */
.nut-khoa {
  margin-left: var(--space-4);
}
</style>
