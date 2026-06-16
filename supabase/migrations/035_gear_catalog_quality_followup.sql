update public.gear_products p
set volume = coalesce(p.volume, p.capacity),
    capacity = null,
    last_verified_at = date '2026-06-16',
    verification_status = 'verified'
from public.gear_categories c
where p.category_id = c.id
  and p.discontinued = false
  and c.name_en = 'backpack'
  and p.capacity is not null
  and p.capacity ~ '[0-9].*L';

update public.gear_products
set weight_grams = 1260,
    official_weight_grams = 1260,
    last_verified_at = date '2026-06-16',
    verification_status = 'verified'
where brand = 'NANGA'
  and model = 'レベル8 -13 オーロラテックス ライト';

with missing_weight_catalog_cleanup (brand, model) as (
  values
    ('THE NORTH FACE', '1995 カセンティーノウール デナリジャケット（ユニセックス）'),
    ('THE NORTH FACE', 'アルパインライトパンツ（メンズ）'),
    ('THE NORTH FACE', 'サミットAMKアサルト2'),
    ('THE NORTH FACE', 'ベクティブ タラバル ゴアテックス（ユニセックス）')
)
update public.gear_products p
set discontinued = true,
    last_verified_at = date '2026-06-16',
    verification_status = 'needs_review'
from missing_weight_catalog_cleanup c
where p.brand = c.brand
  and p.model = c.model
  and p.discontinued = false
  and p.weight_grams is null
  and p.official_weight_grams is null;
