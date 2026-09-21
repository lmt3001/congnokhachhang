# Quản lý công nợ khách hàng

Web app thay thế cho sổ Excel `CongNoKhachHang.xlsm`. Giữ nguyên nghiệp vụ của
bản Excel (sổ nhật ký bán hàng, bảng tổng hợp công nợ, danh mục khách hàng và
mặt hàng) nhưng dùng được trên nhiều máy, có đăng nhập và phân quyền.

**Công nghệ:** Vue 3 + Vite · Supabase (Auth + Postgres + RLS) · deploy miễn phí
trên GitHub Pages.

---

## Nghiệp vụ được giữ nguyên từ file Excel

| Trong Excel | Trong web |
|---|---|
| Sheet `NhatKy`, công thức `Thành tiền = SL × Đơn giá`, `Còn nợ = Thành tiền − Đã thanh toán` | Bảng `nhat_ky` với **generated column** — công thức được ép ở tầng database |
| Macro `CapNhatTongHop` (gom nhóm theo `LCase(Trim(tên))`) | View `v_tong_hop`, tự cập nhật, không cần bấm nút |
| UserForm `frmNhapLieu` — combobox cho gõ tự do, tự điền SĐT và đơn giá | Hộp thoại "Thêm giao dịch", thêm phần **xem trước Thành tiền / Còn nợ realtime** |
| Macro `FilterByDateRange` | Bộ lọc Từ ngày / Đến ngày, chặn "từ > đến" |
| 10 thông báo trong sheet ẩn `Msg` | Giữ nguyên nội dung và **thứ tự kiểm tra**, viết lại có dấu và bổ sung cách khắc phục |
| Tô đỏ ô còn nợ | Badge "Còn nợ" / "Đã trả đủ" có **icon + chữ**, không chỉ dựa vào màu |

Giống bản Excel, tên khách hàng và mặt hàng trong sổ nhật ký là **text tự do** —
gõ được tên chưa có trong danh mục, và xoá một khách khỏi danh mục không làm mất
lịch sử giao dịch của họ.

## Phân quyền

| | `admin` | `user` |
|---|---|---|
| Xem nhật ký, tổng hợp, danh mục | ✅ | ✅ |
| Lọc, tìm kiếm, xuất Excel | ✅ | ✅ |
| Thêm / sửa / xoá | ✅ | ❌ |
| Duyệt và quản lý tài khoản | ✅ | ❌ |

Người mới đăng ký ở trạng thái **chờ duyệt** và không thấy được dữ liệu cho tới
khi admin duyệt.

> Việc chặn truy cập nằm ở **Row Level Security trong Postgres**, không phải ở
> frontend. Giao diện chỉ ẩn nút cho gọn mắt; kể cả người dùng mở DevTools gọi
> API trực tiếp cũng bị database từ chối.

---

## Cài đặt

### 1. Tạo project Supabase

1. Tạo project mới tại [supabase.com](https://supabase.com) (gói Free là đủ).
2. Mở **SQL Editor**, dán toàn bộ nội dung [`supabase/schema.sql`](supabase/schema.sql) rồi chạy.
   File này tạo bảng, view tổng hợp, trigger và toàn bộ policy RLS. Chạy lại nhiều lần không sao.
3. Vào **Project Settings → API**, chép `Project URL` và `anon public key`.

### 2. Chạy ở máy

Tạo file `.env.local` ở thư mục gốc:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

```bash
npm install
npm run dev
```

### 3. Tạo quản trị viên đầu tiên

Trigger đặt **mọi** tài khoản mới vào trạng thái `pending`, nên ngay sau khi cài
sẽ chưa có ai duyệt được ai:

1. Mở web, bấm **Đăng ký** và tạo tài khoản bằng email của bạn.
2. Về Supabase → SQL Editor, chạy (thay email của bạn vào):

   ```sql
   update public.profiles
   set role = 'admin', status = 'active'
   where email = 'email-cua-ban@example.com';
   ```

3. Tải lại trang. Từ giờ bạn duyệt được các tài khoản khác ngay trong app ở tab **Người dùng**.

> Nếu bước 2 báo lỗi `Chỉ quản trị viên mới được đổi vai trò hoặc trạng thái tài
> khoản.` thì project đang chạy bản trigger cũ. Chạy lại toàn bộ
> `supabase/schema.sql` một lần nữa (an toàn, file viết để chạy lại được) rồi
> thử lại câu `update`.

---

## Deploy lên GitHub Pages

> 📘 Hướng dẫn từng bước đầy đủ, kèm bảng xử lý sự cố:
> [`docs/HUONG-DAN-DEPLOY.md`](docs/HUONG-DAN-DEPLOY.md)

1. Tạo repo rỗng trên github.com rồi:

   ```bash
   git init
   git add .
   git commit -m "Khởi tạo web quản lý công nợ"
   git branch -M main
   git remote add origin https://github.com/<tài-khoản>/<tên-repo>.git
   git push -u origin main
   ```

2. Trên GitHub: **Settings → Pages → Source** chọn **GitHub Actions**.
3. **Settings → Secrets and variables → Actions → Variables**, thêm hai biến
   `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY`.
4. Trên Supabase: **Authentication → URL Configuration**, thêm địa chỉ
   GitHub Pages vào **Site URL** và **Redirect URLs** (cần cho link xác thực
   email và đặt lại mật khẩu).
5. Push lên `main` là workflow tự chạy test → build → deploy.

### Vài điều cần biết

- Tài khoản GitHub miễn phí chỉ bật được Pages cho **repo public**. Điều đó chấp
  nhận được ở đây: repo chỉ chứa mã nguồn và anon key (vốn công khai theo thiết
  kế), còn **dữ liệu công nợ nằm trong Postgres và bị RLS chặn**.
- File `CongNoKhachHang.xlsm` đã được cho vào `.gitignore` vì chứa tên, số điện
  thoại, địa chỉ khách hàng và macro VBA.
- Supabase Free tạm dừng project nếu không hoạt động 7 ngày liên tục; đăng nhập
  lại vào dashboard là chạy tiếp.

---

## Lệnh

| Lệnh | Việc |
|---|---|
| `npm run dev` | Chạy máy chủ phát triển |
| `npm run build` | Build ra thư mục `dist/` |
| `npm run preview` | Xem thử bản build |
| `npm test` | Kiểm thử logic định dạng số/ngày và cấu trúc file Excel xuất ra |

### Kiểm thử giao diện

Thư mục `.preview/` chứa một bộ chạy thử giao diện bằng dữ liệu giả, điều khiển
Chrome qua DevTools Protocol (không cần cài thêm gói nào):

```bash
npx vite --config .preview/vite.config.js --port 5180   # cửa sổ 1
node .preview/chup-man-hinh.mjs                          # cửa sổ 2
```

Bộ này đi qua toàn bộ luồng chính, kiểm tra error summary nhận focus, combobox
tự điền, phép tính xem trước, hỏi lại trước khi bỏ thay đổi, layout 375px và
kích thước vùng chạm; ảnh chụp lưu ở `.shots/`. Đặt `VITE_PREVIEW_ROLE=user` để
xem giao diện ở chế độ chỉ xem.

---

## Xuất Excel

Nút **Xuất Excel** (cả admin và user đều dùng được) dựng lại đúng 4 sheet của
workbook gốc — tiêu đề dòng 1, header dòng 3, dữ liệu từ dòng 4, đúng độ rộng
cột và định dạng `dd/mm/yyyy` / `#,##0`.

File xuất ra chứa **công thức thật** (`F4*G4`, `H4-I4`, `SUMIF(...)`) chứ không
phải giá trị tĩnh, nên mở bằng Excel sửa số lượng thì mọi thứ tự tính lại y như
sổ cũ. Riêng macro VBA thì không mang theo được vì định dạng `.xlsx` không chứa
VBA — các nút bấm ngày trước giờ chính là giao diện web này.

## Ghi chú kỹ thuật

- **Router dùng hash history** (`/#/nhat-ky`) để deep-link hoạt động trên GitHub
  Pages mà không cần mẹo `404.html`.
- **Realtime**: bật sẵn cho 3 bảng nghiệp vụ, nên mở app trên hai máy thì thay
  đổi ở máy này hiện ngay ở máy kia.
- **Giao diện sáng/tối** thiết kế song song bằng token ngữ nghĩa, kiểm tra tương
  phản riêng cho từng chế độ; tôn trọng `prefers-reduced-motion`.
- `npm audit` báo một cảnh báo mức moderate ở gói `uuid` — phụ thuộc gián tiếp
  của `exceljs`. Lỗ hổng nằm ở nhánh `uuid` v3/v5/v6 khi truyền sẵn buffer, không
  nằm trên đường ghi file mà app dùng. `npm audit fix --force` sẽ hạ `exceljs`
  xuống 3.4.0 (thay đổi phá vỡ API) nên cố ý không chạy.
