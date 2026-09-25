-- ==============================================================================
-- CƠ SỞ DỮ LIỆU SUPABASE CHO HỆ THỐNG QUẢN LÝ BỆNH NHÂN NỘI TRÚ & BÀN GIAO LÂM SÀNG
-- (MedWard Pro - Clinical Handover & Inpatient Management)
-- Phiên bản: Chuẩn hóa 2026 (Đầy đủ các cột tách riêng CLS & Y lệnh + Hỗ trợ Realtime)
-- ==============================================================================

-- 1. BẢNG HỒ SƠ BÁC SĨ (PROFILES)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text not null default '',
  title text default 'Bác sĩ điều trị',
  department text default 'Khoa Nhiễm',
  hospital text default 'Bệnh viện Đa khoa Khu vực Thủ Đức',
  phone text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BẢNG DANH SÁCH BỆNH NHÂN & Y LỆNH (PATIENTS)
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete set null,
  department text default 'Khoa Nhiễm',
  phong_giuong text not null default '',
  ten text not null default '',
  nam_sinh_tuoi text default '',
  chan_doan text default '',
  
  -- CÁC CỘT CẬN LÂM SÀNG & Y LỆNH TÁCH RIÊNG CHUYÊN BIỆT
  cls text default '',                  -- Chuỗi tổng hợp (dùng cho tương thích)
  cls_hien_co text default '',          -- Kết quả CLS hiện có đã trả về
  cls_can_lam text default '',          -- Chỉ định CLS mới cần làm
  y_lenh text default '',               -- Y lệnh điều trị chính & theo dõi
  them_thuoc text default '',           -- Bổ sung thuốc mới cho Điều dưỡng
  
  -- THÔNG TIN BÁC SĨ PHỤ TRÁCH & ĐIỀU TRỊ
  doctor_id text default 'doc_dongnh',
  doctor_name text default 'BS. Nguyễn Hữu Đông',

  sort_order integer default 0,
  
  -- CÁC TRƯỜNG PHỤC VỤ BÀN GIAO TRỰC (CLINICAL HANDOVER)
  -- Trạng thái: 'none' (ổn định), 'pending' (cần bàn giao), 'critical' (báo động đỏ), 'resolved' (đã xử trí)
  handover_status text default 'none',
  handover_issues text default '',      -- Vấn đề lâm sàng tồn đọng
  handover_actions text default '',     -- Y lệnh / Hành động tua trực cần làm
  handover_by text default '',          -- Bác sĩ bàn giao
  handover_by_id uuid references auth.users on delete set null,
  handover_at timestamp with time zone, -- Thời điểm bàn giao
  handover_resolved_by text default '', -- Bác sĩ trực đã xử trí
  handover_resolved_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BẢNG THIẾT LẬP KHOA PHÒNG / TIÊU ĐỀ (DEPARTMENT_SETTINGS)
create table if not exists public.department_settings (
  id uuid default gen_random_uuid() primary key,
  department text not null default 'Khoa Nhiễm',
  hospital text not null default 'Bệnh viện Đa khoa Khu vực Thủ Đức',
  unit text not null default 'Sở Y tế TP. Hồ Chí Minh',
  main_title text not null default 'BẢNG THEO DÕI & Y LỆNH BỆNH NHÂN NỘI TRÚ',
  sub_title text not null default '(Giao ban - Đi buồng - Theo dõi SOAP lâm sàng & Bàn giao trực)',
  updated_by uuid references auth.users on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- BẬT ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.department_settings enable row level security;

-- CHÍNH SÁCH BẢO MẬT (POLICIES)
-- Cho phép truy cập thông suốt cả khi đã đăng nhập (authenticated) và khi dùng nhanh qua mã PIN (anon key của khoa)

-- Profiles
drop policy if exists "Cho phép xem hồ sơ" on public.profiles;
create policy "Cho phép xem hồ sơ" on public.profiles for select using (true);

drop policy if exists "Cho phép cập nhật hồ sơ" on public.profiles;
create policy "Cho phép cập nhật hồ sơ" on public.profiles for all using (true) with check (true);

-- Patients
drop policy if exists "Cho phép xem danh sách người bệnh" on public.patients;
create policy "Cho phép xem danh sách người bệnh" on public.patients for select using (true);

drop policy if exists "Cho phép thêm người bệnh" on public.patients;
create policy "Cho phép thêm người bệnh" on public.patients for insert with check (true);

drop policy if exists "Cho phép cập nhật người bệnh" on public.patients;
create policy "Cho phép cập nhật người bệnh" on public.patients for update using (true) with check (true);

drop policy if exists "Cho phép xóa người bệnh" on public.patients;
create policy "Cho phép xóa người bệnh" on public.patients for delete using (true);

-- Department Settings
drop policy if exists "Cho phép xem cài đặt khoa phòng" on public.department_settings;
create policy "Cho phép xem cài đặt khoa phòng" on public.department_settings for select using (true);

drop policy if exists "Cho phép cập nhật cài đặt khoa phòng" on public.department_settings;
create policy "Cho phép cập nhật cài đặt khoa phòng" on public.department_settings for all using (true) with check (true);

-- BẬT SUPABASE REALTIME ĐỂ ĐỒNG BỘ TỨC THÌ GIỮA CÁC THIẾT BỊ
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.department_settings;

-- TỰ ĐỘNG CẬP NHẬT updated_at KHI CÓ THAY ĐỔI
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_patients_updated_at on public.patients;
create trigger set_patients_updated_at
  before update on public.patients
  for each row execute function public.handle_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
