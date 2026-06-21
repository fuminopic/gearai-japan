update public.gear_products
set discontinued = true,
    verification_status = 'needs_review',
    image_url = null,
    last_verified_at = date '2026-06-21'
where brand in ('Columbia', 'MILLET', 'Arc''teryx', 'patagonia', 'GREGORY', 'LA SPORTIVA', 'Mammut')
  and discontinued = false;

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
      'Columbia',
      'Saber Six Mid Outdry Wide',
      'セイバー シックス ミッド アウトドライ ワイド',
      'clothing',
      'footwear',
      463,
      16940,
      null,
      null,
      null,
      'https://www.columbiasports.co.jp/shop/g/gYI8972287----7000/',
      'https://www.columbiasports.co.jp/img/goods/S/S25_YI8972_287_C.jpg'
    ),
    (
      'Columbia',
      'Saber Six Low Outdry Wide',
      'セイバー シックス ロー アウトドライ ワイド',
      'clothing',
      'footwear',
      426,
      15950,
      null,
      null,
      null,
      'https://www.columbiasports.co.jp/shop/g/gYI0238287----7000/',
      'https://www.columbiasports.co.jp/img/goods/S/S25_YI0238_287_C.jpg'
    ),
    (
      'MILLET',
      'SAAS FEE NX 40+5',
      'サースフェー NX 40+5',
      'backpack',
      'backpack',
      1560,
      29700,
      null,
      '40+5L',
      '40+5 L',
      'https://www.millet.jp/c/products/MIS0754',
      'https://milletonline.itembox.cloud/product/025/000000002568/000000002568-16.jpg'
    ),
    (
      'patagonia',
      'Torrentshell 3L Jacket',
      'トレントシェル 3L ジャケット',
      'clothing',
      'rain_jacket',
      400,
      27500,
      null,
      null,
      null,
      'https://www.patagonia.jp/product/mens-torrentshell-3-layer-rain-jacket/85241.html',
      'https://edge.dis.commercecloud.salesforce.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dw68155cdb/images/hi-res/85241_CPRG.jpg?sw=768&sh=768&sfrm=png&q=95&bgcolor=f3f4ef'
    ),
    (
      'patagonia',
      'Houdini Jacket',
      'フーディニ ジャケット',
      'clothing',
      'rain_jacket',
      105,
      15950,
      null,
      null,
      null,
      'https://www.patagonia.jp/product/mens-houdini-windbreaker-jacket/24142.html',
      'https://edge.dis.commercecloud.salesforce.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwecba354c/images/hi-res/24142_BLSG.jpg?sw=768&sh=768&sfrm=png&q=95&bgcolor=f3f4ef'
    ),
    (
      'GREGORY',
      'Zulu 30',
      'ズール 30',
      'backpack',
      'backpack',
      1390,
      29700,
      'MD/LG',
      '30L',
      '30 L',
      'https://www.gregory.jp/float/zulu-30-md-lg/gr-145291-0527.html',
      'https://www.gregory.jp/dw/image/v2/AAWQ_PRD/on/demandware.static/-/Sites-Gregory/default/dwbb4595ed/images/gr-145291/hi-res/145291_0527_hi-res_FRONT34_1.JPG?sw=545&sh=750'
    ),
    (
      'Mammut',
      'Lithium 20',
      'リチウム 20',
      'backpack',
      'backpack',
      710,
      18700,
      'Women / 20 L',
      '20L',
      '20 L',
      'https://www.mammut.jp/items/2530-00720',
      'https://mammt.store-image.jp/img01/201/2530-00720/w_750.h_750/trim_fce_item61baeee8c2cf1.jpg'
    ),
    (
      'Mammut',
      'Lithium 25',
      'リチウム 25',
      'backpack',
      'backpack',
      840,
      19800,
      'Women / 25 L',
      '25L',
      '25 L',
      'https://www.mammut.jp/items/2530-00730',
      'https://mammt.store-image.jp/img01/201/2530-00730/w_750.h_750/trim_fce_item67c93ac0b0e83.jpg'
    ),
    (
      'Mammut',
      'Lithium 30',
      'リチウム 30',
      'backpack',
      'backpack',
      910,
      23100,
      'Women / 30 L',
      '30L',
      '30 L',
      'https://www.mammut.jp/items/2530-00740',
      'https://mammt.store-image.jp/img01/201/2530-00740/w_750.h_750/trim_fce_item67c93b0d54ab1.jpg'
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
    ('Columbia', 'Saber Six Mid Outdry Wide', 'セイバー シックス ミッド'),
    ('Columbia', 'Saber Six Mid Outdry Wide', 'Saber Six Mid'),
    ('Columbia', 'Saber Six Low Outdry Wide', 'セイバー シックス ロー'),
    ('Columbia', 'Saber Six Low Outdry Wide', 'Saber Six Low'),
    ('MILLET', 'SAAS FEE NX 40+5', 'サースフェー NX 40+5'),
    ('patagonia', 'Torrentshell 3L Jacket', 'トレントシェル 3L'),
    ('patagonia', 'Houdini Jacket', 'フーディニジャケット'),
    ('GREGORY', 'Zulu 30', 'ズール30'),
    ('Mammut', 'Lithium 20', 'リチウム20'),
    ('Mammut', 'Lithium 25', 'リチウム25'),
    ('Mammut', 'Lithium 30', 'リチウム30')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
