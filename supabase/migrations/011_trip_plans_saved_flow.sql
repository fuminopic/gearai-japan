create table if not exists public.trip_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mountain_slug text references public.mountain_foundation_profiles(slug) on delete set null,
  mountain_name text not null,
  season text not null
    check (season in ('SPRING', 'SUMMER', 'AUTUMN', 'WINTER')),
  style text not null
    check (
      style in (
        'DAY_HIKE',
        'OVERNIGHT_HUT',
        'OVERNIGHT_TENT',
        'MULTI_DAY_TREK'
      )
    ),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists trip_plans_user_id_created_at_idx
on public.trip_plans(user_id, created_at desc);

alter table public.trip_plans enable row level security;

drop policy if exists "trip_plans_select_own" on public.trip_plans;
create policy "trip_plans_select_own"
on public.trip_plans for select
using (auth.uid() = user_id);

drop policy if exists "trip_plans_insert_own" on public.trip_plans;
create policy "trip_plans_insert_own"
on public.trip_plans for insert
with check (auth.uid() = user_id);

drop policy if exists "trip_plans_delete_own" on public.trip_plans;
create policy "trip_plans_delete_own"
on public.trip_plans for delete
using (auth.uid() = user_id);
