<script setup>
import { ref } from 'vue'
import { PhPencilSimple, PhTrash, PhUserPlus, PhUsers } from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/authStore'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/base/BaseButton.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import IconButton from '@/components/base/IconButton.vue'
import TrangThaiTai from '@/components/base/TrangThaiTai.vue'
import KhachHangDialog from '@/components/dialogs/KhachHangDialog.vue'

const auth = useAuthStore()
const congNo = useCongNoStore()
const toast = useToast()

const moForm = ref(false)
const dangSua = ref(null)
const dangXoa = ref(null)
const canhBaoXoa = ref('')

function themMoi() {
  dangSua.value = null
  moForm.value = true
}

function sua(kh) {
  dangSua.value = { ...kh }
  moForm.value = true
}

async function hoiXoa(kh) {
  dangXoa.value = kh
  const soGD = await congNo.demGiaoDichTheoTen('ten_kh', kh.ten)
  canhBaoXoa.value = soGD
    ? `Khách này đang có ${soGD} giao dịch trong sổ nhật ký. Các giao dịch đó vẫn được giữ nguyên với tên "${kh.ten}" — chỉ thông tin liên hệ trong danh mục bị xoá.`
    : ''
}

async function xacNhanXoa() {
  try {
    await congNo.xoaKhachHang(dangXoa.value.id)
    toast.thanhCong(`Đã xoá khách hàng "${dangXoa.value.ten}".`)
    dangXoa.value = null
  } catch (e) {
    toast.loi(e.message)
  }
}
</script>

<template>
  <div>
    <header class="dau-trang">
      <div>
        <h1>Khách hàng</h1>
        <p class="dau-trang__phu">{{ congNo.khachHang.length }} khách hàng trong danh mục</p>
      </div>
      <BaseButton v-if="auth.duocSua" kieu="chinh" @click="themMoi">
        <PhUserPlus :size="18" aria-hidden="true" />
        Thêm khách hàng
      </BaseButton>
    </header>

    <TrangThaiTai
      :dang-tai="congNo.dangTaiDanhMuc"
      :loi="congNo.loiDanhMuc"
      :co-du-lieu="congNo.khachHang.length > 0"
      @thu-lai="congNo.taiDanhMuc()"
    >
      <EmptyState
        v-if="congNo.khachHang.length === 0"
        :icon="PhUsers"
        tieu-de="Chưa có khách hàng nào"
        :mo-ta="
          auth.duocSua
            ? 'Thêm khách hàng để khi ghi giao dịch, số điện thoại được tự điền sẵn.'
            : 'Khi quản trị viên thêm khách hàng, danh sách sẽ hiện ở đây.'
        "
      >
        <BaseButton v-if="auth.duocSua" kieu="chinh" @click="themMoi">
          <PhUserPlus :size="18" aria-hidden="true" />
          Thêm khách hàng
        </BaseButton>
      </EmptyState>

      <ul v-else class="ds">
        <li v-for="kh in congNo.khachHang" :key="kh.id" class="the">
          <div class="the__chinh">
            <p class="the__ten wrap-anywhere">{{ kh.ten }}</p>
            <p v-if="kh.sdt" class="the__sdt">{{ kh.sdt }}</p>
            <p v-if="kh.dia_chi" class="the__phu wrap-anywhere">{{ kh.dia_chi }}</p>
            <p v-if="kh.ghi_chu" class="the__ghi-chu wrap-anywhere">{{ kh.ghi_chu }}</p>
          </div>
          <div v-if="auth.duocSua" class="the__thao-tac">
            <IconButton :nhan="`Sửa khách hàng ${kh.ten}`" @click="sua(kh)">
              <PhPencilSimple :size="18" aria-hidden="true" />
            </IconButton>
            <IconButton nguy-hiem :nhan="`Xoá khách hàng ${kh.ten}`" @click="hoiXoa(kh)">
              <PhTrash :size="18" aria-hidden="true" />
            </IconButton>
          </div>
        </li>
      </ul>
    </TrangThaiTai>

    <KhachHangDialog v-if="auth.duocSua" :mo="moForm" :ban-ghi="dangSua" @dong="moForm = false" />

    <ConfirmDialog
      :mo="Boolean(dangXoa)"
      tieu-de="Xoá khách hàng?"
      :noi-dung="dangXoa ? `Xoá “${dangXoa.ten}” khỏi danh mục khách hàng?` : ''"
      :canh-bao="canhBaoXoa"
      @dong="dangXoa = null"
      @dong-y="xacNhanXoa"
    />
  </div>
</template>

<style scoped>
.dau-trang {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
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
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.the {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.the__chinh {
  min-width: 0;
}

.the__ten {
  font-weight: 600;
}

.the__sdt {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.the__phu {
  margin-top: var(--space-1);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}

.the__ghi-chu {
  margin-top: var(--space-1);
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
  font-style: italic;
}

.the__thao-tac {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-1);
}
</style>
