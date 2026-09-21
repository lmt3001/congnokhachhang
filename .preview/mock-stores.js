/* CHỈ DÙNG ĐỂ XEM TRƯỚC GIAO DIỆN — thay cho @/stores/congNoStore.
   Dữ liệu mẫu lấy đúng từ CongNoKhachHang.xlsm để đối chiếu bằng mắt.       */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const KH = [
  { id: 'k1', ten: 'Nguyễn Văn An', sdt: '0901234567', dia_chi: '12 Lê Lợi, Q1, TP.HCM', ghi_chu: 'Khách quen' },
  { id: 'k2', ten: 'Trần Thị Bích', sdt: '0912345678', dia_chi: '45 Nguyễn Trãi, Q5, TP.HCM', ghi_chu: null },
  { id: 'k3', ten: 'Lê Văn Cường', sdt: '0923456789', dia_chi: '78 Hai Bà Trưng, Q3, TP.HCM', ghi_chu: null },
  { id: 'k4', ten: 'Phạm Thị Dung', sdt: '0934567890', dia_chi: '23 Cách Mạng Tháng 8, Q10, TP.HCM', ghi_chu: null },
  { id: 'k5', ten: 'Hoàng Văn Em', sdt: '0945678901', dia_chi: '9 Điện Biên Phủ, Bình Thạnh, TP.HCM', ghi_chu: null },
]

const MH = [
  { id: 'm1', ten: 'Gạo ST25', dvt: 'kg', don_gia: 25000 },
  { id: 'm2', ten: 'Nước mắm Phú Quốc', dvt: 'chai', don_gia: 45000 },
  { id: 'm3', ten: 'Dầu ăn Simply', dvt: 'lít', don_gia: 52000 },
  { id: 'm4', ten: 'Đường cát trắng', dvt: 'kg', don_gia: 22000 },
  { id: 'm5', ten: 'Mì gói Hảo Hảo', dvt: 'thùng', don_gia: 120000 },
]

const THO = [
  ['2026-07-15', 'Nguyễn Văn An', '0901234567', 'Gạo ST25', 10, 25000, 250000, 'Thanh toán đủ'],
  ['2026-07-20', 'Trần Thị Bích', '0912345678', 'Nước mắm Phú Quốc', 5, 45000, 100000, ''],
  ['2026-07-28', 'Lê Văn Cường', '0923456789', 'Dầu ăn Simply', 8, 52000, 200000, ''],
  ['2026-08-12', 'Phạm Thị Dung', '0934567890', 'Đường cát trắng', 20, 22000, 440000, 'Thanh toán đủ'],
  ['2026-08-19', 'Hoàng Văn Em', '0945678901', 'Mì gói Hảo Hảo', 3, 120000, 0, ''],
  ['2026-08-25', 'Nguyễn Văn An', '0901234567', 'Mì gói Hảo Hảo', 2, 120000, 100000, ''],
  ['2026-09-02', 'Trần Thị Bích', '0912345678', 'Gạo ST25', 15, 25000, 375000, 'Thanh toán đủ'],
  ['2026-09-18', 'Thọ', '0912345678', 'Nước mắm Phú Quốc', 2, 45000, 0, 'Khách vãng lai'],
]

const NK = THO.map(([ngay, ten_kh, sdt, mat_hang, so_luong, don_gia, da_thanh_toan, ghi_chu], i) => ({
  id: `g${i}`,
  ngay,
  ten_kh,
  sdt,
  mat_hang,
  so_luong,
  don_gia,
  da_thanh_toan,
  ghi_chu,
  thanh_tien: so_luong * don_gia,
  con_no: so_luong * don_gia - da_thanh_toan,
}))

const TH = Object.values(
  NK.reduce((acc, g) => {
    const k = g.ten_kh.toLowerCase()
    acc[k] ??= { kh_key: k, ten_kh: g.ten_kh, sdt: g.sdt, so_giao_dich: 0, tong_ban: 0, tong_thu: 0, con_no: 0 }
    acc[k].so_giao_dich++
    acc[k].tong_ban += g.thanh_tien
    acc[k].tong_thu += g.da_thanh_toan
    acc[k].con_no += g.con_no
    return acc
  }, {}),
).sort((a, b) => b.con_no - a.con_no)

export const useCongNoStore = defineStore('congNo', () => {
  const khachHang = ref(KH)
  const matHang = ref(MH)
  const nhatKy = ref(NK)
  const tongHop = ref(TH)
  const boLoc = ref({ tuKhoa: '', tuNgay: '', denNgay: '' })
  const sapXep = ref({ cot: 'ngay', giamDan: true })

  const chiSoTongHop = computed(() => {
    const tongBan = TH.reduce((s, r) => s + r.tong_ban, 0)
    const tongThu = TH.reduce((s, r) => s + r.tong_thu, 0)
    return { tongBan, tongThu, conNo: tongBan - tongThu, soKhachConNo: TH.filter((r) => r.con_no > 0).length }
  })

  const khong = () => Promise.resolve()

  return {
    khachHang, matHang, nhatKy, tongHop, boLoc, sapXep, chiSoTongHop,
    tongSoGiaoDich: ref(NK.length),
    dangTaiDanhMuc: ref(false), dangTaiNhatKy: ref(false), dangTaiTongHop: ref(false),
    loiDanhMuc: ref(''), loiNhatKy: ref(''), loiTongHop: ref(''),
    trang: ref(1), soDongMoiTrang: 50, tongSoTrang: computed(() => 1), dangLoc: computed(() => false),
    taiDanhMuc: khong, taiNhatKy: khong, taiTongHop: khong, taiTatCa: khong,
    timKhachHang: (t) => KH.find((k) => k.ten.toLowerCase() === String(t).trim().toLowerCase()) ?? null,
    timMatHang: (t) => MH.find((m) => m.ten.toLowerCase() === String(t).trim().toLowerCase()) ?? null,
    luuKhachHang: khong, xoaKhachHang: khong, luuMatHang: khong, xoaMatHang: khong,
    demGiaoDichTheoTen: () => Promise.resolve(3),
    datBoLoc: khong, xoaBoLoc: khong, doiSapXep: khong, doiTrang: khong,
    luuGiaoDich: khong, xoaGiaoDich: khong, hoanTacXoaGiaoDich: khong,
    taiGiaoDichCuaKhach: (ten) => Promise.resolve(NK.filter((g) => g.ten_kh === ten)),
    taiToanBoDeXuat: () => Promise.resolve({ khachHang: KH, matHang: MH, nhatKy: NK, tongHop: TH }),
    batRealtime() {}, tatRealtime() {}, datLai() {},
  }
})
