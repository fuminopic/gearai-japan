alter table public.trip_plans
  add column if not exists planned_date date,
  add column if not exists trip_memo text,
  add column if not exists bring_cash boolean not null default false,
  add column if not exists has_mountain_insurance boolean not null default false;

create index if not exists trip_plans_user_id_planned_date_idx
on public.trip_plans(user_id, planned_date desc nulls last, created_at desc);
