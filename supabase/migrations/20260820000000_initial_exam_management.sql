create extension if not exists "pgcrypto";

create table if not exists public.school_years (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  starts_on date,
  ends_on date,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  civility text not null check (civility in ('Madame', 'Monsieur')),
  first_name text not null,
  last_name text not null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  class_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  name text not null,
  capacity integer not null default 0 check (capacity >= 0),
  created_at timestamptz not null default now(),
  unique (school_year_id, name)
);

create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  title text not null,
  exam_type text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.surveillance_assignments (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  mission text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists teachers_school_year_idx on public.teachers(school_year_id);
create index if not exists students_school_year_idx on public.students(school_year_id);
create index if not exists rooms_school_year_idx on public.rooms(school_year_id);
create index if not exists exams_school_year_idx on public.exams(school_year_id);
create index if not exists assignments_exam_idx on public.surveillance_assignments(exam_id);

alter table public.school_years enable row level security;
alter table public.teachers enable row level security;
alter table public.students enable row level security;
alter table public.rooms enable row level security;
alter table public.exams enable row level security;
alter table public.surveillance_assignments enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public stable
as $$ select exists (select 1 from public.admin_users where user_id = auth.uid()); $$;

create policy "Published school years are readable" on public.school_years for select
using (is_published = true or public.is_admin());
create policy "Published teachers are readable" on public.teachers for select
using (public.is_admin() or exists (select 1 from public.school_years y where y.id = school_year_id and y.is_published = true));
create policy "Published students are readable" on public.students for select
using (public.is_admin() or exists (select 1 from public.school_years y where y.id = school_year_id and y.is_published = true));
create policy "Published rooms are readable" on public.rooms for select
using (public.is_admin() or exists (select 1 from public.school_years y where y.id = school_year_id and y.is_published = true));
create policy "Published exams are readable" on public.exams for select
using (is_published = true or public.is_admin());
create policy "Published assignments are readable" on public.surveillance_assignments for select
using (public.is_admin() or exists (select 1 from public.exams e where e.id = exam_id and e.is_published = true));

create policy "Admins manage school years" on public.school_years for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage teachers" on public.teachers for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage students" on public.students for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage rooms" on public.rooms for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage exams" on public.exams for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage assignments" on public.surveillance_assignments for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins read admin users" on public.admin_users for select using (public.is_admin());

create or replace function public.delete_school_year(target_id uuid)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Only administrators can delete a school year'; end if;
  delete from public.school_years where id = target_id;
end;
$$;

revoke all on function public.delete_school_year(uuid) from public;
grant execute on function public.delete_school_year(uuid) to authenticated;
