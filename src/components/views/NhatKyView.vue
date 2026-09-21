<script setup>
import { computed, ref, watch } from 'vue'
import {
  PhBookOpen,
  PhCaretLeft,
  PhCaretRight,
  PhDownloadSimple,
  PhMagnifyingGlass,
  PhPencilSimple,
  PhPlus,
  PhTrash,
  PhX,
} from '@phosphor-icons/vue'
import { useAuthStore } from '@/stores/authStore'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import { ngayVN, so, tien } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import ConfirmDialog from '@/components/base/ConfirmDialog.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import IconButton from '@/components/base/IconButton.vue'
import SortHeader from '@/components/base/SortHeader.vue'
import StatusBadge from '@/components/base/StatusBadge.vue'
import TrangThaiTai from '@/components/base/TrangThaiTai.vue'
import GiaoDichDialog from '@/components/dialogs/GiaoDichDialog.vue'
import { xuatExcel } from '@/utils/exportExcel'

const auth = useAuthStore()
const congNo = useCongNoStore()
const toast = useToast()

const moForm = ref(false)
const giaoDichDangSua = ref(null)
const giaoDichDangXoa = ref(null)
const dangXuatFile = ref(false)

// --- Lọc ------------------------------------------------------------------
const tuKhoa = ref(congNo.boLoc.tuKhoa)
const tuNgay = ref(congNo.boLoc.tuNgay)
const denNgay = ref(congNo.boLoc.denNgay)
const loiNgay = ref('')

let hoanTimKiem
watch(tuKhoa, (v) => {
  // Chống gọi API mỗi lần gõ phím.
  clearTimeout(hoanTimKiem)
  hoanTimKiem = setTimeout(() => congNo.datBoLoc({ tuKhoa: v }), 200)
})

function apDungNgay() {
  // Cùng quy tắc với macro FilterByDateRange trong file Excel gốc.
  if (tuNgay.value && denNgay.value && tuNgay.value > denNgay.value) {
    loiNgay.value = 'Ngày bắt đầu phải trước ngày kết thúc. Hãy đổi lại một trong hai ô.'
    return
  }
  loiNgay.value = ''
  congNo.datBoLoc({ tuNgay: tuNgay.value, denNgay: denNgay.value })
}

function xoaLoc() {
  tuKhoa.value = ''
  tuNgay.value = ''
  denNgay.value = ''
  loiNgay.value = ''
  congNo.xoaBoLoc()
}

const soHienThi = computed(() => congNo.nhatKy.length)

// --- Thao tác -------------------------------------------------------------
function themMoi() {
  giaoDichDangSua.value = null
  moForm.value = true
}

function sua(gd) {
  giaoDichDangSua.value = { ...gd }
  moForm.value = true
}

async function xacNhanXoa() {
  const banSaoLuu = { ...giaoDichDangXoa.value }
  try {
    await congNo.xoaGiaoDich(banSaoLuu.id)
    giaoDichDangXoa.value = null
    toast.thongTin(`Đã xoá giao dịch của "${banSaoLuu.ten_kh}".`, {
      hanhDong: {
        nhan: 'Hoàn tác',
        chay: async () => {
          try {
            await congNo.hoanTacXoaGiaoDich(banSaoLuu)
            toast.thanhCong('Đã khôi phục giao dịch.')
          } catch (e) {
            toast.loi(e.message)
          }
        },
      },
    })
  } catch (e) {
    toast.loi(e.message)
  }
}

async function xuat() {
  dangXuatFile.value = true
  try {
    const duLieu = await congNo.taiToanBoDeXuat()
    await xuatExcel(duLieu)
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
        <h1>Nhật ký bán hàng</h1>
        <p class="dau-trang__phu">
          {{ congNo.dangLoc ? `Hiển thị ${soHienThi} / ${congNo.tongSoGiaoDich} giao dịch` : `${congNo.tongSoGiaoDich} giao dịch` }}
        </p>
      </div>

      <div class="dau-trang__nut">
        <BaseButton kieu="phu" :dang-tai="dangXuatFile" @click="xuat">
          <PhDownloadSimple :size="18" aria-hidden="true" />
          Xuất Excel
        </BaseButton>
        <!-- CTA chính duy nhất của màn hình này; user chỉ xem nên không thấy -->
        <BaseButton v-if="auth.duocSua" kieu="chinh" @click="themMoi">
          <PhPlus :size="18" aria-hidden="true" />
          Thêm giao dịch
        </BaseButton>
      </div>
    </header>

    <section class="loc" aria-label="Lọc và tìm kiếm">
      <div class="loc__o loc__o--tim">
        <label for="loc-tu-khoa" class="loc__nhan">Tìm kiếm</label>
        <div class="loc__tim">
          <PhMagnifyingGlass :size="18" aria-hidden="true" class="loc__icon" />
          <input
            id="loc-tu-khoa"
            v-model="tuKhoa"
            type="search"
            placeholder="Tên khách, mặt hàng hoặc số điện thoại"
          />
        </div>
      </div>

      <div class="loc__o">
        <label for="loc-tu-ngay" class="loc__nhan">Từ ngày</label>
        <input id="loc-tu-ngay" v-model="tuNgay" type="date" @change="apDungNgay" />
      </div>

      <div class="loc__o">
        <label for="loc-den-ngay" class="loc__nhan">Đến ngày</label>
        <input id="loc-den-ngay" v-model="denNgay" type="date" @change="apDungNgay" />
      </div>

      <BaseButton v-if="congNo.dangLoc" kieu="nhe" co="nho" @click="xoaLoc">
        <PhX :size="16" aria-hidden="true" />
        Xoá bộ lọc
      </BaseButton>
    </section>

    <p v-if="loiNgay" class="loi-ngay" role="alert">{{ loiNgay }}</p>

    <TrangThaiTai
      :dang-tai="congNo.dangTaiNhatKy"
      :loi="congNo.loiNhatKy"
      :co-du-lieu="congNo.nhatKy.length > 0"
      @thu-lai="congNo.taiNhatKy()"
    >
      <EmptyState
        v-if="congNo.nhatKy.length === 0 && congNo.dangLoc"
        :icon="PhMagnifyingGlass"
        tieu-de="Không có giao dịch nào khớp"
        mo-ta="Thử đổi từ khoá hoặc mở rộng khoảng ngày."
      >
        <BaseButton kieu="phu" @click="xoaLoc">Xoá bộ lọc</BaseButton>
      </EmptyState>

      <EmptyState
        v-else-if="congNo.nhatKy.length === 0 && auth.duocSua"
        :icon="PhBookOpen"
        tieu-de="Sổ nhật ký đang trống"
        mo-ta="Bắt đầu bằng cách khai báo danh mục, sau đó ghi giao dịch bán hàng đầu tiên."
      >
        <template #buoc>
          <li>Thêm khách hàng ở tab <strong>Khách hàng</strong></li>
          <li>Thêm mặt hàng ở tab <strong>Mặt hàng</strong></li>
          <li>Quay lại đây và bấm <strong>Thêm giao dịch</strong></li>
        </template>
        <BaseButton kieu="chinh" @click="themMoi">
          <PhPlus :size="18" aria-hidden="true" />
          Thêm giao dịch
        </BaseButton>
      </EmptyState>

      <EmptyState
        v-else-if="congNo.nhatKy.length === 0"
        :icon="PhBookOpen"
        tieu-de="Chưa có giao dịch nào"
        mo-ta="Khi quản trị viên ghi giao dịch, chúng sẽ hiện ở đây."
      />

      <template v-else>
        <!-- ≥768px: bảng. Nhỏ hơn: danh sách thẻ, không bắt cuộn ngang. -->
        <div class="bang-bao">
          <table class="bang">
            <caption class="sr-only">
              Sổ nhật ký bán hàng, sắp xếp theo {{ congNo.sapXep.cot }}
            </caption>
            <thead>
              <tr>
                <th scope="col" class="th--stt">STT</th>
                <SortHeader
                  cot="ngay"
                  nhan="Ngày"
                  :sap-xep="congNo.sapXep"
                  @sap-xep="congNo.doiSapXep"
                />
                <SortHeader
                  cot="ten_kh"
                  nhan="Khách hàng"
                  :sap-xep="congNo.sapXep"
                  @sap-xep="congNo.doiSapXep"
                />
                <th scope="col">Mặt hàng</th>
                <th scope="col" class="th--phai">SL</th>
                <th scope="col" class="th--phai">Đơn giá</th>
                <th scope="col" class="th--phai">Thành tiền</th>
                <th scope="col" class="th--phai">Đã thanh toán</th>
                <SortHeader
                  cot="con_no"
                  nhan="Còn nợ"
                  can-phai
                  :sap-xep="congNo.sapXep"
                  @sap-xep="congNo.doiSapXep"
                />
                <th scope="col">Trạng thái</th>
                <th v-if="auth.duocSua" scope="col"><span class="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(gd, i) in congNo.nhatKy" :key="gd.id">
                <td class="num td--stt">{{ (congNo.trang - 1) * congNo.soDongMoiTrang + i + 1 }}</td>
                <td class="num">{{ ngayVN(gd.ngay) }}</td>
                <td class="wrap-anywhere">
                  <span class="ten">{{ gd.ten_kh }}</span>
                  <span v-if="gd.sdt" class="sdt">{{ gd.sdt }}</span>
                </td>
                <td class="wrap-anywhere">{{ gd.mat_hang }}</td>
                <td class="num">{{ so(gd.so_luong) }}</td>
                <td class="num">{{ tien(gd.don_gia) }}</td>
                <td class="num">{{ tien(gd.thanh_tien) }}</td>
                <td class="num">{{ tien(gd.da_thanh_toan) }}</td>
                <td class="num" :class="{ 'num--no': Number(gd.con_no) > 0 }">
                  {{ tien(gd.con_no) }}
                </td>
                <td>
                  <StatusBadge :loai="Number(gd.con_no) > 0 ? 'con-no' : 'da-tra'" />
                </td>
                <td v-if="auth.duocSua" class="td--thao-tac">
                  <!-- Bọc trong div: đặt display:flex thẳng lên <td> làm ô mất
                       tư cách table-cell và đường kẻ hàng bị đứt quãng. -->
                  <div class="thao-tac">
                    <IconButton :nhan="`Sửa giao dịch của ${gd.ten_kh} ngày ${ngayVN(gd.ngay)}`" @click="sua(gd)">
                      <PhPencilSimple :size="18" aria-hidden="true" />
                    </IconButton>
                    <IconButton
                      nguy-hiem
                      :nhan="`Xoá giao dịch của ${gd.ten_kh} ngày ${ngayVN(gd.ngay)}`"
                      @click="giaoDichDangXoa = gd"
                    >
                      <PhTrash :size="18" aria-hidden="true" />
                    </IconButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="the-ds">
          <li v-for="gd in congNo.nhatKy" :key="gd.id" class="the">
            <div class="the__dau">
              <div>
                <p class="the__ten wrap-anywhere">{{ gd.ten_kh }}</p>
                <p class="the__ngay">{{ ngayVN(gd.ngay) }}<span v-if="gd.sdt"> · {{ gd.sdt }}</span></p>
              </div>
              <StatusBadge :loai="Number(gd.con_no) > 0 ? 'con-no' : 'da-tra'" />
            </div>

            <p class="the__hang wrap-anywhere">
              {{ gd.mat_hang }} · {{ so(gd.so_luong) }} × {{ tien(gd.don_gia) }}
            </p>

            <dl class="the__so">
              <div><dt>Thành tiền</dt><dd class="num">{{ tien(gd.thanh_tien) }}</dd></div>
              <div><dt>Đã thanh toán</dt><dd class="num">{{ tien(gd.da_thanh_toan) }}</dd></div>
              <div>
                <dt>Còn nợ</dt>
                <dd class="num" :class="{ 'num--no': Number(gd.con_no) > 0 }">{{ tien(gd.con_no) }}</dd>
              </div>
            </dl>

            <div v-if="auth.duocSua" class="the__thao-tac">
              <IconButton :nhan="`Sửa giao dịch của ${gd.ten_kh} ngày ${ngayVN(gd.ngay)}`" @click="sua(gd)">
                <PhPencilSimple :size="18" aria-hidden="true" />
              </IconButton>
              <IconButton
                nguy-hiem
                :nhan="`Xoá giao dịch của ${gd.ten_kh} ngày ${ngayVN(gd.ngay)}`"
                @click="giaoDichDangXoa = gd"
              >
                <PhTrash :size="18" aria-hidden="true" />
              </IconButton>
            </div>
          </li>
        </ul>

        <nav v-if="congNo.tongSoTrang > 1" class="phan-trang" aria-label="Phân trang">
          <BaseButton
            kieu="phu"
            co="nho"
            :disabled="congNo.trang <= 1"
            @click="congNo.doiTrang(congNo.trang - 1)"
          >
            <PhCaretLeft :size="16" aria-hidden="true" />
            Trước
          </BaseButton>
          <p class="phan-trang__chu" aria-live="polite">
            Trang {{ congNo.trang }} / {{ congNo.tongSoTrang }}
          </p>
          <BaseButton
            kieu="phu"
            co="nho"
            :disabled="congNo.trang >= congNo.tongSoTrang"
            @click="congNo.doiTrang(congNo.trang + 1)"
          >
            Sau
            <PhCaretRight :size="16" aria-hidden="true" />
          </BaseButton>
        </nav>
      </template>
    </TrangThaiTai>

    <GiaoDichDialog v-if="auth.duocSua" :mo="moForm" :ban-ghi="giaoDichDangSua" @dong="moForm = false" />

    <ConfirmDialog
      :mo="Boolean(giaoDichDangXoa)"
      tieu-de="Xoá giao dịch?"
      :noi-dung="
        giaoDichDangXoa
          ? `Xoá giao dịch ${giaoDichDangXoa.mat_hang} của ${giaoDichDangXoa.ten_kh} ngày ${ngayVN(giaoDichDangXoa.ngay)}? Bảng tổng hợp sẽ được tính lại.`
          : ''
      "
      canh-bao="Bạn vẫn có thể hoàn tác ngay sau khi xoá."
      @dong="giaoDichDangXoa = null"
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

.dau-trang__nut {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

/* --- Bộ lọc --- */
.loc {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
  padding: var(--space-3);
  margin-bottom: var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.loc__o {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.loc__o--tim {
  flex: 1 1 260px;
}

.loc__nhan {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-fg-muted);
}

.loc__tim {
  position: relative;
  display: flex;
}

.loc__icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-fg-subtle);
  pointer-events: none;
}

/* Chừa chỗ cho icon kính lúp nằm chồng lên ô */
.loc__tim input {
  padding-left: 36px;
}

.loi-ngay {
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background: var(--color-danger-subtle);
  color: var(--color-danger-fg);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-weight: 500;
}

/* --- Bảng (≥768px) --- */
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

.bang :deep(th) {
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

.bang :deep(.th--phai) {
  text-align: right;
}

.bang td {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

.bang tbody tr:last-child td {
  border-bottom: none;
}

.bang tbody tr:hover {
  background: var(--color-surface-hover);
}

.th--stt,
.td--stt {
  width: 56px;
  color: var(--color-fg-subtle);
}

.ten {
  display: block;
  font-weight: 500;
}

.sdt {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
  font-family: var(--font-mono);
}

/* Màu chỉ là lớp nhấn thêm — cột Trạng thái mới là thứ mang thông tin */
.num--no {
  color: var(--color-danger-fg);
  font-weight: 600;
}

.td--thao-tac {
  width: 1%; /* co lại vừa đủ hai nút */
}

.thao-tac {
  display: flex;
  gap: var(--space-1);
  justify-content: flex-end;
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
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.the__dau {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
}

.the__ten {
  font-weight: 600;
}

.the__ngay {
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

.the__hang {
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
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

.the__thao-tac {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

@media (min-width: 768px) {
  .bang-bao {
    display: block;
  }
  .the-ds {
    display: none;
  }
}

/* --- Phân trang --- */
.phan-trang {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
}

.phan-trang__chu {
  font-size: var(--text-sm);
  color: var(--color-fg-muted);
}
</style>
