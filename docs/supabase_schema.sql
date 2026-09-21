-- ==============================================================================
-- CƠ SỞ DỮ LIỆU SUPABASE CHO HỆ THỐNG BỆNH NHÂN NỘI TRÚ & BÀN GIAO TRỰC LÂM SÀNG
-- (MedWard Pro - Clinical Handover & Inpatient Management)
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
  user_id uuid references auth.users on delete cascade,
  department text default 'Khoa Nhiễm',
  phong_giuong text not null default '',
  ten text not null default '',
  nam_sinh_tuoi text default '',
  chan_doan text default '',
  cls text default '',
  y_lenh text default '',
  sort_order integer default 0,
  
  -- CÁC TRƯỜNG PHỤC VỤ BÀN GIAO TRỰC (CLINICAL HANDOVER)
  -- Trạng thái: 'none' (bình thường), 'pending' (vấn đề chưa xong/cần bàn giao), 'critical' (báo động đỏ/nguy kịch), 'resolved' (đã xử trí)
  handover_status text default 'none',
  handover_issues text default '',      -- Vấn đề lâm sàng chưa giải quyết xong
  handover_actions text default '',     -- Y lệnh/Hành động tua trực cần làm
  handover_by text default '',          -- Bác sĩ bàn giao
  handover_by_id uuid references auth.users on delete set null,
  handover_at timestamp with time zone, -- Thời điểm bàn giao
  handover_resolved_by text default '', -- Bác sĩ trực đã xử trí
  handover_resolved_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. BẢNG THIẾT LẬP KHOA PHÒNG / BÁO CÁO (DEPARTMENT_SETTINGS)
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
-- Profiles: Mỗi user có thể xem và cập nhật hồ sơ của chính mình hoặc xem đồng nghiệp cùng khoa
create policy "Cho phép xem hồ sơ cá nhân và đồng nghiệp" 
  on public.profiles for select 
  using (auth.role() = 'authenticated');

create policy "Người dùng cập nhật hồ sơ của mình" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Tự động chèn hồ sơ khi đăng ký" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Patients: Bác sĩ đã xác thực có thể xem, thêm, sửa, xóa bệnh nhân
create policy "Bác sĩ xem danh sách bệnh nhân" 
  on public.patients for select 
  using (auth.role() = 'authenticated');

create policy "Bác sĩ thêm bệnh nhân" 
  on public.patients for insert 
  with check (auth.role() = 'authenticated');

create policy "Bác sĩ cập nhật thông tin và bàn giao bệnh nhân" 
  on public.patients for update 
  using (auth.role() = 'authenticated');

create policy "Bác sĩ xóa bệnh nhân" 
  on public.patients for delete 
  using (auth.role() = 'authenticated');

-- Department Settings: Cho phép đọc và cập nhật
create policy "Mọi bác sĩ xem thông tin khoa phòng"
  on public.department_settings for select
  using (auth.role() = 'authenticated');

create policy "Bác sĩ cập nhật thông tin khoa phòng"
  on public.department_settings for all
  using (auth.role() = 'authenticated');

-- BẬT SUPABASE REALTIME ĐỂ ĐỒNG BỘ TỨC THÌ GIỮA LAPTOP VÀ DI ĐỘNG
begin;
  -- Bỏ publication nếu đã có để refresh
  drop publication if exists supabase_realtime;
  create publication supabase_realtime;
commit;

alter publication supabase_realtime add table public.patients;
alter publication supabase_realtime add table public.profiles;

-- TỰ ĐỘNG CẬP NHẬT updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create or replace trigger set_patients_updated_at
  before update on public.patients
  for each row execute function public.handle_updated_at();

create or replace trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();
