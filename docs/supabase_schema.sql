-- ==============================================================================
-- CƠ SỞ DỮ LIỆU SUPABASE MEDWARD PRO - CHUẨN HÓA TOÀN DIỆN 2026
-- Hệ thống Quản lý Bệnh nhân Nội trú, Bàn giao Lâm sàng & Đồng bộ Đa thiết bị
-- (Laptop <-> Mobile Realtime Sync, Multi-Doctor Workspaces & Date Partitions)
-- ==============================================================================

-- 1. BẬT EXTENSION CẦN THIẾT
create extension if not exists "uuid-ossp";

-- ==============================================================================
-- 2. BẢNG HỒ SƠ BÁC SĨ (PROFILES)
-- ==============================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  username text unique,
  full_name text not null default '',
  title text default 'Bác sĩ điều trị',
  department text default 'Khoa Nhiễm',
  hospital text default 'Bệnh viện Đa khoa Khu vực Thủ Đức',
  phone text default '',
  role text default 'doctor',            -- 'admin' (BS. Đông) | 'doctor' | 'nurse'
  pin text default '123456',             -- Mã PIN mở khóa nhanh 6 số
  is_active boolean default true,
  storage_limit_mb integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_role on public.profiles(role);

-- ==============================================================================
-- 3. BẢNG QUẢN LÝ NGÀY LÀM VIỆC & CA TRỰC (WORK_DAYS)
-- Đồng bộ Active Date thống nhất giữa Laptop và Mobile
-- ==============================================================================
create table if not exists public.work_days (
  report_date date primary key default current_date,
  department text not null default 'Khoa Nhiễm',
  status text not null default 'active',  -- 'active' (ngày đang làm) | 'archived' (ngày cũ đã khóa)
  doctor_on_duty text default '',        -- Bác sĩ trưởng tua trực
  total_patients integer default 0,
  handover_notes text default '',
  created_by uuid references auth.users on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_work_days_status on public.work_days(status);

-- ==============================================================================
-- 4. BẢNG DANH SÁCH BỆNH NHÂN & Y LỆNH (PATIENTS)
-- Phân vùng dữ liệu theo report_date để tách biệt ngày cũ và ngày mới
-- ==============================================================================
create table if not exists public.patients (
  id uuid default gen_random_uuid() primary key,
  report_date date not null default current_date,  -- PHÂN VÙNG THEO NGÀY (CỐT LÕI)
  user_id uuid references auth.users on delete set null,
  department text default 'Khoa Nhiễm',
  
  -- THÔNG TIN HÀNH CHÍNH
  phong_giuong text not null default '',
  ten text not null default '',
  nam_sinh_tuoi text default '',
  chan_doan text default '',
  
  -- LÂM SÀNG, CLS VÀ Y LỆNH
  cls text default '',                  -- Chuỗi tương thích ngược
  cls_hien_co text default '',          -- CLS hiện có
  cls_can_lam text default '',          -- CLS cần làm thêm
  y_lenh text default '',               -- Y lệnh điều trị chính
  them_thuoc text default '',           -- Thuốc bổ sung trong ngày
  
  -- BÁC SĨ PHỤ TRÁCH
  doctor_id text default 'doc_dongnh',
  doctor_name text default 'BS. Nguyễn Hữu Đông',
  sort_order integer default 0,
  
  -- TRẠNG THÁI NẰM VIỆN & QUẢN TRỊ
  is_discharged boolean default false,  -- Đã ra viện / chuyển viện
  is_deleted boolean default false,     -- Soft delete chống lỗi Zombie record
  
  -- THÔNG TIN BÀN GIAO LÂM SÀNG (HANDOVER)
  handover_status text default 'none',  -- 'none' | 'pending' | 'critical' | 'resolved'
  handover_issues text default '',
  handover_actions text default '',
  handover_by text default '',
  handover_by_id uuid references auth.users on delete set null,
  handover_at timestamp with time zone,
  handover_resolved_by text default '',
  handover_resolved_at timestamp with time zone,
  
  -- KIỂM SOÁT ĐỒNG BỘ ĐA THIẾT BỊ
  version bigint default 1,
  last_client_id text default '',
  client_updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- INDEXES TỐI ƯU TRUY VẤN THEO NGÀY VÀ BÁC SĨ
create index if not exists idx_patients_report_date on public.patients(report_date);
create index if not exists idx_patients_date_doctor on public.patients(report_date, doctor_id);
create index if not exists idx_patients_date_deleted on public.patients(report_date, is_deleted);
create index if not exists idx_patients_handover_status on public.patients(handover_status);

-- ==============================================================================
-- 5. BẢNG NHẬT KÝ BÀN GIAO TRỰC TOÀN KHOA (HANDOVER_LOGS)
-- Đồng bộ lịch sử bàn giao giao ban ca trực giữa Laptop và Mobile
-- ==============================================================================
create table if not exists public.handover_logs (
  id uuid default gen_random_uuid() primary key,
  patient_id uuid references public.patients(id) on delete cascade,
  report_date date not null default current_date,
  patient_name text not null default '',
  phong_giuong text default '',
  status text not null default 'pending',
  issues text default '',
  actions text default '',
  doctor_from text default '',
  doctor_to text default '',
  resolved_by text default '',
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_handover_logs_date on public.handover_logs(report_date);

-- ==============================================================================
-- 6. BẢNG THIẾT LẬP KHOA PHÒNG & TIÊU ĐỀ (DEPARTMENT_SETTINGS)
-- ==============================================================================
create table if not exists public.department_settings (
  id uuid default gen_random_uuid() primary key,
  department text not null default 'Khoa Nhiễm',
  hospital text not null default 'Bệnh viện Đa khoa Khu vực Thủ Đức',
  unit text not null default 'Sở Y tế TP. Hồ Chí Minh',
  main_title text not null default 'BẢNG THEO DÕI & Y LỆNH BỆNH NHÂN NỘI TRÚ',
  sub_title text not null default '(Giao ban - Đi buồng - Theo dõi SOAP lâm sàng & Bàn giao trực)',
  active_date date default current_date,  -- Ngày trực hiện hành đồng bộ cho cả khoa
  updated_by uuid references auth.users on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- 7. THIẾT LẬP BẢO MẬT ROW LEVEL SECURITY (RLS)
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.work_days enable row level security;
alter table public.patients enable row level security;
alter table public.handover_logs enable row level security;
alter table public.department_settings enable row level security;

-- Policies: Cho phép đọc ghi thông suốt phục vụ cả tài khoản Supabase Auth và anon key
drop policy if exists "Profiles access policy" on public.profiles;
create policy "Profiles access policy" on public.profiles for all using (true) with check (true);

drop policy if exists "Work days access policy" on public.work_days;
create policy "Work days access policy" on public.work_days for all using (true) with check (true);

drop policy if exists "Patients access policy" on public.patients;
create policy "Patients access policy" on public.patients for all using (true) with check (true);

drop policy if exists "Handover logs access policy" on public.handover_logs;
create policy "Handover logs access policy" on public.handover_logs for all using (true) with check (true);

drop policy if exists "Department settings access policy" on public.department_settings;
create policy "Department settings access policy" on public.department_settings for all using (true) with check (true);

-- ==============================================================================
-- 8. KÍCH HOẠT REPLICA IDENTITY FULL & SUPABASE REALTIME
-- Bắt buộc có REPLICA IDENTITY FULL để nhận đầy đủ payload cũ khi UPDATE / DELETE
-- ==============================================================================
alter table public.patients replica identity full;
alter table public.work_days replica identity full;
alter table public.handover_logs replica identity full;
alter table public.department_settings replica identity full;
alter table public.profiles replica identity full;

begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.work_days;
alter publication supabase_realtime add table public.handover_logs;
alter publication supabase_realtime add table public.department_settings;
alter publication supabase_realtime add table public.profiles;

-- ==============================================================================
-- 9. TRIGGERS TỰ ĐỘNG CẬP NHẬT UPDATED_AT & TĂNG VERSION
-- ==============================================================================
create or replace function public.handle_patient_sync_version()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  if old is not null then
    new.version = coalesce(old.version, 0) + 1;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_patients_version_sync on public.patients;
create trigger set_patients_version_sync
  before update on public.patients
  for each row execute function public.handle_patient_sync_version();

create or replace function public.handle_general_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_general_updated_at();

drop trigger if exists set_work_days_updated_at on public.work_days;
create trigger set_work_days_updated_at
  before update on public.work_days
  for each row execute function public.handle_general_updated_at();

drop trigger if exists set_department_settings_updated_at on public.department_settings;
create trigger set_department_settings_updated_at
  before update on public.department_settings
  for each row execute function public.handle_general_updated_at();
