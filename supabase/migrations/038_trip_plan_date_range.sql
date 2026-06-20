alter table public.trip_plans
  add column if not exists planned_end_date date;

create index if not exists trip_plans_user_id_planned_date_range_idx
on public.trip_plans(user_id, planned_date desc nulls last, planned_end_date desc nulls last, created_at desc);
