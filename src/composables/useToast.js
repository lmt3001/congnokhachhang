import { ref } from 'vue'

let idTiepTheo = 1
const danhSach = ref([])

/**
 * Hàng đợi toast dùng chung toàn app.
 *
 * Toast không bao giờ cướp focus — nó được đọc qua vùng aria-live="polite"
 * trong ToastHost. Toast có nút hành động (ví dụ "Hoàn tác") thì sống lâu hơn
 * để người dùng kịp với tới.
 */
export function useToast() {
  function them({ noiDung, loai = 'info', thoiGian, hanhDong }) {
    const id = idTiepTheo++
    const ms = thoiGian ?? (hanhDong ? 6000 : 4000)
    danhSach.value.push({ id, noiDung, loai, hanhDong })
    if (ms > 0) setTimeout(() => go(id), ms)
    return id
  }

  function go(id) {
    const i = danhSach.value.findIndex((t) => t.id === id)
    if (i !== -1) danhSach.value.splice(i, 1)
  }

  return {
    danhSach,
    go,
    thanhCong: (noiDung, tuyChon) => them({ ...tuyChon, noiDung, loai: 'thanh-cong' }),
    loi: (noiDung, tuyChon) => them({ ...tuyChon, noiDung, loai: 'loi', thoiGian: 8000 }),
    thongTin: (noiDung, tuyChon) => them({ ...tuyChon, noiDung, loai: 'info' }),
  }
}
