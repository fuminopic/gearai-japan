create table public.user_pack_items (
  user_id uuid not null references public.profiles(id) on delete cascade,
  gear_id uuid not null references public.user_gear(id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, gear_id)
);

create index user_pack_items_gear_id_idx
on public.user_pack_items(gear_id);

alter table public.user_pack_items enable row level security;

revoke all privileges
on table public.user_pack_items
from anon, authenticated;

grant select, insert, delete on table public.user_pack_items to authenticated;

create policy "user_pack_items_select_own"
on public.user_pack_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "user_pack_items_insert_own_owned_gear"
on public.user_pack_items for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.user_gear
    where user_gear.id = user_pack_items.gear_id
      and user_gear.user_id = user_pack_items.user_id
      and user_gear.status = 'owned'
  )
);

create policy "user_pack_items_delete_own"
on public.user_pack_items for delete
to authenticated
using ((select auth.uid()) = user_id);
