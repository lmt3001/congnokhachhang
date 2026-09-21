import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

/*
 * Hash history: deep-link hoạt động trên GitHub Pages mà không cần mẹo
 * 404.html. Đánh đổi là URL có dạng /#/nhat-ky.
 *
 * Mọi route đều lazy-load để bundle đầu tiên chỉ chứa màn hình đăng nhập.
 */
const routes = [
  { path: '/', redirect: '/nhat-ky' },

  {
    path: '/dang-nhap',
    name: 'dang-nhap',
    component: () => import('@/components/views/DangNhapView.vue'),
    meta: { khach: true, tieuDe: 'Đăng nhập' },
  },
  {
    path: '/dang-ky',
    name: 'dang-ky',
    component: () => import('@/components/views/DangKyView.vue'),
    meta: { khach: true, tieuDe: 'Đăng ký' },
  },
  {
    path: '/cho-duyet',
    name: 'cho-duyet',
    component: () => import('@/components/views/ChoDuyetView.vue'),
    meta: { canDangNhap: true, tieuDe: 'Chờ duyệt' },
  },

  {
    path: '/nhat-ky',
    name: 'nhat-ky',
    component: () => import('@/components/views/NhatKyView.vue'),
    meta: { canThanhVien: true, tieuDe: 'Nhật ký bán hàng' },
  },
  {
    path: '/tong-hop',
    name: 'tong-hop',
    component: () => import('@/components/views/TongHopView.vue'),
    meta: { canThanhVien: true, tieuDe: 'Tổng hợp công nợ' },
  },
  {
    path: '/khach-hang',
    name: 'khach-hang',
    component: () => import('@/components/views/KhachHangView.vue'),
    meta: { canThanhVien: true, tieuDe: 'Khách hàng' },
  },
  {
    path: '/mat-hang',
    name: 'mat-hang',
    component: () => import('@/components/views/MatHangView.vue'),
    meta: { canThanhVien: true, tieuDe: 'Mặt hàng' },
  },
  {
    path: '/nguoi-dung',
    name: 'nguoi-dung',
    component: () => import('@/components/views/NguoiDungView.vue'),
    meta: { canAdmin: true, tieuDe: 'Người dùng' },
  },

  {
    path: '/:khongTonTai(.*)*',
    name: 'khong-tim-thay',
    component: () => import('@/components/views/KhongTimThayView.vue'),
    meta: { tieuDe: 'Không tìm thấy trang' },
  },
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: (_to, _from, daLuu) => daLuu ?? { top: 0 },
})

/*
 * Một điểm kiểm tra quyền duy nhất cho mọi route, thay vì rải vào từng
 * component. Đây chỉ là điều hướng cho mượt — RLS mới là thứ chặn thật.
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.dangKhoiTao) await auth.khoiTao()

  if (!auth.daDangNhap) {
    return to.meta.khach ? true : { name: 'dang-nhap', query: { tiepTuc: to.fullPath } }
  }

  // Đã đăng nhập nhưng chưa được duyệt (hoặc bị khoá).
  if (!auth.laThanhVien) {
    return to.name === 'cho-duyet' ? true : { name: 'cho-duyet' }
  }

  // Đã là thành viên: không cần quay lại màn hình đăng nhập / chờ duyệt nữa.
  if (to.meta.khach || to.name === 'cho-duyet') return { name: 'nhat-ky' }

  if (to.meta.canAdmin && !auth.laAdmin) return { name: 'nhat-ky' }

  return true
})

router.afterEach((to) => {
  document.title = to.meta.tieuDe
    ? `${to.meta.tieuDe} · Quản lý công nợ`
    : 'Quản lý công nợ khách hàng'
})
