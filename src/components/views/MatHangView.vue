<script setup>
import { ref } from 'vue'
import { PhPackage, PhPencilSimple, PhPlus, PhTrash } from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/authStore'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import { tien } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import IconButton from '@/components/base/IconButton.vue'
import TrangThaiTai from '@/components/base/TrangThaiTai.vue'
import MatHangDialog from '@/components/dialogs/MatHangDialog.vue'

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

function sua(mh) {
  dangSua.value = { ...mh }
  moForm.value = true
}

async function hoiXoa(mh) {
  dangXoa.value = mh
  const soGD = await congNo.demGiaoDichTheoTen('mat_hang', mh.ten)
  canhBaoXoa.value = soGD
    ? `Mặt hàng này xuất hiện trong ${soGD} giao dịch. Các giao dịch đó vẫn giữ nguyên tên "${mh.ten}" và đơn giá đã ghi — chỉ mục trong danh mục bị xoá.`
    : ''
}

async function xacNhanXoa() {
  try {
    await congNo.xoaMatHang(dangXoa.value.id)
    toast.thanhCong(`Đã xoá mặt hàng "${dangXoa.value.ten}".`)
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
        <h1>Mặt hàng</h1>
        <p class="dau-trang__phu">{{ congNo.matHang.length }} mặt hàng trong danh mục</p>
      </div>
      <BaseButton v-if="auth.duocSua" kieu="chinh" @click="themMoi">
        <PhPlus :size="18" aria-hidden="true" />
        Thêm mặt hàng
      </BaseButton>
    </header>

    <TrangThaiTai
      :dang-tai="congNo.dangTaiDanhMuc"
      :loi="congNo.loiDanhMuc"
      :co-du-lieu="congNo.matHang.length > 0"
      @thu-lai="congNo.taiDanhMuc()"
    >
      <EmptyState
        v-if="congNo.matHang.length === 0"
        :icon="PhPackage"
        tieu-de="Chưa có mặt hàng nào"
        :mo-ta="
          auth.duocSua
            ? 'Thêm mặt hàng để khi ghi giao dịch, đơn giá được tự điền sẵn.'
            : 'Khi quản trị viên thêm mặt hàng, danh sách sẽ hiện ở đây.'
        "
      >
        <BaseButton v-if="auth.duocSua" kieu="chinh" @click="themMoi">
          <PhPlus :size="18" aria-hidden="true" />
          Thêm mặt hàng
        </BaseButton>
      </EmptyState>

      <div v-else class="bang-bao">
        <table class="bang">
          <caption class="sr-only">Danh mục mặt hàng và đơn giá</caption>
          <thead>
            <tr>
              <th scope="col">Tên mặt hàng</th>
              <th scope="col">Đơn vị tính</th>
              <th scope="col" class="th--phai">Đơn giá</th>
              <th v-if="auth.duocSua" scope="col"><span class="sr-only">Thao tác</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mh in congNo.matHang" :key="mh.id">
              <td class="wrap-anywhere ten">{{ mh.ten }}</td>
              <td>{{ mh.dvt || '—' }}</td>
              <td class="num">{{ tien(mh.don_gia) }}</td>
              <td v-if="auth.duocSua" class="td--thao-tac">
                <div class="thao-tac">
                  <IconButton :nhan="`Sửa mặt hàng ${mh.ten}`" @click="sua(mh)">
                    <PhPencilSimple :size="18" aria-hidden="true" />
                  </IconButton>
                  <IconButton nguy-hiem :nhan="`Xoá mặt hàng ${mh.ten}`" @click="hoiXoa(mh)">
                    <PhTrash :size="18" aria-hidden="true" />
                  </IconButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </TrangThaiTai>

    <MatHangDialog v-if="auth.duocSua" :mo="moForm" :ban-ghi="dangSua" @dong="moForm = false" />

    <ConfirmDialog
      :mo="Boolean(dangXoa)"
      tieu-de="Xoá mặt hàng?"
      :noi-dung="dangXoa ? `Xoá “${dangXoa.ten}” khỏi danh mục mặt hàng?` : ''"
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

.bang-bao {
  overflow-x: auto;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.bang {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.bang th {
  padding: var(--space-3);
  background: var(--color-surface-2);
  color: var(--color-fg-muted);
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid var(--color-border);
}

.th--phai {
  text-align: right;
}

.bang td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.bang tbody tr:last-child td {
  border-bottom: none;
}

.bang tbody tr:hover {
  background: var(--color-surface-hover);
}

.ten {
  font-weight: 500;
}

.td--thao-tac {
  width: 1%;
}

/* Bọc trong div thay vì đặt flex thẳng lên <td>, nếu không ô mất tư cách
   table-cell và đường kẻ hàng bị đứt quãng. */
.thao-tac {
  display: flex;
  gap: var(--space-1);
  justify-content: flex-end;
}
</style>
