/* ============================================================================
   Định dạng và phân tích số / ngày theo quy ước Việt Nam.
   Tương ứng NumberFormat "#,##0" và "dd/mm/yyyy" của file Excel gốc.
   ============================================================================ */

const dinhDangTien = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const dinhDangSo = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })

/** 250000 → "250.000" (khớp NumberFormat "#,##0" của Excel) */
export function tien(giaTri) {
  const n = Number(giaTri)
  return Number.isFinite(n) ? dinhDangTien.format(n) : '0'
}

/** 2.5 → "2,5" — dùng cho số lượng, giữ tối đa 3 chữ số thập phân */
export function so(giaTri) {
  const n = Number(giaTri)
  return Number.isFinite(n) ? dinhDangSo.format(n) : '0'
}

/** "2026-09-21" → "21/09/2026" */
export function ngayVN(isoDate) {
  if (!isoDate) return ''
  const [y, m, d] = String(isoDate).slice(0, 10).split('-')
  return y && m && d ? `${d}/${m}/${y}` : ''
}

/** Date hôm nay theo giờ địa phương, dạng "YYYY-MM-DD" cho <input type="date"> */
export function homNayISO() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** "2026-09-21T10:30:00Z" → "21/09/2026 17:30" */
export function ngayGioVN(isoTimestamp) {
  if (!isoTimestamp) return ''
  const d = new Date(isoTimestamp)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

/**
 * Phân tích số người dùng nhập. Chấp nhận cả "1.200.000", "1200000" và "2,5"
 * vì người Việt hay gõ dấu chấm phân cách nghìn.
 * Trả về NaN nếu không phải số — tương ứng IsNumeric() trong VBA.
 */
export function phanTichSo(giaTri) {
  if (typeof giaTri === 'number') return giaTri
  const s = String(giaTri ?? '').trim()
  if (s === '') return NaN

  // Bỏ dấu chấm phân cách nghìn, đổi dấu phẩy thập phân sang dấu chấm.
  const chuanHoa = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  if (!/^-?\d*\.?\d+$/.test(chuanHoa)) return NaN
  return Number(chuanHoa)
}

/**
 * Khoá gom nhóm khách hàng — tương ứng LCase(Trim(tenKH)) trong macro
 * CapNhatTongHop, và khớp với biểu thức index lower(trim(ten_kh)) trong Postgres.
 */
export function khoaTen(ten) {
  return String(ten ?? '').trim().toLowerCase()
}
