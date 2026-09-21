/* CHỈ DÙNG ĐỂ XEM TRƯỚC GIAO DIỆN — thay cho @/stores/authStore.
   Đổi VAI_TRO thành 'user' để kiểm tra chế độ chỉ xem.                      */

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const VAI_TRO = import.meta.env.VITE_PREVIEW_ROLE || 'admin'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref({
    id: 'u1',
    email: VAI_TRO === 'admin' ? 'chu-cua-hang@example.com' : 'ke-toan@example.com',
    ho_ten: VAI_TRO === 'admin' ? 'Chủ cửa hàng' : 'Nguyễn Thị Kế Toán',
    role: VAI_TRO,
    status: 'active',
  })

  const laAdmin = computed(() => VAI_TRO === 'admin')

  return {
    session: ref({ user: { id: 'u1' } }),
    profile,
    dangKhoiTao: ref(false),
    loiHoSo: ref(''),
    daDangNhap: computed(() => true),
    trangThai: computed(() => 'active'),
    vaiTro: computed(() => VAI_TRO),
    laThanhVien: computed(() => true),
    laAdmin,
    duocSua: laAdmin,
    tenHienThi: computed(() => profile.value.ho_ten),
    khoiTao: () => Promise.resolve(),
    taiHoSo: () => Promise.resolve(),
    dangNhap: () => Promise.resolve(),
    dangKy: () => Promise.resolve(),
    dangXuat: () => Promise.resolve(),
    guiEmailDatLaiMatKhau: () => Promise.resolve(),
  }
})
