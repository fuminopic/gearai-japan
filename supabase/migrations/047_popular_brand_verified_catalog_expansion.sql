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
  v.msrp_jpy,
  v.size,
  v.volume,
  null,
  null,
  v.capacity,
  v.official_url,
  v.image_url,
  null,
  false,
  v.official_url,
  date '2026-06-21',
  'verified'
from (
  values
    (
      'MILLET',
      'SAAS FEE NX 30+5',
      'サースフェー NX 30+5',
      'backpack',
      'backpack',
      1500,
      28050,
      null,
      '30+5L',
      '30+5 L',
      'https://www.millet.jp/c/hardware/backpacks/30-49l/MIS0756',
      'https://milletonline.itembox.cloud/product/025/000000002570/000000002570-01.jpg'
    ),
    (
      'MILLET',
      'KULA 30',
      'クーラ 30',
      'backpack',
      'backpack',
      860,
      17600,
      null,
      '30L',
      '30 L',
      'https://www.millet.jp/c/hardware/backpacks/30-49l/MIS0545',
      'https://milletonline.itembox.cloud/product/004/000000000473/000000000473-01.jpg'
    ),
    (
      'MILLET',
      'Drynamic Mesh NS',
      'ドライナミック メッシュ NS クルー',
      'clothing',
      'base_layer',
      100,
      5830,
      null,
      null,
      null,
      'https://www.millet.jp/c/men/underwear/MIV01248',
      'https://milletonline.itembox.cloud/product/005/000000000539/000000000539-01.jpg'
    ),
    (
      'MILLET',
      'Wanaka Stretch Pants',
      'ワナカ ストレッチ パンツ III',
      'clothing',
      'base_layer',
      306,
      11990,
      null,
      null,
      null,
      'https://www.millet.jp/c/men/bottoms/MIV10109',
      'https://milletonline.itembox.cloud/product/035/000000003504/000000003504-02.jpg'
    ),
    (
      'Columbia',
      'Castle Rock 25L Backpack II',
      'キャッスルロック25LバックパックII',
      'backpack',
      'backpack',
      720,
      9900,
      'O/S',
      '25L',
      '25 L',
      'https://www.columbiasports.co.jp/shop/g/gPU8662536--OZS000/',
      'https://www.columbiasports.co.jp/img/goods/S/S26_PU8662_536_C.jpg'
    )
) as v(
  brand,
  model,
  name_ja,
  category_en,
  subcategory_en,
  official_weight_grams,
  msrp_jpy,
  size,
  volume,
  capacity,
  official_url,
  image_url
)
join public.gear_categories c on c.name_en = v.category_en
join public.gear_subcategories s on s.category_id = c.id and s.name_en = v.subcategory_en
on conflict (brand, model) do update
set name_ja = excluded.name_ja,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    weight_grams = excluded.weight_grams,
    official_weight_grams = excluded.official_weight_grams,
    measured_weight_grams = null,
    msrp_jpy = excluded.msrp_jpy,
    size = excluded.size,
    volume = excluded.volume,
    capacity = excluded.capacity,
    official_url = excluded.official_url,
    image_url = excluded.image_url,
    msrp_source_url = excluded.official_url,
    last_verified_at = excluded.last_verified_at,
    verification_status = 'verified',
    discontinued = false;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('MILLET', 'SAAS FEE NX 30+5', 'サースフェー30+5'),
    ('MILLET', 'SAAS FEE NX 30+5', 'SAAS FEE 30+5'),
    ('MILLET', 'KULA 30', 'クーラ30'),
    ('MILLET', 'KULA 30', 'KULA30'),
    ('MILLET', 'Drynamic Mesh NS', 'ドライナミックメッシュNS'),
    ('MILLET', 'Drynamic Mesh NS', 'ドライナミックメッシュノースリーブ'),
    ('MILLET', 'Wanaka Stretch Pants', 'ワナカパンツ'),
    ('MILLET', 'Wanaka Stretch Pants', 'ワナカストレッチパンツ'),
    ('Columbia', 'Castle Rock 25L Backpack II', 'キャッスルロック25L'),
    ('Columbia', 'Castle Rock 25L Backpack II', 'Castle Rock 25L')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
