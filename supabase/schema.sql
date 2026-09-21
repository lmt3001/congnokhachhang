-- ============================================================================
--  Quản lý công nợ khách hàng — schema Supabase
--  Chạy toàn bộ file này một lần trong Supabase Studio > SQL Editor.
--  An toàn khi chạy lại (idempotent).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. BẢNG
-- ---------------------------------------------------------------------------

-- Hồ sơ người dùng, quan hệ 1-1 với auth.users.
-- Người mới đăng ký mặc định role='user', status='pending' → admin phải duyệt.
create table if not exists public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  email      text not null,
  ho_ten     text,
  role       text not null default 'user'    check (role   in ('admin', 'user')),
  status     text not null default 'pending' check (status in ('pending', 'active', 'disabled')),
  created_at timestamptz not null default now()
);

create table if not exists public.khach_hang (
  id         uuid primary key default gen_random_uuid(),
  ten        text not null,
  sdt        text,
  dia_chi    text,
  ghi_chu    text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users on delete set null
);

create table if not exists public.mat_hang (
  id         uuid primary key default gen_random_uuid(),
  ten        text not null,
  dvt        text,
  don_gia    numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users on delete set null
);

-- Sổ nhật ký bán hàng.
-- ten_kh / mat_hang cố ý là text tự do (không phải khoá ngoại) để giữ đúng
-- hành vi của file Excel gốc: combobox cho phép gõ tên chưa có trong danh mục,
-- và xoá một khách hàng không làm mất lịch sử giao dịch của họ.
create table if not exists public.nhat_ky (
  id            uuid primary key default gen_random_uuid(),
  ngay          date not null,
  ten_kh        text not null,
  sdt           text,
  mat_hang      text not null,
  so_luong      numeric(14, 3) not null,
  don_gia       numeric(14, 2) not null,
  da_thanh_toan numeric(14, 2) not null default 0,
  ghi_chu       text,
  -- Hai cột dưới là công thức H=F*G và J=H-I của Excel, ép ở tầng database
  -- nên không client nào ghi sai được.
  thanh_tien    numeric(14, 2) generated always as (so_luong * don_gia) stored,
  con_no        numeric(14, 2) generated always as (so_luong * don_gia - da_thanh_toan) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  created_by    uuid references auth.users on delete set null
);

create index if not exists nhat_ky_ngay_idx    on public.nhat_ky (ngay desc);
create index if not exists nhat_ky_ten_kh_idx  on public.nhat_ky (lower(trim(ten_kh)));
create index if not exists khach_hang_ten_idx  on public.khach_hang (lower(trim(ten)));
create index if not exists mat_hang_ten_idx    on public.mat_hang   (lower(trim(ten)));

-- ---------------------------------------------------------------------------
-- 2. HÀM KIỂM TRA QUYỀN
--    security definer để tránh đệ quy RLS khi policy của profiles đọc profiles.
-- ---------------------------------------------------------------------------

create or replace function public.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and status = 'active'
  );
$$;

create or replace function public.is_active_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and status = 'active'
  );
$$;

revoke execute on function public.is_active_admin()  from public;
revoke execute on function public.is_active_member() from public;
grant  execute on function public.is_active_admin()  to authenticated;
grant  execute on function public.is_active_member() to authenticated;

-- ---------------------------------------------------------------------------
-- 3. VIEW TỔNG HỢP  (thay hoàn toàn macro VBA CapNhatTongHop)
--    Gom nhóm theo LCase(Trim(tên)) và lấy SĐT khác rỗng mới nhất — đúng
--    ngữ nghĩa của macro gốc.
--    security_invoker BẮT BUỘC: mặc định view chạy bằng quyền owner và sẽ đi
--    vòng qua RLS của bảng nền.
-- ---------------------------------------------------------------------------

create or replace view public.v_tong_hop
with (security_invoker = true) as
select
  lower(trim(ten_kh))                                as kh_key,
  (array_agg(ten_kh order by created_at))[1]         as ten_kh,
  (array_agg(sdt order by created_at desc)
     filter (where coalesce(trim(sdt), '') <> ''))[1] as sdt,
  count(*)                                           as so_giao_dich,
  sum(thanh_tien)                                    as tong_ban,
  sum(da_thanh_toan)                                 as tong_thu,
  sum(con_no)                                        as con_no
from public.nhat_ky
where coalesce(trim(ten_kh), '') <> ''
group by lower(trim(ten_kh));

-- Cấp quyền tường minh (không phụ thuộc default privileges của project).
grant select                         on public.v_tong_hop to authenticated;
grant select, insert, update, delete on public.khach_hang to authenticated;
grant select, insert, update, delete on public.mat_hang   to authenticated;
grant select, insert, update, delete on public.nhat_ky    to authenticated;
grant select,         update, delete on public.profiles   to authenticated;

-- ---------------------------------------------------------------------------
-- 4. TRIGGER
-- ---------------------------------------------------------------------------

-- 4a. Tự tạo hồ sơ khi có người đăng ký.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, ho_ten)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'ho_ten', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4b. Chặn tự nâng quyền.
-- RLS chỉ chặn được ở mức dòng; người dùng vẫn được UPDATE dòng của chính mình
-- (để sửa họ tên), nên phải chặn riêng ở mức cột.
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Câu lệnh không đến từ một người dùng đã đăng nhập (SQL Editor, service_role
  -- key, migration) thì bỏ qua mọi kiểm tra ở đây.
  --
  -- Bắt buộc phải có nhánh này: nếu không thì không tạo được quản trị viên đầu
  -- tiên — trigger đòi phải đã là admin mới được cấp quyền admin.
  --
  -- Không mở thêm lỗ hổng nào: client web chưa đăng nhập mang role `anon`, mà
  -- policy profiles_update chỉ cấp cho `authenticated`, nên RLS đã chặn từ
  -- trước khi chạm tới trigger. Còn service_role thì vốn đã bỏ qua RLS.
  if auth.uid() is null then
    return new;
  end if;

  if (new.role is distinct from old.role or new.status is distinct from old.status)
     and not public.is_active_admin() then
    raise exception 'Chỉ quản trị viên mới được đổi vai trò hoặc trạng thái tài khoản.'
      using errcode = '42501';
  end if;

  -- Không cho phép hạ quyền / vô hiệu hoá admin hoạt động cuối cùng
  -- (dù là tự làm với mình hay admin khác làm), tránh khoá chết hệ thống.
  if old.role = 'admin' and old.status = 'active'
     and (new.role <> 'admin' or new.status <> 'active')
     and (select count(*) from public.profiles
          where role = 'admin' and status = 'active') <= 1 then
    raise exception 'Không thể hạ quyền quản trị viên hoạt động cuối cùng.'
      using errcode = '42501';
  end if;

  new.id         := old.id;          -- khoá các cột không được đổi
  new.email      := old.email;
  new.created_at := old.created_at;
  return new;
end;
$$;

drop trigger if exists guard_profile_changes on public.profiles;
create trigger guard_profile_changes
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

-- 4c. Tự cập nhật updated_at cho nhat_ky.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists nhat_ky_touch_updated_at on public.nhat_ky;
create trigger nhat_ky_touch_updated_at
  before update on public.nhat_ky
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--    Đây là lớp chặn thật. Frontend chỉ ẩn/hiện nút cho gọn mắt.
-- ---------------------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.khach_hang enable row level security;
alter table public.mat_hang   enable row level security;
alter table public.nhat_ky    enable row level security;

-- 5a. profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_active_admin());

-- Người dùng được update dòng của mình (chỉ đổi được ho_ten — trigger 4b khoá
-- role/status/email/id lại), admin update được mọi dòng.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using      (id = auth.uid() or public.is_active_admin())
  with check (id = auth.uid() or public.is_active_admin());

-- Chỉ trigger handle_new_user (security definer) được insert.
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles
  for delete to authenticated
  using (public.is_active_admin() and id <> auth.uid());

-- 5b. Ba bảng nghiệp vụ: thành viên active đọc được, chỉ admin ghi được.
do $$
declare t text;
begin
  foreach t in array array['khach_hang', 'mat_hang', 'nhat_ky'] loop
    execute format('drop policy if exists %I_select on public.%I', t, t);
    execute format(
      'create policy %I_select on public.%I for select to authenticated
         using (public.is_active_member())', t, t);

    execute format('drop policy if exists %I_insert on public.%I', t, t);
    execute format(
      'create policy %I_insert on public.%I for insert to authenticated
         with check (public.is_active_admin())', t, t);

    execute format('drop policy if exists %I_update on public.%I', t, t);
    execute format(
      'create policy %I_update on public.%I for update to authenticated
         using (public.is_active_admin()) with check (public.is_active_admin())', t, t);

    execute format('drop policy if exists %I_delete on public.%I', t, t);
    execute format(
      'create policy %I_delete on public.%I for delete to authenticated
         using (public.is_active_admin())', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6. REALTIME — nhiều máy thấy thay đổi ngay, không phải F5.
--    Realtime vẫn đi qua RLS nên không rò dữ liệu cho tài khoản pending.
-- ---------------------------------------------------------------------------

do $$
begin
  alter publication supabase_realtime add table public.khach_hang;
exception when duplicate_object then null; end $$;

do $$
begin
  alter publication supabase_realtime add table public.mat_hang;
exception when duplicate_object then null; end $$;

do $$
begin
  alter publication supabase_realtime add table public.nhat_ky;
exception when duplicate_object then null; end $$;

-- ============================================================================
--  BƯỚC CUỐI — BOOTSTRAP QUẢN TRỊ VIÊN ĐẦU TIÊN
--
--  Trigger ở trên đặt mọi tài khoản mới vào trạng thái 'pending', nên ngay sau
--  khi cài đặt sẽ chưa có ai duyệt được ai. Hãy:
--    1. Mở web, bấm "Đăng ký" và tạo tài khoản bằng email của bạn.
--    2. Quay lại SQL Editor, bỏ chú thích khối dưới, thay email, rồi chạy:
--
--  update public.profiles set role = 'admin', status = 'active'
--  where email = 'email-cua-ban@example.com';
--
--    3. Đăng nhập lại — từ giờ bạn duyệt được các tài khoản khác trong app.
--
--  Chạy trong SQL Editor thì auth.uid() là NULL nên guard_profile_changes()
--  bỏ qua kiểm tra và câu lệnh trên chạy được. Nếu gặp lỗi
--  "Chỉ quản trị viên mới được đổi vai trò hoặc trạng thái tài khoản."
--  nghĩa là project đang chạy bản trigger cũ — hãy chạy lại toàn bộ file này
--  để cập nhật rồi thử lại.
-- ============================================================================
