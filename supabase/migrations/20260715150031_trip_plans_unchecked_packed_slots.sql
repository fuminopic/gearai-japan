alter table public.trip_plans
  add column if not exists unchecked_packed_slots text[] not null default '{}'::text[];
