-- Official catalog gear is immutable after it is copied into user_gear.
-- Manual gear remains editable only by its owner.
begin;

drop policy if exists "user_gear_update_own" on public.user_gear;

create policy "user_gear_update_own"
on public.user_gear
for update
to authenticated
using (
  (select auth.uid()) = user_id
  and product_id is null
)
with check (
  (select auth.uid()) = user_id
  and product_id is null
);

commit;
