-- Checklist-only confirmations are plan-scoped user state. They are stored as
-- rows (rather than a checklist snapshot) so Web and native clients can share
-- the same authoritative confirmation state without duplicating Gear rules.
begin;

create table if not exists public.trip_plan_checklist_item_states (
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.trip_plans(id) on delete cascade,
  checklist_item_id text not null check (
    char_length(checklist_item_id) between 1 and 80
  ),
  is_checked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, plan_id, checklist_item_id)
);

-- The primary key serves the user + plan read path. The reverse lookup keeps
-- a plan delete/cascade check bounded even when a user has many plans.
create index if not exists trip_plan_checklist_item_states_plan_id_idx
  on public.trip_plan_checklist_item_states(plan_id);

alter table public.trip_plan_checklist_item_states enable row level security;

revoke all privileges
  on table public.trip_plan_checklist_item_states
  from anon, authenticated;

grant select, insert, update, delete
  on table public.trip_plan_checklist_item_states
  to authenticated;

drop policy if exists "trip_plan_checklist_item_states_select_own"
  on public.trip_plan_checklist_item_states;
create policy "trip_plan_checklist_item_states_select_own"
on public.trip_plan_checklist_item_states
for select
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trip_plans
    where trip_plans.id = trip_plan_checklist_item_states.plan_id
      and trip_plans.user_id = (select auth.uid())
  )
);

drop policy if exists "trip_plan_checklist_item_states_insert_own"
  on public.trip_plan_checklist_item_states;
create policy "trip_plan_checklist_item_states_insert_own"
on public.trip_plan_checklist_item_states
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trip_plans
    where trip_plans.id = trip_plan_checklist_item_states.plan_id
      and trip_plans.user_id = (select auth.uid())
  )
);

drop policy if exists "trip_plan_checklist_item_states_update_own"
  on public.trip_plan_checklist_item_states;
create policy "trip_plan_checklist_item_states_update_own"
on public.trip_plan_checklist_item_states
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trip_plans
    where trip_plans.id = trip_plan_checklist_item_states.plan_id
      and trip_plans.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trip_plans
    where trip_plans.id = trip_plan_checklist_item_states.plan_id
      and trip_plans.user_id = (select auth.uid())
  )
);

drop policy if exists "trip_plan_checklist_item_states_delete_own"
  on public.trip_plan_checklist_item_states;
create policy "trip_plan_checklist_item_states_delete_own"
on public.trip_plan_checklist_item_states
for delete
to authenticated
using (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trip_plans
    where trip_plans.id = trip_plan_checklist_item_states.plan_id
      and trip_plans.user_id = (select auth.uid())
  )
);

drop trigger if exists set_trip_plan_checklist_item_states_updated_at
  on public.trip_plan_checklist_item_states;
create trigger set_trip_plan_checklist_item_states_updated_at
before update on public.trip_plan_checklist_item_states
for each row execute function public.set_updated_at();

commit;
