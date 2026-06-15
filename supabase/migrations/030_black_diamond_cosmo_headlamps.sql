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
  'Black Diamond',
  v.model,
  v.name_ja,
  c.id,
  s.id,
  v.official_weight_grams,
  v.official_weight_grams,
  null,
  v.msrp_jpy,
  null,
  null,
  v.color,
  null,
  null,
  v.official_url,
  v.image_url,
  null,
  false,
  v.msrp_source_url,
  date '2026-06-15',
  'verified'
from (
  values
    ('コズモ350-R', 'コズモ350-R', 'electronics', 'headlamp', 75, 9350, 'グラファイト', 'https://www.lostarrow.co.jp/store/g/gBD81313002/', 'https://www.lostarrow.co.jp/img/goods/S/BD81313002_S.webp', 'https://www.lostarrow.co.jp/store/g/gBD81313002/'),
    ('コズモ350', 'コズモ350', 'electronics', 'headlamp', 81, 5940, 'ダークオリーブ', 'https://www.lostarrow.co.jp/store/g/gBD81309003/', 'https://www.lostarrow.co.jp/img/goods/S/BD81309003_S.webp', 'https://www.lostarrow.co.jp/store/g/gBD81309003/')
) as v(model, name_ja, category_en, subcategory_en, official_weight_grams, msrp_jpy, color, official_url, image_url, msrp_source_url)
join public.gear_categories c on c.name_en = v.category_en
join public.gear_subcategories s on s.category_id = c.id and s.name_en = v.subcategory_en
on conflict (brand, model) do update
set name_ja = excluded.name_ja,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    weight_grams = excluded.weight_grams,
    official_weight_grams = excluded.official_weight_grams,
    measured_weight_grams = excluded.measured_weight_grams,
    msrp_jpy = excluded.msrp_jpy,
    size = excluded.size,
    volume = excluded.volume,
    color = excluded.color,
    material = excluded.material,
    capacity = excluded.capacity,
    official_url = excluded.official_url,
    image_url = excluded.image_url,
    released_at = excluded.released_at,
    discontinued = excluded.discontinued,
    msrp_source_url = excluded.msrp_source_url,
    last_verified_at = excluded.last_verified_at,
    verification_status = excluded.verification_status;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('コズモ350-R', '#BD81313002'),
    ('コズモ350-R', 'BD81313002'),
    ('コズモ350-R', '#BD81313003'),
    ('コズモ350-R', 'BD81313003'),
    ('コズモ350-R', 'Cosmo 350-R'),
    ('コズモ350-R', 'Cosmo350R'),
    ('コズモ350-R', 'Cosmo 350 R'),
    ('コズモ350-R', 'コズモ350R'),
    ('コズモ350', '#BD81309003'),
    ('コズモ350', 'BD81309003'),
    ('コズモ350', '#BD81309004'),
    ('コズモ350', 'BD81309004'),
    ('コズモ350', '#BD81309005'),
    ('コズモ350', 'BD81309005'),
    ('コズモ350', 'Cosmo 350'),
    ('コズモ350', 'Cosmo350')
) as v(model, alias)
join public.gear_products p on p.brand = 'Black Diamond' and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
