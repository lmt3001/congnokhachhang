import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { moTaLoi, supabase } from '@/lib/supabase'

/**
 * Phiên đăng nhập + hồ sơ (vai trò, trạng thái duyệt).
 *
 * Lưu ý: mọi thứ ở đây chỉ phục vụ việc hiển thị. Việc chặn truy cập thật nằm
 * ở Row Level Security trong Postgres — sửa `role` trong store này không giúp
 * client ghi được dữ liệu.
 */
export const useAuthStore = defineStore('auth', () => {
  const session = ref(null)
  const profile = ref(null)
  const dangKhoiTao = ref(true)
  const loiHoSo = ref('')

  const daDangNhap = computed(() => Boolean(session.value))
  const trangThai = computed(() => profile.value?.status ?? null)
  const vaiTro = computed(() => profile.value?.role ?? null)

  const laThanhVien = computed(() => trangThai.value === 'active')
  const laAdmin = computed(() => laThanhVien.value && vaiTro.value === 'admin')
  /** Chỉ admin mới được thêm/sửa/xoá. `user` là vai trò chỉ xem + xuất Excel. */
  const duocSua = computed(() => laAdmin.value)

  const tenHienThi = computed(
    () => profile.value?.ho_ten?.trim() || profile.value?.email || 'Người dùng',
  )

  async function taiHoSo() {
    if (!session.value) {
      profile.value = null
      return
    }
    loiHoSo.value = ''
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, ho_ten, role, status, created_at')
      .eq('id', session.value.user.id)
      .maybeSingle()

    if (error) {
      loiHoSo.value = moTaLoi(error, 'Không tải được thông tin tài khoản.')
      profile.value = null
      return
    }
    // Hiếm gặp: trigger handle_new_user chưa chạy xong ngay sau khi đăng ký.
    profile.value = data ?? null
  }

  async function khoiTao() {
    if (!supabase) {
      dangKhoiTao.value = false
      return
    }
    const { data } = await supabase.auth.getSession()
    session.value = data.session
    await taiHoSo()
    dangKhoiTao.value = false

    supabase.auth.onAuthStateChange(async (_event, phienMoi) => {
      const doiNguoiDung = phienMoi?.user?.id !== session.value?.user?.id
      session.value = phienMoi
      // Chỉ tải lại hồ sơ khi thực sự đổi người dùng; sự kiện làm mới token
      // xảy ra thường xuyên và không cần gọi lại API.
      if (doiNguoiDung) await taiHoSo()
    })
  }

  async function dangNhap(email, matKhau) {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: matKhau,
    })
    if (error) throw new Error(moTaLoi(error))
    await taiHoSo()
  }

  async function dangKy(email, matKhau, hoTen) {
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: matKhau,
      options: { data: { ho_ten: hoTen?.trim() || null } },
    })
    if (error) throw new Error(moTaLoi(error))
    await taiHoSo()
  }

  async function dangXuat() {
    await supabase.auth.signOut()
    session.value = null
    profile.value = null
  }

  async function guiEmailDatLaiMatKhau(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}${window.location.pathname}`,
    })
    if (error) throw new Error(moTaLoi(error))
  }

  return {
    session,
    profile,
    dangKhoiTao,
    loiHoSo,
    daDangNhap,
    trangThai,
    vaiTro,
    laThanhVien,
    laAdmin,
    duocSua,
    tenHienThi,
    khoiTao,
    taiHoSo,
    dangNhap,
    dangKy,
    dangXuat,
    guiEmailDatLaiMatKhau,
  }
})
