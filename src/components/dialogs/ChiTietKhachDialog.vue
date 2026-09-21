<script setup>
import { ref, watch } from 'vue'
import { useCongNoStore } from '@/stores/congNoStore'
import { ngayVN, so, tien } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import StatusBadge from '@/components/base/StatusBadge.vue'
import TrangThaiTai from '@/components/base/TrangThaiTai.vue'

const props = defineProps({
  mo: { type: Boolean, required: true },
  khach: { type: Object, default: null },
})

const emit = defineEmits(['dong'])

const congNo = useCongNoStore()
const danhSach = ref([])
const dangTai = ref(false)
const loi = ref('')

async function tai() {
  if (!props.khach) return
  dangTai.value = true
  loi.value = ''
  try {
    danhSach.value = await congNo.taiGiaoDichCuaKhach(props.khach.ten_kh)
  } catch (e) {
    loi.value = e.message
    danhSach.value = []
  } finally {
    dangTai.value = false
  }
}

watch(
  () => props.mo,
  (mo) => {
    if (mo) tai()
    else danhSach.value = []
  },
)
</script>

<template>
  <BaseModal
    :mo="mo"
    :tieu-de="khach?.ten_kh ?? 'Chi tiết khách hàng'"
    :mo-ta="khach?.sdt ? `Số điện thoại: ${khach.sdt}` : ''"
    rong="820px"
    @dong="emit('dong')"
  >
    <TrangThaiTai :dang-tai="dangTai" :loi="loi" :so-dong="4" @thu-lai="tai">
      <div class="bang-bao">
        <table class="bang">
          <caption class="sr-only">
            Toàn bộ giao dịch của {{ khach?.ten_kh }}
          </caption>
          <thead>
            <tr>
              <th scope="col">Ngày</th>
              <th scope="col">Mặt hàng</th>
              <th scope="col" class="th--phai">SL</th>
              <th scope="col" class="th--phai">Đơn giá</th>
              <th scope="col" class="th--phai">Thành tiền</th>
              <th scope="col" class="th--phai">Đã trả</th>
              <th scope="col" class="th--phai">Còn nợ</th>
              <th scope="col">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="gd in danhSach" :key="gd.id">
              <td class="num">{{ ngayVN(gd.ngay) }}</td>
              <td class="wrap-anywhere">{{ gd.mat_hang }}</td>
              <td class="num">{{ so(gd.so_luong) }}</td>
              <td class="num">{{ tien(gd.don_gia) }}</td>
              <td class="num">{{ tien(gd.thanh_tien) }}</td>
              <td class="num">{{ tien(gd.da_thanh_toan) }}</td>
              <td class="num" :class="{ 'num--no': Number(gd.con_no) > 0 }">
                {{ tien(gd.con_no) }}
              </td>
              <td class="wrap-anywhere ghi-chu">{{ gd.ghi_chu || '—' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th scope="row" colspan="4">Tổng cộng</th>
              <td class="num">{{ tien(khach?.tong_ban) }}</td>
              <td class="num">{{ tien(khach?.tong_thu) }}</td>
              <td class="num" :class="{ 'num--no': Number(khach?.con_no) > 0 }">
                {{ tien(khach?.con_no) }}
              </td>
              <td><StatusBadge :loai="Number(khach?.con_no) > 0 ? 'con-no' : 'da-tra'" /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </TrangThaiTai>

    <template #chan>
      <BaseButton kieu="phu" @click="emit('dong')">Quay lại</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.bang-bao {
  overflow-x: auto;
}

.bang {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

.bang th {
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-2);
  color: var(--color-fg-muted);
  font-weight: 600;
  text-align: left;
  white-space: nowrap;
}

.th--phai {
  text-align: right;
}

.bang td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
}

.bang tfoot th,
.bang tfoot td {
  background: var(--color-bg);
  border-top: 2px solid var(--color-border-strong);
  border-bottom: none;
  font-weight: 700;
}

.bang tfoot th {
  text-align: right;
}

.num--no {
  color: var(--color-danger-fg);
  font-weight: 600;
}

.ghi-chu {
  color: var(--color-fg-muted);
  max-width: 24ch;
}
</style>
