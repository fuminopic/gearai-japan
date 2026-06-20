insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('other', 'ボトル', 'bottle', 15),
    ('other', '浄水フィルター', 'water_filter', 20)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

do $$
declare
  other_id uuid;
  bottle_sub_id uuid;
  water_filter_sub_id uuid;
  cooking_id uuid;
  tableware_sub_id uuid;
begin
  select id into other_id from public.gear_categories where name_en = 'other';
  select id into cooking_id from public.gear_categories where name_en = 'cooking';

  select id into bottle_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'bottle';

  select id into water_filter_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'water_filter';

  select id into tableware_sub_id
  from public.gear_subcategories
  where category_id = cooking_id and name_en = 'tableware';

  update public.gear_products p
  set category_id = other_id,
      subcategory_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(filter|フィルター|浄水)'
          then water_filter_sub_id
        else bottle_sub_id
      end,
      last_verified_at = date '2026-06-20',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  from public.gear_categories c
  where p.category_id = c.id
    and (
      c.name_en = 'hydration'
      or exists (
        select 1
        from public.gear_subcategories s
        where s.id = p.subcategory_id
          and s.name_en = 'bottle'
      )
      or lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(nalgene|bottle|ボトル|水筒)'
    );

  update public.user_gear g
  set category_id = other_id,
      subcategory_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(filter|フィルター|浄水)'
          then water_filter_sub_id
        else bottle_sub_id
      end
  from public.gear_categories c
  where g.category_id = c.id
    and (
      c.name_en = 'hydration'
      or exists (
        select 1
        from public.gear_subcategories s
        where s.id = g.subcategory_id
          and s.name_en = 'bottle'
      )
      or lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(nalgene|bottle|ボトル|水筒)'
    );

  update public.gear_products p
  set subcategory_id = tableware_sub_id,
      last_verified_at = date '2026-06-20',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where p.category_id = cooking_id
    and lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(spork|cutlery|カトラリー|スプーン|フォーク|箸|食器)';

  update public.user_gear g
  set subcategory_id = tableware_sub_id
  where g.category_id = cooking_id
    and lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(spork|cutlery|カトラリー|スプーン|フォーク|箸|食器)';
end $$;

insert into public.gear_products (
  brand,
  model,
  name_ja,
  category_id,
  subcategory_id,
  weight_grams,
  official_weight_grams,
  measured_weight_grams,
  msrp_jpy,
  size,
  volume,
  color,
  material,
  capacity,
  official_url,
  image_url,
  released_at,
  discontinued,
  msrp_source_url,
  last_verified_at,
  verification_status
)
select
  v.brand,
  v.model,
  v.name_ja,
  c.id,
  s.id,
  v.official_weight_grams,
  v.official_weight_grams,
  null,
  null,
  v.size,
  v.volume,
  null,
  v.material,
  v.capacity,
  v.official_url,
  null,
  null,
  false,
  v.official_url,
  date '2026-06-20',
  'verified'
from (
  values
    ('Nalgene', '32oz Wide Mouth Bottle', '32oz Wide Mouth Bottle', 'other', 'bottle', 177, null, '32oz / 1L', 'Tritan Renew', null, 'https://nalgene.com/product/32oz-wide-mouth-bottle/'),
    ('Sawyer', 'Squeeze Water Filter System', 'Squeeze ウォーターフィルターシステム', 'other', 'water_filter', 232, null, null, '0.1 micron hollow fiber membrane', null, 'https://www.sawyer.com/product/squeeze-water-filter-system'),
    ('Snow Peak', 'Titanium Spork', 'チタン先割れスプーン', 'cooking', 'tableware', 16, 'L 6.5 in / W 1.6 in', null, 'Titanium', null, 'https://www.snowpeak.com/products/titanium-spork')
) as v(brand, model, name_ja, category_en, subcategory_en, official_weight_grams, size, volume, material, capacity, official_url)
join public.gear_categories c on c.name_en = v.category_en
join public.gear_subcategories s on s.category_id = c.id and s.name_en = v.subcategory_en
on conflict (brand, model) do update
set name_ja = excluded.name_ja,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    weight_grams = excluded.weight_grams,
    official_weight_grams = excluded.official_weight_grams,
    measured_weight_grams = excluded.measured_weight_grams,
    size = excluded.size,
    volume = excluded.volume,
    color = excluded.color,
    material = excluded.material,
    capacity = excluded.capacity,
    official_url = excluded.official_url,
    msrp_source_url = excluded.msrp_source_url,
    last_verified_at = excluded.last_verified_at,
    verification_status = excluded.verification_status,
    discontinued = false;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('Nalgene', '32oz Wide Mouth Bottle', 'Wide Mouth 1.0L'),
    ('Nalgene', '32oz Wide Mouth Bottle', '広口 1.0L ボトル'),
    ('Nalgene', '32oz Wide Mouth Bottle', 'ナルゲン 1L'),
    ('Sawyer', 'Squeeze Water Filter System', 'Sawyer Squeeze'),
    ('Sawyer', 'Squeeze Water Filter System', 'ソーヤー スクィーズ'),
    ('Sawyer', 'Squeeze Water Filter System', '浄水フィルター'),
    ('Snow Peak', 'Titanium Spork', 'SCT-004'),
    ('Snow Peak', 'Titanium Spork', 'チタンスポーク'),
    ('Snow Peak', 'Titanium Spork', 'スノーピーク チタン先割れスプーン')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
