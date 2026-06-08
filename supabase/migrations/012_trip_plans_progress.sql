alter table public.trip_plans
  add column if not exists progress integer not null default 0
    check (progress >= 0 and progress <= 100);

drop policy if exists "trip_plans_update_own" on public.trip_plans;
create policy "trip_plans_update_own"
on public.trip_plans for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
