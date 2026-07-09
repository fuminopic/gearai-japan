alter table public.mountain_foundation_profiles
  add column if not exists planning_status text not null default 'PLANNABLE';

update public.mountain_foundation_profiles
set planning_status = 'PLANNABLE'
where planning_status is null;

update public.mountain_foundation_profiles
set planning_status = 'NOT_STANDARD_ROUTE'
where slug = 'oizuru-gatake';
