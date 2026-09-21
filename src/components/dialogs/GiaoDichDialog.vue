<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useCongNoStore } from '@/stores/congNoStore'
import { useToast } from '@/composables/useToast'
import { homNayISO, phanTichSo, tien } from '@/utils/format'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseField from '@/components/base/BaseField.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import ComboBox from '@/components/base/ComboBox.vue'
import ErrorSummary from '@/components/base/ErrorSummary.vue'
import StatusBadge from '@/components/base/StatusBadge.vue'

/**
 * Thay cho UserForm `frmNhapLieu` trong file Excel.
 *
 * Giữ nguyên thứ tự và nội dung kiểm tra dữ liệu của sheet `Msg` (chỉ viết lại
 * có dấu và bổ sung cách khắc phục), giữ hành vi tự điền SĐT / đơn giá, và giữ
 * thói quen "lưu xong form vẫn mở để nhập tiếp".
 */
const props = defineProps({
  mo: { type: Boolean, required: true },
  /** null = thêm mới, object = sửa một dòng đã có. */
  banGhi: { type: Object, default: null },
})

const emit = defineEmits(['dong'])

const congNo = useCongNoStore()
const toast = useToast()

const ID = {
  tenKH: 'gd-ten-kh',
  sdt: 'gd-sdt',
  matHang: 'gd-mat-hang',
  ngay: 'gd-ngay',
  soLuong: 'gd-so-luong',
  donGia: 'gd-don-gia',
  daThanhToan: 'gd-da-thanh-toan',
  ghiChu: 'gd-ghi-chu',
}

function formTrong() {
  return {
    ten_kh: '',
    sdt: '',
    mat_hang: '',
    ngay: homNayISO(),
    so_luong: '',
    don_gia: '',
    da_thanh_toan: '0',
    ghi_chu: '',
  }
}

const form = reactive(formTrong())
const loi = reactive({})
/** Lỗi do máy chủ trả về (RLS từ chối, mất mạng…), tách khỏi lỗi nhập liệu. */
const loiMayChu = ref('')
const dangLuu = ref(false)
const daChinhSua = ref(false)
const oTenKH = ref(null)

const dangSua = computed(() => Boolean(props.banGhi?.id))

// Danh sách cho combobox; `phu` hiện ở cột phải để chọn nhanh hơn.
const dsKhachHang = computed(() =>
  congNo.khachHang.map((k) => ({ id: k.id, ten: k.ten, phu: k.sdt ?? '' })),
)
const dsMatHang = computed(() =>
  congNo.matHang.map((m) => ({
    id: m.id,
    ten: m.ten,
    phu: `${tien(m.don_gia)}₫${m.dvt ? ` / ${m.dvt}` : ''}`,
  })),
)

// --- Xem trước tính toán (file Excel gốc không có) ------------------------
const thanhTien = computed(() => {
  const sl = phanTichSo(form.so_luong)
  const dg = phanTichSo(form.don_gia)
  return Number.isFinite(sl) && Number.isFinite(dg) ? sl * dg : 0
})

const conNo = computed(() => {
  const dtt = phanTichSo(form.da_thanh_toan)
  return thanhTien.value - (Number.isFinite(dtt) ? dtt : 0)
})

// --- Nạp dữ liệu khi mở ---------------------------------------------------
watch(
  () => props.mo,
  (mo) => {
    if (!mo) return
    Object.assign(form, formTrong())
    if (props.banGhi) {
      Object.assign(form, {
        ten_kh: props.banGhi.ten_kh ?? '',
        sdt: props.banGhi.sdt ?? '',
        mat_hang: props.banGhi.mat_hang ?? '',
        ngay: props.banGhi.ngay ?? homNayISO(),
        so_luong: String(props.banGhi.so_luong ?? ''),
        don_gia: String(props.banGhi.don_gia ?? ''),
        da_thanh_toan: String(props.banGhi.da_thanh_toan ?? '0'),
        ghi_chu: props.banGhi.ghi_chu ?? '',
      })
    }
    for (const k of Object.keys(loi)) delete loi[k]
    loiMayChu.value = ''
    daChinhSua.value = false
  },
)

watch(
  () => ({ ...form }),
  () => {
    daChinhSua.value = true
  },
  { deep: true },
)

// --- Tự điền (port cboTenKH_Change / cboMatHang_Change) -------------------
function chonKhach(muc) {
  const kh = congNo.timKhachHang(muc.ten)
  if (kh?.sdt) form.sdt = kh.sdt
}

function chonMatHang(muc) {
  const mh = congNo.timMatHang(muc.ten)
  if (mh) form.don_gia = String(mh.don_gia)
}

// Người dùng gõ tay đúng tên có sẵn (không bấm chọn) thì cũng tự điền.
watch(
  () => form.ten_kh,
  (v) => {
    const kh = congNo.timKhachHang(v)
    if (kh?.sdt) form.sdt = kh.sdt
  },
)

watch(
  () => form.mat_hang,
  (v) => {
    const mh = congNo.timMatHang(v)
    if (mh) form.don_gia = String(mh.don_gia)
  },
)

// --- Kiểm tra dữ liệu -----------------------------------------------------
// Thứ tự dưới đây khớp chính xác btnLuu_Click trong VBA và sheet Msg.
const QUY_TAC = [
  {
    khoa: 'ten_kh',
    id: ID.tenKH,
    kiemTra: () =>
      form.ten_kh.trim() ? '' : 'Vui lòng chọn hoặc nhập Tên khách hàng.',
  },
  {
    khoa: 'mat_hang',
    id: ID.matHang,
    kiemTra: () => (form.mat_hang.trim() ? '' : 'Vui lòng chọn hoặc nhập Mặt hàng.'),
  },
  {
    khoa: 'ngay',
    id: ID.ngay,
    kiemTra: () =>
      form.ngay && !Number.isNaN(Date.parse(form.ngay))
        ? ''
        : 'Ngày bán không hợp lệ. Hãy chọn một ngày từ lịch.',
  },
  {
    khoa: 'so_luong',
    id: ID.soLuong,
    kiemTra: () => {
      const n = phanTichSo(form.so_luong)
      if (!Number.isFinite(n)) return 'Số lượng phải là số. Ví dụ: 10 hoặc 2,5.'
      return n > 0 ? '' : 'Số lượng phải lớn hơn 0.'
    },
  },
  {
    khoa: 'don_gia',
    id: ID.donGia,
    kiemTra: () => {
      const n = phanTichSo(form.don_gia)
      if (!Number.isFinite(n)) return 'Đơn giá phải là số. Ví dụ: 25000.'
      return n >= 0 ? '' : 'Đơn giá không được âm.'
    },
  },
  {
    khoa: 'da_thanh_toan',
    id: ID.daThanhToan,
    kiemTra: () => {
      // VBA coi ô trống là 0; giữ nguyên hành vi đó.
      if (String(form.da_thanh_toan).trim() === '') return ''
      const n = phanTichSo(form.da_thanh_toan)
      if (!Number.isFinite(n)) return 'Số tiền đã thanh toán phải là số. Ví dụ: 100000.'
      return n >= 0 ? '' : 'Số tiền đã thanh toán không được âm.'
    },
  },
]

// Kiểm tra khi rời ô, không phải mỗi lần gõ phím (tránh báo lỗi khi người
// dùng mới gõ được nửa chừng).
function roiO(khoa) {
  const quyTac = QUY_TAC.find((q) => q.khoa === khoa)
  if (quyTac) loi[khoa] = quyTac.kiemTra()
}

// Ngoại lệ: ô nào ĐANG báo lỗi thì kiểm tra lại ngay khi gõ, để thông báo
// biến mất đúng lúc người dùng vừa sửa xong thay vì phải rời ô mới hết.
watch(
  () => ({ ...form }),
  () => {
    for (const q of QUY_TAC) {
      if (loi[q.khoa]) loi[q.khoa] = q.kiemTra()
    }
  },
  { deep: true },
)

// Bảng tóm tắt bám theo trạng thái lỗi hiện tại, nên các dòng đã sửa xong sẽ
// tự rời khỏi danh sách.
const danhSachLoi = computed(() => {
  const ds = QUY_TAC.filter((q) => loi[q.khoa]).map((q) => ({ id: q.id, chu: loi[q.khoa] }))
  if (loiMayChu.value) ds.push({ id: ID.tenKH, chu: loiMayChu.value })
  return ds
})

async function luu() {
  loiMayChu.value = ''
  for (const q of QUY_TAC) loi[q.khoa] = q.kiemTra()
  if (danhSachLoi.value.length) return

  dangLuu.value = true
  try {
    await congNo.luuGiaoDich({
      id: props.banGhi?.id,
      ngay: form.ngay,
      ten_kh: form.ten_kh,
      sdt: form.sdt,
      mat_hang: form.mat_hang,
      so_luong: phanTichSo(form.so_luong),
      don_gia: phanTichSo(form.don_gia),
      da_thanh_toan: String(form.da_thanh_toan).trim() === '' ? 0 : phanTichSo(form.da_thanh_toan),
      ghi_chu: form.ghi_chu,
    })

    if (dangSua.value) {
      toast.thanhCong('Đã cập nhật giao dịch.')
      emit('dong')
      return
    }

    // Thêm mới: giữ hộp thoại mở, xoá trắng và đưa con trỏ về ô đầu tiên —
    // đúng như btnLuu_Click làm, để nhập nhiều giao dịch liên tiếp.
    toast.thanhCong('Đã lưu giao dịch thành công!')
    Object.assign(form, formTrong())
    for (const k of Object.keys(loi)) delete loi[k]
    await nextTick()
    daChinhSua.value = false
    document.getElementById(ID.tenKH)?.focus()
  } catch (e) {
    loiMayChu.value = e.message
  } finally {
    dangLuu.value = false
  }
}
</script>

<template>
  <BaseModal
    :mo="mo"
    :tieu-de="dangSua ? 'Sửa giao dịch' : 'Thêm giao dịch bán hàng'"
    :mo-ta="dangSua ? '' : 'Lưu xong hộp thoại vẫn mở để bạn nhập tiếp giao dịch sau.'"
    rong="640px"
    :can-xac-nhan-dong="daChinhSua && !dangLuu"
    @dong="emit('dong')"
  >
    <form id="form-giao-dich" novalidate @submit.prevent="luu">
      <ErrorSummary :loi="danhSachLoi" />

      <div class="luoi">
        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          class="o--rong"
          nhan="Tên khách hàng"
          :id-truong="ID.tenKH"
          bat-buoc
          goi-y="Chọn từ danh sách hoặc gõ tên khách mới."
          :loi="loi.ten_kh"
        >
          <ComboBox
            ref="oTenKH"
            v-model="form.ten_kh"
            :id="id"
            :danh-sach="dsKhachHang"
            :mo-ta-boi="moTaBoi"
            :co-loi="coLoi"
            nhan-tao-moi="Dùng tên mới"
            @chon="chonKhach"
            @blur="roiO('ten_kh')"
          />
        </BaseField>

        <BaseField v-slot="{ id, moTaBoi }" nhan="Số điện thoại" :id-truong="ID.sdt">
          <input
            :id="id"
            v-model="form.sdt"
            type="tel"
            inputmode="tel"
            autocomplete="tel"
            :aria-describedby="moTaBoi"
          />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Ngày bán"
          :id-truong="ID.ngay"
          bat-buoc
          :loi="loi.ngay"
        >
          <input
            :id="id"
            v-model="form.ngay"
            type="date"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="roiO('ngay')"
          />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          class="o--rong"
          nhan="Mặt hàng"
          :id-truong="ID.matHang"
          bat-buoc
          goi-y="Chọn mặt hàng để tự điền đơn giá, hoặc gõ tên mới."
          :loi="loi.mat_hang"
        >
          <ComboBox
            v-model="form.mat_hang"
            :id="id"
            :danh-sach="dsMatHang"
            :mo-ta-boi="moTaBoi"
            :co-loi="coLoi"
            nhan-tao-moi="Dùng mặt hàng mới"
            @chon="chonMatHang"
            @blur="roiO('mat_hang')"
          />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Số lượng"
          :id-truong="ID.soLuong"
          bat-buoc
          :loi="loi.so_luong"
        >
          <input
            :id="id"
            v-model="form.so_luong"
            type="text"
            inputmode="decimal"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="roiO('so_luong')"
          />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Đơn giá"
          :id-truong="ID.donGia"
          bat-buoc
          :loi="loi.don_gia"
        >
          <input
            :id="id"
            v-model="form.don_gia"
            type="text"
            inputmode="numeric"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="roiO('don_gia')"
          />
        </BaseField>

        <BaseField
          v-slot="{ id, moTaBoi, coLoi }"
          nhan="Đã thanh toán"
          :id-truong="ID.daThanhToan"
          goi-y="Để trống hoặc 0 nếu khách chưa trả."
          :loi="loi.da_thanh_toan"
        >
          <input
            :id="id"
            v-model="form.da_thanh_toan"
            type="text"
            inputmode="numeric"
            :aria-invalid="coLoi || undefined"
            :aria-describedby="moTaBoi"
            @blur="roiO('da_thanh_toan')"
          />
        </BaseField>

        <BaseField v-slot="{ id, moTaBoi }" class="o--rong" nhan="Ghi chú" :id-truong="ID.ghiChu">
          <textarea :id="id" v-model="form.ghi_chu" rows="2" :aria-describedby="moTaBoi" />
        </BaseField>
      </div>

      <!--
        Xem trước realtime: người dùng thấy ngay con số trước khi lưu, thứ mà
        UserForm trong Excel không làm được.
      -->
      <div class="xem-truoc" aria-live="polite">
        <div class="xem-truoc__o">
          <span class="xem-truoc__nhan">Thành tiền</span>
          <span class="xem-truoc__gt num">{{ tien(thanhTien) }}₫</span>
        </div>
        <div class="xem-truoc__o">
          <span class="xem-truoc__nhan">Còn nợ</span>
          <span class="xem-truoc__gt num" :class="{ 'xem-truoc__gt--no': conNo > 0 }">
            {{ tien(conNo) }}₫
          </span>
        </div>
        <StatusBadge :loai="conNo > 0 ? 'con-no' : 'da-tra'" />
      </div>
    </form>

    <template #chan>
      <BaseButton kieu="phu" @click="emit('dong')">{{ dangSua ? 'Huỷ' : 'Đóng' }}</BaseButton>
      <BaseButton type="submit" form="form-giao-dich" kieu="chinh" :dang-tai="dangLuu">
        {{ dangSua ? 'Lưu thay đổi' : 'Lưu giao dịch' }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.luoi {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 560px) {
  .luoi {
    grid-template-columns: 1fr 1fr;
  }

  .o--rong {
    grid-column: 1 / -1;
  }
}

.xem-truoc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-5);
  padding: var(--space-3) var(--space-4);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.xem-truoc__o {
  display: flex;
  flex-direction: column;
}

.xem-truoc__nhan {
  font-size: var(--text-xs);
  color: var(--color-fg-subtle);
}

.xem-truoc__gt {
  font-size: var(--text-lg);
  font-weight: 600;
  text-align: left;
}

.xem-truoc__gt--no {
  color: var(--color-danger-fg);
}
</style>
