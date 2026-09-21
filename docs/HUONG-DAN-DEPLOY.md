# Hướng dẫn đưa web lên mạng để dùng thật

Hướng dẫn từng bước để chạy app trên GitHub Pages với dữ liệu thật trên Supabase.

**Trạng thái hiện tại của bạn**

| | |
|---|---|
| Project Supabase | ✅ đã tạo — `lszwvjooihyfbuekaucw` |
| Chạy `supabase/schema.sql` | ✅ đã chạy |
| File `.env.local` ở máy | ✅ đã tạo đúng |
| Repo GitHub | ✅ `github.com/lmt3001/congnokhachhang` |
| Vá trigger + cấp quyền admin đầu tiên | ⬜ **Bước 1** |
| Bật GitHub Pages | ⬜ **Bước 3** |
| Khai báo Variables trên GitHub | ⬜ **Bước 4** |
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

Có một commit dọn dẹp đang chờ (gỡ 4,6 MB công cụ Claude Code khỏi repo public).

> **Lưu ý về lịch sử git:** commit đầu tiên đã đẩy lên vẫn còn chứa các file đó
> trong lịch sử. Chúng chỉ là dữ liệu thiết kế dạng CSV, không phải bí mật, nên
> để vậy cũng được. Nếu muốn xoá sạch khỏi lịch sử thì cách gọn nhất là xoá repo
> trên GitHub rồi tạo lại và push lại từ đầu.

---

## Bước 3 — Bật GitHub Pages

1. Mở https://github.com/lmt3001/congnokhachhang
2. **Settings** (tab trên cùng) → **Pages** (menu trái)
3. Mục **Build and deployment** → **Source** → chọn **GitHub Actions**
4. Không cần chọn nhánh hay thư mục, cũng không cần bấm Save

> Tài khoản GitHub miễn phí chỉ bật được Pages cho **repo public**. Nếu repo
> đang private, GitHub sẽ báo cần nâng cấp Pro.

---

## Bước 4 — Khai báo biến môi trường trên GitHub

File `.env.local` chỉ có trên máy bạn và đã bị `.gitignore` chặn, nên GitHub
không biết gì về nó. Phải khai báo lại:

1. **Settings** → **Secrets and variables** → **Actions**
2. Chọn tab **Variables** (không phải Secrets) → **New repository variable**
3. Tạo hai biến:

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | `https://lszwvjooihyfbuekaucw.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | `sb_publishable_...` (key của bạn) |

> **Vì sao là Variables chứ không phải Secrets?** Hai giá trị này được nhúng
> thẳng vào JavaScript gửi tới trình duyệt nên về bản chất là công khai —
> Supabase thiết kế publishable key đúng như vậy. Việc chặn truy cập nằm hoàn
> toàn ở Row Level Security trong Postgres. Để ở Secrets cũng chạy được nhưng
> gây hiểu nhầm rằng chúng bí mật, và log sẽ bị che thành `***` khó soát lỗi.

Workflow có kiểm tra sẵn: thiếu biến nào nó sẽ dừng với thông báo rõ ràng chứ
không build ra một trang trắng.

---

## Bước 5 — Cấu hình URL trên Supabase

Địa chỉ web của bạn sẽ là:

```
https://lmt3001.github.io/congnokhachhang/
```

Vào Supabase → **Authentication** → **URL Configuration**:

| Trường | Giá trị |
|---|---|
| **Site URL** | `https://lmt3001.github.io/congnokhachhang/` |
| **Redirect URLs** | thêm `https://lmt3001.github.io/congnokhachhang/**` |

Bước này cần cho liên kết **xác thực email** và **đặt lại mật khẩu** — thiếu nó
thì người dùng bấm vào link trong mail sẽ bị đá về `localhost`.

Nếu vẫn muốn chạy ở máy song song, thêm luôn `http://localhost:5173/**` vào
Redirect URLs.

---

## Bước 6 — Chạy deploy và kiểm tra

Push lên nhánh `main` là workflow tự chạy. Theo dõi ở tab **Actions** của repo.

Ba job chạy lần lượt: **Kiểm thử** → **Build** → **Deploy**. Lần đầu mất khoảng
1–2 phút.

Xong thì mở https://lmt3001.github.io/congnokhachhang/ và kiểm tra:

- [ ] Hiện màn hình đăng nhập (không phải trang trắng, không phải "Chưa cấu hình Supabase")
- [ ] Đăng nhập được bằng tài khoản admin
- [ ] Thêm được 1 khách hàng và 1 mặt hàng
- [ ] Thêm giao dịch: chọn khách → SĐT tự điền; chọn mặt hàng → đơn giá tự điền
- [ ] Thành tiền và Còn nợ đổi realtime khi gõ số lượng
- [ ] Tab **Tổng hợp** cộng đúng
- [ ] Bấm **Xuất Excel** → mở file bằng Excel, sửa ô Số lượng thì Thành tiền tự tính lại

---

## Bước 7 — Thêm người dùng khác

1. Gửi cho họ địa chỉ `https://lmt3001.github.io/congnokhachhang/`
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
| Trang trắng, Console báo lỗi 404 ở file `.js` | Chưa chọn Source = **GitHub Actions** ở Bước 3 |
| Hiện màn hình "Chưa cấu hình Supabase" | Thiếu Variables ở Bước 4, hoặc gõ sai tên biến (phải là `VITE_`, không phải `NEXT_PUBLIC_`) |
| Workflow đỏ ở job **Build** | Đọc log — workflow tự báo rõ nếu thiếu biến |
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

Workflow tự chạy lại và cập nhật trang sau 1–2 phút. Dữ liệu nằm trong Supabase
nên không bị ảnh hưởng khi deploy lại.

## Sao lưu dữ liệu

Supabase → **Database** → **Backups** (gói Free giữ bản sao 7 ngày gần nhất).
Ngoài ra nên bấm **Xuất Excel** định kỳ để có một bản trên máy — file xuất ra
giữ đủ công thức nên dùng thay sổ gốc được.
