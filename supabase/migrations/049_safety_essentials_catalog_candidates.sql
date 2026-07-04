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
  null,
  null,
  null,
  null,
  null,
  v.official_url,
  v.image_url,
  null,
  false,
  v.msrp_source_url,
  date '2026-07-04',
  v.verification_status
from (
  values
    (
      'mont-bell',
      'アルミホイッスル S',
      'アルミホイッスル S',
      'first_aid',
      'whistle',
      11,
      880,
      'https://webshop.montbell.jp/goods/disp.php?product_id=1124946',
      'https://webshop.montbell.jp/goods/disp.php?product_id=1124946',
      null,
      'needs_review'
    ),
    (
      'mont-bell',
      'エマージェンシーシート',
      'エマージェンシーシート',
      'first_aid',
      'emergency_sheet',
      50,
      594,
      'https://webshop.montbell.jp/goods/disp.php?product_id=1124306',
      'https://webshop.montbell.jp/goods/disp.php?product_id=1124306',
      null,
      'needs_review'
    ),
    (
      'mont-bell',
      'トレッキングベル サイレント',
      'トレッキングベル サイレント',
      'bear_safety',
      'bear_bell',
      43,
      2200,
      'https://webshop.montbell.jp/goods/disp.php?product_id=1124928',
      'https://webshop.montbell.jp/goods/disp.php?product_id=1124928',
      null,
      'needs_review'
    ),
    (
      'SABRE',
      'フロンティアーズマン マックス ベアスプレー234mL',
      'フロンティアーズマン マックス ベアスプレー234mL',
      'bear_safety',
      'bear_spray',
      304,
      12100,
      'https://webshop.montbell.jp/goods/disp.php?product_id=1899175',
      'https://webshop.montbell.jp/goods/disp.php?product_id=1899175',
      null,
      'needs_review'
    ),
    (
      'mont-bell',
      'O.D.トイレキット',
      'O.D.トイレキット',
      'first_aid',
      'portable_toilet',
      43,
      330,
      'https://webshop.montbell.jp/goods/disp.php?product_id=1150111',
      'https://webshop.montbell.jp/goods/disp.php?product_id=1150111',
      null,
      'needs_review'
    )
) as v(brand, model, name_ja, category_en, subcategory_en, official_weight_grams, msrp_jpy, official_url, msrp_source_url, image_url, verification_status)
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
    verification_status = excluded.verification_status
where public.gear_products.verification_status <> 'verified';

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('mont-bell', 'アルミホイッスル S', 'ホイッスル'),
    ('mont-bell', 'アルミホイッスル S', '笛'),
    ('mont-bell', 'アルミホイッスル S', 'whistle'),
    ('mont-bell', 'アルミホイッスル S', 'aluminum whistle'),
    ('mont-bell', 'エマージェンシーシート', 'エマージェンシーシート'),
    ('mont-bell', 'エマージェンシーシート', 'サバイバルシート'),
    ('mont-bell', 'エマージェンシーシート', 'emergency sheet'),
    ('mont-bell', 'エマージェンシーシート', 'emergency blanket'),
    ('mont-bell', 'エマージェンシーシート', 'survival sheet'),
    ('mont-bell', 'トレッキングベル サイレント', '熊鈴'),
    ('mont-bell', 'トレッキングベル サイレント', 'クマ鈴'),
    ('mont-bell', 'トレッキングベル サイレント', 'トレッキングベル'),
    ('mont-bell', 'トレッキングベル サイレント', 'bear bell'),
    ('mont-bell', 'トレッキングベル サイレント', 'trekking bell'),
    ('SABRE', 'フロンティアーズマン マックス ベアスプレー234mL', '熊スプレー'),
    ('SABRE', 'フロンティアーズマン マックス ベアスプレー234mL', 'クマよけスプレー'),
    ('SABRE', 'フロンティアーズマン マックス ベアスプレー234mL', '熊よけスプレー'),
    ('SABRE', 'フロンティアーズマン マックス ベアスプレー234mL', 'bear spray'),
    ('SABRE', 'フロンティアーズマン マックス ベアスプレー234mL', 'Frontiersman Max Bear Spray'),
    ('mont-bell', 'O.D.トイレキット', '携帯トイレ'),
    ('mont-bell', 'O.D.トイレキット', 'O.D.トイレキット'),
    ('mont-bell', 'O.D.トイレキット', 'portable toilet'),
    ('mont-bell', 'O.D.トイレキット', 'toilet kit')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
