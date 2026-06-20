insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('clothing', 'レインパンツ', 'rain_pants', 30)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

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
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  null,
  v.official_url,
  null,
  null,
  false,
  v.official_url,
  date '2026-06-21',
  'needs_review'
from (
  values
    ('MILLET', 'TYPHON 50000 Stretch Pants', 'ティフォン 50000 ストレッチ パンツ', 'clothing', 'rain_pants', 'https://www.millet.jp/'),
    ('patagonia', 'Torrentshell 3L Pants', 'トレントシェル 3L パンツ', 'clothing', 'rain_pants', 'https://www.patagonia.jp/')
) as v(brand, model, name_ja, category_en, subcategory_en, official_url)
join public.gear_categories c on c.name_en = v.category_en
join public.gear_subcategories s on s.category_id = c.id and s.name_en = v.subcategory_en
on conflict (brand, model) do update
set name_ja = excluded.name_ja,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    official_url = excluded.official_url,
    msrp_source_url = excluded.msrp_source_url,
    discontinued = false,
    verification_status = case
      when public.gear_products.verification_status = 'verified' then public.gear_products.verification_status
      else excluded.verification_status
    end;

update public.gear_products as p
set
  name_ja = v.name_ja,
  weight_grams = v.official_weight_grams,
  official_weight_grams = v.official_weight_grams,
  measured_weight_grams = null,
  msrp_jpy = v.msrp_jpy,
  size = v.size,
  volume = v.volume,
  capacity = v.capacity,
  official_url = v.official_url,
  image_url = v.image_url,
  msrp_source_url = v.official_url,
  last_verified_at = date '2026-06-21',
  verification_status = 'verified'
from (
  values
    (
      'Mammut',
      'Lithium 20',
      'リチウム 20',
      710,
      18700,
      'Women / 20 L',
      '20L',
      '20 L',
      'https://www.mammut.jp/items/2530-00720',
      'https://mammt.store-image.jp/img01/201/2530-00720/w_380.h_380/trim_fce_item61baeee8c2cf1.jpg'
    ),
    (
      'Mammut',
      'Lithium 25',
      'リチウム 25',
      840,
      19800,
      'Women / 25 L',
      '25L',
      '25 L',
      'https://www.mammut.jp/items/2530-00730',
      'https://mammt.store-image.jp/img01/201/2530-00730/w_380.h_380/trim_fce_item67c93ac0b0e83.jpg'
    ),
    (
      'Mammut',
      'Lithium 30',
      'リチウム 30',
      910,
      23100,
      'Women / 30 L',
      '30L',
      '30 L',
      'https://www.mammut.jp/items/2530-00740',
      'https://mammt.store-image.jp/img01/201/2530-00740/w_380.h_380/trim_fce_item67c93b0d54ab1.jpg'
    )
) as v(brand, model, name_ja, official_weight_grams, msrp_jpy, size, volume, capacity, official_url, image_url)
where p.brand = v.brand
  and p.model = v.model;
