alter table public.gear_products
  add column if not exists msrp_source_url text,
  add column if not exists last_verified_at date,
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('verified', 'unverified', 'needs_review'));

create index if not exists gear_products_verification_status_idx
on public.gear_products(verification_status);

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
  'SOTO',
  v.model,
  v.name_ja,
  c.id,
  s.id,
  v.official_weight_grams,
  v.official_weight_grams,
  null,
  v.msrp_jpy,
  v.size,
  null,
  null,
  null,
  null,
  v.official_url,
  null,
  null,
  false,
  v.msrp_source_url,
  date '2026-06-05',
  'verified'
from (
  values
    ('ST-310', 'レギュレーターストーブ ST-310', 330, 7480, null, 'https://soto.shinfuji.co.jp/products/st-310/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf'),
    ('ST-320', 'G-ストーブ ST-320', 380, 8800, null, 'https://soto.shinfuji.co.jp/products/st-320/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf'),
    ('ST-330', 'レギュレーターストーブ FUSION ST-330', 250, 11880, null, 'https://soto.shinfuji.co.jp/products/st-330/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf'),
    ('ST-340', 'レギュレーターストーブ Range ST-340', 360, 9790, null, 'https://soto.shinfuji.co.jp/products/st-340/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf'),
    ('ST-350', 'レギュレーターストーブ TriTrail ST-350', 135, 9900, null, 'https://soto.shinfuji.co.jp/products/st-350/', 'https://soto.shinfuji.co.jp/products/st-350/'),
    ('SOD-310', 'マイクロレギュレーターストーブ ウインドマスター SOD-310', 67, 9350, null, 'https://soto.shinfuji.co.jp/products/sod-310/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf'),
    ('SOD-320', 'アミカス SOD-320', 81, 6270, null, 'https://soto.shinfuji.co.jp/products/sod-320/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf'),
    ('SOD-331', 'マイクロレギュレーターストーブ FUSION Trek SOD-331', 182, 11000, null, 'https://soto.shinfuji.co.jp/products/sod-331/', 'https://soto.shinfuji.co.jp/wp-content/uploads/2025/01/2025SOTO%E4%BE%A1%E6%A0%BC%E6%94%B9%E5%AE%9A%E8%A1%A8.pdf')
) as v(model, name_ja, official_weight_grams, msrp_jpy, size, official_url, msrp_source_url)
join public.gear_categories c on c.name_en = 'cooking'
join public.gear_subcategories s on s.category_id = c.id and s.name_en = 'stove'
on conflict (brand, model) do update
set name_ja = excluded.name_ja,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    weight_grams = excluded.weight_grams,
    official_weight_grams = excluded.official_weight_grams,
    measured_weight_grams = excluded.measured_weight_grams,
    msrp_jpy = excluded.msrp_jpy,
    size = excluded.size,
    official_url = excluded.official_url,
    msrp_source_url = excluded.msrp_source_url,
    last_verified_at = excluded.last_verified_at,
    verification_status = excluded.verification_status,
    discontinued = excluded.discontinued;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('ST-310', 'レギュレーターストーブ'),
    ('ST-320', 'G-ストーブ'),
    ('ST-330', 'FUSION'),
    ('ST-340', 'Range'),
    ('ST-350', 'TriTrail'),
    ('SOD-310', 'ウインドマスター'),
    ('SOD-320', 'アミカス'),
    ('SOD-331', 'FUSION Trek')
) as v(model, alias)
join public.gear_products p on p.brand = 'SOTO' and p.model = v.model
on conflict (alias) do nothing;

update public.gear_products
set discontinued = true,
    verification_status = 'needs_review',
    last_verified_at = date '2026-06-05'
where brand = 'SOTO'
  and model = 'WindMaster';
