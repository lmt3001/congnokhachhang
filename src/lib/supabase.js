import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * `false` khi chưa cấu hình biến môi trường. App sẽ hiện màn hình hướng dẫn
 * thay vì crash với lỗi khó hiểu.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

/*
 * Anon key được thiết kế để công khai — nó chỉ định danh project, không cấp
 * quyền gì. Việc chặn truy cập nằm hoàn toàn ở Row Level Security trong
 * Postgres (xem supabase/schema.sql).
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Router dùng hash history nên URL luôn có '#'. Tắt detect mặc định
        // để Supabase không nhầm route '#/nhat-ky' là callback đăng nhập;
        // authStore tự xử lý token trong hash một cách tường minh.
        detectSessionInUrl: false,
      },
    })
  : null

/**
 * Dịch lỗi của Supabase sang thông báo tiếng Việt nêu rõ nguyên nhân và cách
 * khắc phục (rule error-clarity), thay vì ném nguyên chuỗi tiếng Anh.
 */
export function moTaLoi(error, macDinh = 'Đã xảy ra lỗi. Vui lòng thử lại.') {
  if (!error) return macDinh

  const code = error.code ?? ''
  const msg = String(error.message ?? '')

  if (code === '42501' || msg.includes('row-level security')) {
    return 'Tài khoản của bạn không có quyền thực hiện thao tác này. Hãy liên hệ quản trị viên nếu bạn cần quyền chỉnh sửa.'
  }
  if (msg.includes('Invalid login credentials')) {
    return 'Email hoặc mật khẩu không đúng. Kiểm tra lại, hoặc dùng "Quên mật khẩu?" để đặt lại.'
  }
  if (msg.includes('User already registered')) {
    return 'Email này đã được đăng ký. Hãy đăng nhập, hoặc dùng "Quên mật khẩu?" nếu bạn không nhớ mật khẩu.'
  }
  if (msg.includes('Password should be at least')) {
    return 'Mật khẩu quá ngắn. Hãy dùng ít nhất 8 ký tự.'
  }
  if (msg.includes('Email not confirmed')) {
    return 'Email chưa được xác thực. Hãy mở hộp thư và bấm vào liên kết xác thực.'
  }
  if (msg.includes('over_email_send_rate_limit') || msg.includes('rate limit')) {
    return 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi ít phút rồi thử lại.'
  }
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Không kết nối được máy chủ. Kiểm tra kết nối mạng rồi bấm "Thử lại".'
  }
  // Thông báo do trigger guard_profile_changes ném ra vốn đã là tiếng Việt.
  return msg || macDinh
}
