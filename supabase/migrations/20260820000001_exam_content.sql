create table if not exists public.exam_candidates (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  room_id uuid references public.rooms(id) on delete set null,
  convocation_at timestamptz,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (exam_id, student_id)
);

create table if not exists public.accommodations (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  title text not null,
  details text not null,
  is_confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_year_id uuid not null references public.school_years(id) on delete cascade,
  title text not null,
  content text not null,
  priority text not null default 'information' check (priority in ('information', 'important', 'urgent')),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists candidates_exam_idx on public.exam_candidates(exam_id);
create index if not exists candidates_student_idx on public.exam_candidates(student_id);
create index if not exists accommodations_year_idx on public.accommodations(school_year_id);
create index if not exists announcements_year_idx on public.announcements(school_year_id);

alter table public.exam_candidates enable row level security;
alter table public.accommodations enable row level security;
alter table public.announcements enable row level security;

create policy "Published candidates are readable" on public.exam_candidates for select
using (public.is_admin() or exists (select 1 from public.exams e where e.id = exam_id and e.is_published = true));
create policy "Published accommodations are readable" on public.accommodations for select
using (public.is_admin() or exists (select 1 from public.school_years y where y.id = school_year_id and y.is_published = true));
create policy "Published announcements are readable" on public.announcements for select
using (is_published = true or public.is_admin());

create policy "Admins manage candidates" on public.exam_candidates for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage accommodations" on public.accommodations for all using (public.is_admin()) with check (public.is_admin());
create policy "Admins manage announcements" on public.announcements for all using (public.is_admin()) with check (public.is_admin());