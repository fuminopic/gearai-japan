-- A manual Gear image reference may only point into the owning user's
-- private Storage prefix. Object access is guarded separately by bucket RLS.
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
  and (
    image_storage_path is null
    or split_part(image_storage_path, '/', 1) = (select auth.uid())::text
  )
);

commit;
