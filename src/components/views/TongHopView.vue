<script setup>
import { ref } from 'vue'
import {
  PhCaretRight,
  PhCoins,
  PhDownloadSimple,
  PhHandCoins,
  PhUsers,
  PhWallet,
  PhWarningCircle,
} from '@phosphor-icons/vue'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import { tien } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import StatTile from '@/components/base/StatTile.vue'
import StatusBadge from '@/components/base/StatusBadge.vue'
import TrangThaiTai from '@/components/base/TrangThaiTai.vue'
import ChiTietKhachDialog from '@/components/dialogs/ChiTietKhachDialog.vue'
import { xuatExcel } from '@/utils/exportExcel'

const congNo = useCongNoStore()
const toast = useToast()

const khachDangXem = ref(null)
const dangXuatFile = ref(false)

async function xuat() {
  dangXuatFile.value = true
  try {
    await xuatExcel(await congNo.taiToanBoDeXuat())
    toast.thanhCong('Đã tải file Excel về máy.')
  } catch (e) {
    toast.loi(e.message)
  } finally {
    dangXuatFile.value = false
  }
}
</script>

<template>
  <div>
    <header class="dau-trang">
      <div>
        <h1>Tổng hợp công nợ</h1>
        <p class="dau-trang__phu">Cộng theo từng khách hàng, không phân biệt hoa thường.</p>
      </div>
      <BaseButton kieu="phu" :dang-tai="dangXuatFile" @click="xuat">
        <PhDownloadSimple :size="18" aria-hidden="true" />
        Xuất Excel
      </BaseButton>
    </header>

    <div class="o-so">
      <StatTile nhan="Tổng tiền bán" :gia-tri="congNo.chiSoTongHop.tongBan" :icon="PhCoins" />
      <StatTile nhan="Tổng đã thu" :gia-tri="congNo.chiSoTongHop.tongThu" :icon="PhHandCoins" />
      <StatTile
        nhan="Tổng còn nợ"
        :gia-tri="congNo.chiSoTongHop.conNo"
        :icon="PhWarningCircle"
        nhan-manh="canh-bao"
      />
      <StatTile
        nhan="Khách còn nợ"
        :gia-tri="congNo.chiSoTongHop.soKhachConNo"
        :icon="PhUsers"
        :la-tien="false"
      />
    </div>

    <TrangThaiTai
      :dang-tai="congNo.dangTaiTongHop"
      :loi="congNo.loiTongHop"
      :co-du-lieu="congNo.tongHop.length > 0"
      @thu-lai="congNo.taiTongHop()"
    >
      <EmptyState
        v-if="congNo.tongHop.length === 0"
        :icon="PhWallet"
        tieu-de="Chưa có dữ liệu tổng hợp"
        mo-ta="Bảng này tự động cộng từ sổ nhật ký. Hãy ghi giao dịch đầu tiên ở tab Nhật ký."
      >
        <BaseButton kieu="phu" @click="$router.push({ name: 'nhat-ky' })">
          Tới sổ nhật ký
        </BaseButton>
      </EmptyState>

      <template v-else>
        <div class="bang-bao">
          <table class="bang">
            <caption class="sr-only">
              Tổng hợp công nợ theo khách hàng, sắp xếp giảm dần theo số còn nợ
            </caption>
            <thead>
              <tr>
                <th scope="col">Tên khách hàng</th>
                <th scope="col">Số điện thoại</th>
                <th scope="col" class="th--phai">Số giao dịch</th>
                <th scope="col" class="th--phai">Tổng tiền bán</th>
                <th scope="col" class="th--phai">Tổng đã thu</th>
                <th scope="col" class="th--phai">Còn nợ</th>
                <th scope="col">Trạng thái</th>
                <th scope="col"><span class="sr-only">Xem chi tiết</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="kh in congNo.tongHop" :key="kh.kh_key">
                <td class="wrap-anywhere ten">{{ kh.ten_kh }}</td>
                <td class="num sdt">{{ kh.sdt || '—' }}</td>
                <td class="num">{{ kh.so_giao_dich }}</td>
                <td class="num">{{ tien(kh.tong_ban) }}</td>
                <td class="num">{{ tien(kh.tong_thu) }}</td>
                <td class="num" :class="{ 'num--no': Number(kh.con_no) > 0 }">
                  {{ tien(kh.con_no) }}
                </td>
                <td><StatusBadge :loai="Number(kh.con_no) > 0 ? 'con-no' : 'da-tra'" /></td>
                <td class="td--xem">
                  <button type="button" class="nut-xem" @click="khachDangXem = kh">
                    Chi tiết
                    <PhCaretRight :size="14" aria-hidden="true" />
                    <span class="sr-only">giao dịch của {{ kh.ten_kh }}</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="the-ds">
          <li v-for="kh in congNo.tongHop" :key="kh.kh_key">
            <button type="button" class="the" @click="khachDangXem = kh">
              <div class="the__dau">
                <div class="the__ten-khu">
                  <p class="the__ten wrap-anywhere">{{ kh.ten_kh }}</p>
                  <p v-if="kh.sdt" class="the__sdt">{{ kh.sdt }}</p>
                </div>
                <StatusBadge :loai="Number(kh.con_no) > 0 ? 'con-no' : 'da-tra'" />
              </div>
              <dl class="the__so">
                <div><dt>Tổng bán</dt><dd class="num">{{ tien(kh.tong_ban) }}</dd></div>
                <div><dt>Đã thu</dt><dd class="num">{{ tien(kh.tong_thu) }}</dd></div>
                <div>
                  <dt>Còn nợ</dt>
                  <dd class="num" :class="{ 'num--no': Number(kh.con_no) > 0 }">
                    {{ tien(kh.con_no) }}
                  </dd>
                </div>
              </dl>
            </button>
          </li>
        </ul>
      </template>
    </TrangThaiTai>

    <ChiTietKhachDialog
      :mo="Boolean(khachDangXem)"
      :khach="khachDangXem"
      @dong="khachDangXem = null"
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

.o-so {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-3);
  margin-bottom: var(--space-5);
}

.bang-bao {
  display: none;
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
  position: sticky;
  top: 0;
  z-index: 1;
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

.sdt {
  color: var(--color-fg-muted);
}

.num--no {
  color: var(--color-danger-fg);
  font-weight: 600;
}

.td--xem {
  text-align: right;
}

.nut-xem {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  min-height: 32px;
  padding: 0 var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-accent);
}

.nut-xem:hover {
  background: var(--color-accent-subtle);
}

/* --- Thẻ (<768px) --- */
.the-ds {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.the {
  display: block;
  width: 100%;
  padding: var(--space-3);
  text-align: left;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.the:hover {
  background: var(--color-surface-hover);
}

.the__dau {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.the__ten-khu {
  min-width: 0;
}

.the__ten {
  font-weight: 600;
}

.the__sdt {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

.the__so {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
  margin: var(--space-3) 0 0;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.the__so dt {
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

.the__so dd {
  margin: 0;
  text-align: left;
  font-size: var(--text-sm);
  font-weight: 600;
}

@media (min-width: 768px) {
  .bang-bao {
    display: block;
  }
  .the-ds {
    display: none;
  }
}
</style>
