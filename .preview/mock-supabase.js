/* CHỈ DÙNG ĐỂ XEM TRƯỚC GIAO DIỆN — không nằm trong bản build sản phẩm.
   Được alias thay cho @/lib/supabase qua .preview/vite.config.js             */

export const isSupabaseConfigured = true

const HO_SO = [
  { id: 'u1', email: 'chu-cua-hang@example.com', ho_ten: 'Chủ cửa hàng', role: 'admin', status: 'active', created_at: '2026-09-01T02:00:00Z' },
  { id: 'u2', email: 'ke-toan@example.com', ho_ten: 'Nguyễn Thị Kế Toán', role: 'user', status: 'active', created_at: '2026-09-10T03:00:00Z' },
  { id: 'u3', email: 'nhan-vien-moi@example.com', ho_ten: 'Trần Văn Mới', role: 'user', status: 'pending', created_at: '2026-09-20T08:30:00Z' },
  { id: 'u4', email: 'da-nghi@example.com', ho_ten: 'Lê Đã Nghỉ', role: 'user', status: 'disabled', created_at: '2026-08-02T01:00:00Z' },
]

function ket(data, count) {
  const p = Promise.resolve({ data, error: null, count: count ?? (Array.isArray(data) ? data.length : 0) })
  const chain = new Proxy(p, {
    get(t, k) {
      if (k === 'then' || k === 'catch' || k === 'finally') return t[k].bind(t)
      return () => chain
    },
  })
  return chain
}

export const supabase = {
  from(bang) {
    if (bang === 'profiles') return ket(HO_SO)
    return ket([])
  },
  auth: {
    getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => Promise.resolve({}),
  },
  channel: () => ({ on() { return this }, subscribe() { return this } }),
  removeChannel() {},
}

export function moTaLoi(e, macDinh = 'Lỗi') {
  return e?.message ?? macDinh
}
