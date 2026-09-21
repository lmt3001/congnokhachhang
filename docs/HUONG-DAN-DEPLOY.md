# Hướng dẫn đưa web lên mạng để dùng thật

Hướng dẫn từng bước để chạy app trên **Vercel** với dữ liệu thật trên Supabase.

**Trạng thái hiện tại của bạn**

| | |
|---|---|
| Project Supabase | ✅ đã tạo — `lszwvjooihyfbuekaucw` |
| Chạy `supabase/schema.sql` | ✅ đã chạy |
| File `.env.local` ở máy | ✅ đã tạo đúng |
| Repo GitHub | ✅ `github.com/lmt3001/congnokhachhang` |
| Vá trigger + cấp quyền admin đầu tiên | ⬜ **Bước 1** |
| Đẩy mã nguồn lên GitHub | ⬜ **Bước 2** |
| Tạo project trên Vercel | ⬜ **Bước 3** |
| Khai báo biến môi trường trên Vercel | ⬜ **Bước 4** |
| Cấu hình URL trên Supabase | ⬜ **Bước 5** |

---

## Bước 1 — Tạo quản trị viên đầu tiên

Trigger đặt **mọi** tài khoản mới vào trạng thái *chờ duyệt*, nên ngay sau khi
cài đặt sẽ chưa có ai duyệt được ai. Phải gỡ nút thắt này một lần bằng tay.

### 1a. Đăng ký tài khoản

```bash
npm run dev
```

Mở http://localhost:5173 → bấm **Đăng ký** → nhập họ tên, email, mật khẩu
(≥ 8 ký tự). Sau khi tạo xong bạn sẽ thấy màn hình **"Đang chờ duyệt"** — đúng
như thiết kế.

> Nếu Supabase bật xác thực email (mặc định là bật), hãy mở hộp thư và bấm vào
> liên kết xác thực trước. Muốn tắt: Supabase → **Authentication → Sign In / Providers
> → Email → Confirm email** → tắt.

### 1b. Tự cấp quyền admin

Vào Supabase → **SQL Editor** → **New query**, dán khối dưới đây, **thay email
của bạn** vào dòng cuối rồi bấm **Run**:

```sql
create or replace function public.guard_profile_changes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- Câu lệnh không đến từ người dùng đã đăng nhập (SQL Editor, service_role)
  -- thì bỏ qua kiểm tra — nếu không sẽ không tạo được admin đầu tiên.
  if auth.uid() is null then
    return new;
  end if;

  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_active_admin() then
    raise exception 'Chỉ quản trị viên mới được đổi vai trò hoặc trạng thái tài khoản.'
      using errcode = '42501';
  end if;

  if old.role = 'admin' and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active')
     and (select count(*) from public.profiles
          where role = 'admin' and status = 'active') <= 1 then
    raise exception 'Không thể hạ quyền quản trị viên hoạt động cuối cùng.'
      using errcode = '42501';
  end if;

  new.id := old.id;
  new.email := old.email;
  new.created_at := old.created_at;
  return new;
end;
$$;

update public.profiles
set role = 'admin', status = 'active'
where email = 'email-cua-ban@example.com';
```

Kết quả mong đợi: `Success. 1 rows affected`. Nếu báo `0 rows` nghĩa là email
gõ sai hoặc tài khoản chưa được tạo — kiểm tra bằng:

```sql
select email, role, status from public.profiles;
```

### 1c. Kiểm tra

Quay lại trang web, bấm **Kiểm tra lại** (hoặc F5). Bạn phải vào được sổ nhật ký
và thấy chữ **Quản trị viên** ở góc dưới bên trái.

---

## Bước 2 — Đẩy mã nguồn lên GitHub

```bash
git push
```

Có hai commit đang chờ push (dọn 4,6 MB công cụ Claude Code khỏi repo public,
và thêm cấu hình Vercel).

Vercel lấy mã nguồn từ GitHub nên **phải push xong mới làm được Bước 3**.

> **Lưu ý về lịch sử git:** commit đầu tiên đã đẩy lên vẫn còn chứa các file đó
> trong lịch sử. Chúng chỉ là dữ liệu thiết kế dạng CSV, không phải bí mật, nên
> để vậy cũng được. Nếu muốn xoá sạch khỏi lịch sử thì cách gọn nhất là xoá repo
> trên GitHub rồi tạo lại và push lại từ đầu.

---

## Bước 3 — Tạo project trên Vercel

1. Vào https://vercel.com → **Sign Up** / **Log in**, chọn **Continue with GitHub**
2. Bấm **Add New…** → **Project**
3. Trong danh sách repo, tìm **congnokhachhang** → bấm **Import**

   > Không thấy repo? Bấm **Adjust GitHub App Permissions** và cấp quyền cho
   > Vercel truy cập repo đó.

4. Ở màn hình **Configure Project**, Vercel tự đọc [`vercel.json`](../vercel.json)
   nên **không cần sửa gì** trong phần Build & Output Settings:

   | Mục | Giá trị tự nhận |
   |---|---|
   | Framework Preset | Vite |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm ci` |

5. **Khoan bấm Deploy** — mở mục **Environment Variables** trước và làm Bước 4.

---

## Bước 4 — Khai báo biến môi trường trên Vercel

File `.env.local` chỉ có trên máy bạn và đã bị `.gitignore` chặn, nên Vercel
không biết gì về nó. Phải khai báo lại.

Ngay trong màn hình **Configure Project** (hoặc sau này ở **Settings →
Environment Variables**), thêm hai biến:

| Key | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://lszwvjooihyfbuekaucw.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` (key của bạn) |

Để nguyên cả ba môi trường **Production / Preview / Development** được chọn.

Xong thì bấm **Deploy**. Lần build đầu mất khoảng 1–2 phút.

> **Hai giá trị này có phải bí mật không?** Không. Chúng được nhúng thẳng vào
> JavaScript gửi tới trình duyệt nên về bản chất là công khai — Supabase thiết
> kế publishable key đúng như vậy. Việc chặn truy cập nằm hoàn toàn ở Row Level
> Security trong Postgres. Thứ **tuyệt đối không được** đưa lên đây là
> `service_role` / `sb_secret_...` key, vì nó bỏ qua toàn bộ RLS.

> **Đổi biến sau này:** sửa ở Settings xong phải vào tab **Deployments** →
> bấm **⋯** ở bản mới nhất → **Redeploy**. Biến được nhúng lúc build nên không
> tự áp dụng cho bản đã deploy.

---

## Bước 5 — Cấu hình URL trên Supabase

Sau khi deploy xong, Vercel cho bạn một địa chỉ dạng:

```
https://congnokhachhang.vercel.app
```

Địa chỉ chính xác nằm ở đầu trang project trên Vercel (mục **Domains**).

Vào Supabase → **Authentication** → **URL Configuration**:

| Trường | Giá trị |
|---|---|
| **Site URL** | `https://congnokhachhang.vercel.app` |
| **Redirect URLs** | thêm `https://congnokhachhang.vercel.app/**` |

Bước này cần cho liên kết **xác thực email** và **đặt lại mật khẩu** — thiếu nó
thì người dùng bấm vào link trong mail sẽ bị đá về `localhost`.

Thêm luôn hai dòng nữa vào Redirect URLs:

- `http://localhost:5173/**` — để vẫn chạy được ở máy
- `https://*-lmt3001s-projects.vercel.app/**` — để các bản Preview mà Vercel
  tạo cho mỗi nhánh cũng đăng nhập được (tên chính xác xem ở phần Domains)

---

## Bước 6 — Kiểm tra

Mỗi lần push lên `main`, Vercel tự build và cập nhật trang sau 1–2 phút. Theo
dõi ở tab **Deployments** của project trên Vercel.

Mở địa chỉ Vercel và kiểm tra:

- [ ] Hiện màn hình đăng nhập (không phải trang trắng, không phải "Chưa cấu hình Supabase")
- [ ] Đăng nhập được bằng tài khoản admin
- [ ] Thêm được 1 khách hàng và 1 mặt hàng
- [ ] Thêm giao dịch: chọn khách → SĐT tự điền; chọn mặt hàng → đơn giá tự điền
- [ ] Thành tiền và Còn nợ đổi realtime khi gõ số lượng
- [ ] Tab **Tổng hợp** cộng đúng
- [ ] Bấm **Xuất Excel** → mở file bằng Excel, sửa ô Số lượng thì Thành tiền tự tính lại

---

## Bước 7 — Thêm người dùng khác

1. Gửi cho họ địa chỉ Vercel của bạn
2. Họ tự bấm **Đăng ký**
3. Bạn vào tab **Người dùng** → tài khoản mới nằm ở đầu danh sách với nhãn
   *Chờ duyệt* → bấm **Duyệt**
4. Mặc định họ là **Chỉ xem** (xem và xuất Excel, không sửa được gì). Muốn cho
   toàn quyền thì bấm **Cấp quyền quản trị**

Số tài khoản đang chờ duyệt hiện thành huy hiệu đỏ cạnh mục **Người dùng**.

---

## Xử lý sự cố

| Triệu chứng | Nguyên nhân & cách xử lý |
|---|---|
| Hiện màn hình "Chưa cấu hình Supabase" | Thiếu biến ở Bước 4, hoặc gõ sai tên biến (phải là `VITE_`, không phải `NEXT_PUBLIC_`) |
| Đã thêm biến rồi mà vẫn báo "Chưa cấu hình" | Biến được nhúng lúc build. Vào **Deployments** → **⋯** → **Redeploy** |
| Deploy đỏ trên Vercel | Mở **Build Logs**. Hay gặp nhất là `npm ci` hỏng do `package-lock.json` chưa được commit |
| Trang trắng, Console 404 ở file `.js` | Kiểm tra Output Directory là `dist` trong Settings → Build & Deployment |
| Đăng nhập báo "Email hoặc mật khẩu không đúng" dù gõ đúng | Email chưa xác thực. Kiểm tra hộp thư, hoặc tắt *Confirm email* trong Supabase |
| Bấm link trong email xác thực bị đá về `localhost` | Chưa làm Bước 5 |
| Đăng nhập được nhưng kẹt ở "Đang chờ duyệt" | Tài khoản chưa được duyệt — nhờ admin duyệt, hoặc chạy lại SQL ở Bước 1b |
| Vào được nhưng bảng trống và không thêm được gì | Tài khoản là `user` (chỉ xem). Xem cột **Vai trò** ở tab Người dùng |
| SQL báo `Chỉ quản trị viên mới được đổi vai trò...` | Project đang chạy bản trigger cũ — chạy lại khối SQL ở Bước 1b |
| Sau vài tuần không dùng, web báo lỗi kết nối | Supabase Free tạm dừng project sau 7 ngày không hoạt động. Đăng nhập vào dashboard là chạy lại |

### Xem lỗi thật trong trình duyệt

F12 → tab **Console** và **Network**. Thông báo lỗi trong app đã được dịch sang
tiếng Việt kèm cách khắc phục, nhưng Console cho biết mã lỗi HTTP gốc:

- `401` / `403` → vấn đề quyền (RLS hoặc token hết hạn)
- `404` ở `/rest/v1/nhat_ky` → chưa chạy `supabase/schema.sql`
- `Failed to fetch` → mạng, hoặc project Supabase đang tạm dừng

---

## Cập nhật web về sau

```bash
git add .
git commit -m "Mô tả thay đổi"
git push
```

Vercel tự phát hiện commit mới, build và cập nhật trang sau 1–2 phút. Dữ liệu
nằm trong Supabase nên không bị ảnh hưởng khi deploy lại.

Song song đó, GitHub Actions chạy `npm test` trên mỗi lần push
([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) — Vercel chỉ chạy
`npm run build` chứ không chạy kiểm thử, nên workflow này là lưới an toàn.

### Quay lại dùng GitHub Pages

Cấu hình Pages vẫn còn ở [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
nhưng đã chuyển sang chạy tay để không deploy song song hai nơi. Muốn dùng lại:
vào tab **Actions** → chọn workflow đó → **Run workflow**. Nhớ khai báo hai biến
ở **Settings → Secrets and variables → Actions → Variables** và bật
**Settings → Pages → Source = GitHub Actions**.

## Sao lưu dữ liệu

Supabase → **Database** → **Backups** (gói Free giữ bản sao 7 ngày gần nhất).
Ngoài ra nên bấm **Xuất Excel** định kỳ để có một bản trên máy — file xuất ra
giữ đủ công thức nên dùng thay sổ gốc được.
