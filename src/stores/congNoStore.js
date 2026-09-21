import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { moTaLoi, supabase } from '@/lib/supabase'
import { khoaTen } from '@/utils/format'

/**
 * Dữ liệu nghiệp vụ: danh mục khách hàng, mặt hàng, sổ nhật ký và bảng tổng hợp.
 *
 * Danh mục (khách hàng / mặt hàng) được tải toàn bộ vì số lượng nhỏ và cần cho
 * combobox. Sổ nhật ký thì lọc + phân trang phía máy chủ.
 */
export const useCongNoStore = defineStore('congNo', () => {
  // --- Danh mục -----------------------------------------------------------
  const khachHang = ref([])
  const matHang = ref([])
  const dangTaiDanhMuc = ref(false)
  const loiDanhMuc = ref('')

  // --- Sổ nhật ký ---------------------------------------------------------
  const nhatKy = ref([])
  const tongSoGiaoDich = ref(0)
  const dangTaiNhatKy = ref(false)
  const loiNhatKy = ref('')

  const boLoc = ref({ tuKhoa: '', tuNgay: '', denNgay: '' })
  const sapXep = ref({ cot: 'ngay', giamDan: true })
  const trang = ref(1)
  const soDongMoiTrang = 50

  // --- Tổng hợp -----------------------------------------------------------
  const tongHop = ref([])
  const dangTaiTongHop = ref(false)
  const loiTongHop = ref('')

  let kenhRealtime = null

  const tongSoTrang = computed(() =>
    Math.max(1, Math.ceil(tongSoGiaoDich.value / soDongMoiTrang)),
  )

  const dangLoc = computed(
    () => Boolean(boLoc.value.tuKhoa || boLoc.value.tuNgay || boLoc.value.denNgay),
  )

  /** Bốn chỉ số cho các ô thống kê ở trang Tổng hợp. */
  const chiSoTongHop = computed(() => {
    const tongBan = tongHop.value.reduce((s, r) => s + Number(r.tong_ban ?? 0), 0)
    const tongThu = tongHop.value.reduce((s, r) => s + Number(r.tong_thu ?? 0), 0)
    return {
      tongBan,
      tongThu,
      conNo: tongBan - tongThu,
      soKhachConNo: tongHop.value.filter((r) => Number(r.con_no ?? 0) > 0).length,
    }
  })

  // =========================================================================
  //  Danh mục
  // =========================================================================

  async function taiDanhMuc() {
    dangTaiDanhMuc.value = true
    loiDanhMuc.value = ''
    try {
      const [kh, mh] = await Promise.all([
        supabase.from('khach_hang').select('*').order('ten'),
        supabase.from('mat_hang').select('*').order('ten'),
      ])
      if (kh.error) throw kh.error
      if (mh.error) throw mh.error
      khachHang.value = kh.data ?? []
      matHang.value = mh.data ?? []
    } catch (e) {
      loiDanhMuc.value = moTaLoi(e, 'Không tải được danh mục.')
    } finally {
      dangTaiDanhMuc.value = false
    }
  }

  /** Tra cứu không phân biệt hoa/thường — dùng để tự điền SĐT và đơn giá. */
  function timKhachHang(ten) {
    const k = khoaTen(ten)
    return k ? khachHang.value.find((x) => khoaTen(x.ten) === k) ?? null : null
  }

  function timMatHang(ten) {
    const k = khoaTen(ten)
    return k ? matHang.value.find((x) => khoaTen(x.ten) === k) ?? null : null
  }

  async function luuKhachHang(ban) {
    const payload = {
      ten: ban.ten.trim(),
      sdt: ban.sdt?.trim() || null,
      dia_chi: ban.dia_chi?.trim() || null,
      ghi_chu: ban.ghi_chu?.trim() || null,
    }
    const { error } = ban.id
      ? await supabase.from('khach_hang').update(payload).eq('id', ban.id)
      : await supabase.from('khach_hang').insert(payload)
    if (error) throw new Error(moTaLoi(error))
    await taiDanhMuc()
  }

  async function xoaKhachHang(id) {
    const { error } = await supabase.from('khach_hang').delete().eq('id', id)
    if (error) throw new Error(moTaLoi(error))
    await taiDanhMuc()
  }

  async function luuMatHang(ban) {
    const payload = {
      ten: ban.ten.trim(),
      dvt: ban.dvt?.trim() || null,
      don_gia: Number(ban.don_gia) || 0,
    }
    const { error } = ban.id
      ? await supabase.from('mat_hang').update(payload).eq('id', ban.id)
      : await supabase.from('mat_hang').insert(payload)
    if (error) throw new Error(moTaLoi(error))
    await taiDanhMuc()
  }

  async function xoaMatHang(id) {
    const { error } = await supabase.from('mat_hang').delete().eq('id', id)
    if (error) throw new Error(moTaLoi(error))
    await taiDanhMuc()
  }

  /** Số giao dịch đang gắn với một tên — để cảnh báo trước khi xoá danh mục. */
  async function demGiaoDichTheoTen(cot, ten) {
    const { count, error } = await supabase
      .from('nhat_ky')
      .select('id', { count: 'exact', head: true })
      .ilike(cot, ten.trim())
    if (error) return 0
    return count ?? 0
  }

  // =========================================================================
  //  Sổ nhật ký — lọc, sắp xếp và phân trang phía máy chủ
  // =========================================================================

  async function taiNhatKy() {
    dangTaiNhatKy.value = true
    loiNhatKy.value = ''
    try {
      let q = supabase.from('nhat_ky').select('*', { count: 'exact' })

      const tuKhoa = boLoc.value.tuKhoa.trim()
      if (tuKhoa) {
        // Thoát ký tự đại diện của LIKE để người dùng gõ '%' vẫn tìm đúng nghĩa đen.
        const an = tuKhoa.replace(/[\\%_]/g, (c) => `\\${c}`)
        q = q.or(`ten_kh.ilike.%${an}%,mat_hang.ilike.%${an}%,sdt.ilike.%${an}%`)
      }
      if (boLoc.value.tuNgay) q = q.gte('ngay', boLoc.value.tuNgay)
      if (boLoc.value.denNgay) q = q.lte('ngay', boLoc.value.denNgay)

      const tu = (trang.value - 1) * soDongMoiTrang
      q = q
        .order(sapXep.value.cot, { ascending: !sapXep.value.giamDan })
        .order('created_at', { ascending: false })
        .range(tu, tu + soDongMoiTrang - 1)

      const { data, error, count } = await q
      if (error) throw error
      nhatKy.value = data ?? []
      tongSoGiaoDich.value = count ?? 0
    } catch (e) {
      loiNhatKy.value = moTaLoi(e, 'Không tải được sổ nhật ký.')
      nhatKy.value = []
    } finally {
      dangTaiNhatKy.value = false
    }
  }

  function datBoLoc(loc) {
    boLoc.value = { ...boLoc.value, ...loc }
    trang.value = 1
    return taiNhatKy()
  }

  function xoaBoLoc() {
    boLoc.value = { tuKhoa: '', tuNgay: '', denNgay: '' }
    trang.value = 1
    return taiNhatKy()
  }

  function doiSapXep(cot) {
    if (sapXep.value.cot === cot) sapXep.value.giamDan = !sapXep.value.giamDan
    else sapXep.value = { cot, giamDan: true }
    trang.value = 1
    return taiNhatKy()
  }

  function doiTrang(soTrang) {
    trang.value = Math.min(Math.max(1, soTrang), tongSoTrang.value)
    return taiNhatKy()
  }

  async function luuGiaoDich(ban) {
    const payload = {
      ngay: ban.ngay,
      ten_kh: ban.ten_kh.trim(),
      sdt: ban.sdt?.trim() || null,
      mat_hang: ban.mat_hang.trim(),
      so_luong: Number(ban.so_luong),
      don_gia: Number(ban.don_gia),
      da_thanh_toan: Number(ban.da_thanh_toan) || 0,
      ghi_chu: ban.ghi_chu?.trim() || null,
    }
    const { error } = ban.id
      ? await supabase.from('nhat_ky').update(payload).eq('id', ban.id)
      : await supabase.from('nhat_ky').insert(payload)
    if (error) throw new Error(moTaLoi(error))
    await Promise.all([taiNhatKy(), taiTongHop()])
  }

  async function xoaGiaoDich(id) {
    const { error } = await supabase.from('nhat_ky').delete().eq('id', id)
    if (error) throw new Error(moTaLoi(error))
    await Promise.all([taiNhatKy(), taiTongHop()])
  }

  /** Khôi phục một giao dịch vừa xoá (nút Hoàn tác trong toast). */
  async function hoanTacXoaGiaoDich(ban) {
    const { id, thanh_tien, con_no, created_at, updated_at, created_by, ...rest } = ban
    const { error } = await supabase.from('nhat_ky').insert(rest)
    if (error) throw new Error(moTaLoi(error))
    await Promise.all([taiNhatKy(), taiTongHop()])
  }

  // =========================================================================
  //  Tổng hợp
  // =========================================================================

  async function taiTongHop() {
    dangTaiTongHop.value = true
    loiTongHop.value = ''
    try {
      const { data, error } = await supabase
        .from('v_tong_hop')
        .select('*')
        .order('con_no', { ascending: false })
      if (error) throw error
      tongHop.value = data ?? []
    } catch (e) {
      loiTongHop.value = moTaLoi(e, 'Không tải được bảng tổng hợp.')
      tongHop.value = []
    } finally {
      dangTaiTongHop.value = false
    }
  }

  /** Toàn bộ giao dịch của một khách, cho hộp thoại chi tiết. */
  async function taiGiaoDichCuaKhach(tenKH) {
    const { data, error } = await supabase
      .from('nhat_ky')
      .select('*')
      .ilike('ten_kh', tenKH.trim())
      .order('ngay', { ascending: false })
    if (error) throw new Error(moTaLoi(error))
    return data ?? []
  }

  /** Lấy toàn bộ dữ liệu 4 bảng để xuất Excel (không bị giới hạn phân trang). */
  async function taiToanBoDeXuat() {
    const [kh, mh, nk, th] = await Promise.all([
      supabase.from('khach_hang').select('*').order('ten'),
      supabase.from('mat_hang').select('*').order('ten'),
      supabase.from('nhat_ky').select('*').order('ngay').order('created_at'),
      supabase.from('v_tong_hop').select('*').order('con_no', { ascending: false }),
    ])
    const loi = kh.error || mh.error || nk.error || th.error
    if (loi) throw new Error(moTaLoi(loi, 'Không tải được dữ liệu để xuất.'))
    return {
      khachHang: kh.data ?? [],
      matHang: mh.data ?? [],
      nhatKy: nk.data ?? [],
      tongHop: th.data ?? [],
    }
  }

  // =========================================================================
  //  Realtime + vòng đời
  // =========================================================================

  async function taiTatCa() {
    await Promise.all([taiDanhMuc(), taiNhatKy(), taiTongHop()])
  }

  function batRealtime() {
    if (kenhRealtime) return
    kenhRealtime = supabase
      .channel('congno')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nhat_ky' }, () => {
        taiNhatKy()
        taiTongHop()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'khach_hang' }, taiDanhMuc)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mat_hang' }, taiDanhMuc)
      .subscribe()
  }

  function tatRealtime() {
    if (!kenhRealtime) return
    supabase.removeChannel(kenhRealtime)
    kenhRealtime = null
  }

  function datLai() {
    khachHang.value = []
    matHang.value = []
    nhatKy.value = []
    tongHop.value = []
    tongSoGiaoDich.value = 0
    trang.value = 1
    boLoc.value = { tuKhoa: '', tuNgay: '', denNgay: '' }
    tatRealtime()
  }

  return {
    khachHang,
    matHang,
    nhatKy,
    tongHop,
    tongSoGiaoDich,
    dangTaiDanhMuc,
    dangTaiNhatKy,
    dangTaiTongHop,
    loiDanhMuc,
    loiNhatKy,
    loiTongHop,
    boLoc,
    sapXep,
    trang,
    soDongMoiTrang,
    tongSoTrang,
    dangLoc,
    chiSoTongHop,
    taiDanhMuc,
    taiNhatKy,
    taiTongHop,
    taiTatCa,
    timKhachHang,
    timMatHang,
    luuKhachHang,
    xoaKhachHang,
    luuMatHang,
    xoaMatHang,
    demGiaoDichTheoTen,
    datBoLoc,
    xoaBoLoc,
    doiSapXep,
    doiTrang,
    luuGiaoDich,
    xoaGiaoDich,
    hoanTacXoaGiaoDich,
    taiGiaoDichCuaKhach,
    taiToanBoDeXuat,
    batRealtime,
    tatRealtime,
    datLai,
  }
})
