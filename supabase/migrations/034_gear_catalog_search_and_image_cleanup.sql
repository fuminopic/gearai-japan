with backpack_volume_fixes (brand, model, volume) as (
  values
    ('山と道', 'MINI', '25-32L'),
    ('山と道', 'MINI2', '25-35L'),
    ('Osprey', 'ケストレル48', '46-48L'),
    ('Osprey', 'ケストレル38', '36-38L'),
    ('Osprey', 'ケストレルLT45', '45L'),
    ('Osprey', 'ケストレルLT35', '35L'),
    ('Osprey', 'エクソスプロ55', '55L'),
    ('Osprey', 'タロンプロ40', '40L'),
    ('Osprey', 'タロンベロシティ20', '20L'),
    ('Osprey', 'テンペストベロシティ20', '18-20L')
)
update public.gear_products p
set volume = f.volume,
    capacity = null,
    last_verified_at = date '2026-06-16',
    verification_status = 'verified'
from backpack_volume_fixes f
where p.brand = f.brand
  and p.model = f.model;

with soto_image_fixes (brand, model, image_url) as (
  values
    ('SOTO', 'SOD-310', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-310_01-1-550x826.jpg'),
    ('SOTO', 'SOD-320', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-320_04-1-550x845.jpg'),
    ('SOTO', 'SOD-331', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-331_01-1-550x354.jpg'),
    ('SOTO', 'ST-310', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-310_01-1-550x412.jpg'),
    ('SOTO', 'ST-320', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-320_01-1-550x361.jpg'),
    ('SOTO', 'ST-330', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-330_01-2-550x333.jpg'),
    ('SOTO', 'ST-340', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-340_01-2-550x413.jpg'),
    ('SOTO', 'ST-350', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-350_01-550x508.jpg')
)
update public.gear_products p
set image_url = f.image_url,
    last_verified_at = date '2026-06-16',
    verification_status = 'verified'
from soto_image_fixes f
where p.brand = f.brand
  and p.model = f.model
  and nullif(btrim(p.image_url), '') is null;

with no_image_catalog_cleanup (brand, model) as (
  values
    ('Durston', 'X-Mid 1 Solid'),
    ('EVERNEW', 'Ti 570FD Cup'),
    ('Garmin', 'eTrex SE'),
    ('Hyperlite Mountain Gear', 'Southwest 55'),
    ('mont-bell', 'Alpine Down Parka'),
    ('mont-bell', 'Down Hugger 800 #3'),
    ('Nalgene', 'Wide Mouth 1.0L'),
    ('NEMO', 'Tensor Trail Regular'),
    ('YAMAP', 'Basic First Aid Kit')
)
update public.gear_products p
set discontinued = true,
    last_verified_at = date '2026-06-16',
    verification_status = 'needs_review'
from no_image_catalog_cleanup c
where p.brand = c.brand
  and p.model = c.model
  and p.discontinued = false
  and nullif(btrim(p.image_url), '') is null;
