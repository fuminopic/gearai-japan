do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'price_jpy'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'purchase_price_jpy'
  ) then
    alter table public.user_gear rename column price_jpy to purchase_price_jpy;
  end if;
end $$;

alter table public.user_gear
  add column if not exists product_id uuid references public.gear_products(id) on delete set null,
  add column if not exists subcategory_id uuid references public.gear_subcategories(id) on delete set null,
  add column if not exists model text,
  add column if not exists msrp_jpy integer check (msrp_jpy is null or msrp_jpy >= 0),
  add column if not exists official_weight_grams integer check (official_weight_grams is null or official_weight_grams >= 0),
  add column if not exists measured_weight_grams integer check (measured_weight_grams is null or measured_weight_grams >= 0),
  add column if not exists color text,
  add column if not exists material text,
  add column if not exists size text,
  add column if not exists volume text,
  add column if not exists capacity text,
  add column if not exists official_url text,
  add column if not exists image_url text;

update public.user_gear
set official_weight_grams = coalesce(official_weight_grams, weight_grams)
where official_weight_grams is null;

create index if not exists user_gear_product_id_idx on public.user_gear(product_id);
create index if not exists user_gear_subcategory_id_idx on public.user_gear(subcategory_id);

alter table public.ai_recommendations enable row level security;

drop policy if exists "ai_recommendations_delete_own" on public.ai_recommendations;
create policy "ai_recommendations_delete_own"
on public.ai_recommendations for delete
to authenticated
using (auth.uid() = user_id);
