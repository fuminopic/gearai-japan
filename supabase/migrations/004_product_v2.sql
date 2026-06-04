alter table public.gear_products
  add column if not exists official_weight_grams integer check (official_weight_grams is null or official_weight_grams >= 0),
  add column if not exists measured_weight_grams integer check (measured_weight_grams is null or measured_weight_grams >= 0),
  add column if not exists color text,
  add column if not exists material text,
  add column if not exists official_url text,
  add column if not exists image_url text,
  add column if not exists released_at date,
  add column if not exists discontinued boolean not null default false;

alter table public.user_gear
  add column if not exists official_weight_grams integer check (official_weight_grams is null or official_weight_grams >= 0),
  add column if not exists measured_weight_grams integer check (measured_weight_grams is null or measured_weight_grams >= 0),
  add column if not exists color text,
  add column if not exists material text,
  add column if not exists official_url text,
  add column if not exists image_url text;

update public.gear_products
set official_weight_grams = coalesce(official_weight_grams, weight_grams)
where official_weight_grams is null;

update public.user_gear
set official_weight_grams = coalesce(official_weight_grams, weight_grams)
where official_weight_grams is null;

insert into public.gear_categories (name_ja, name_en, sort_order, is_default)
values
  ('バックパック（Backpack）', 'backpack', 10, true),
  ('テント・シェルター（Tent / Shelter）', 'shelter', 20, true),
  ('寝具（Sleep System）', 'sleep', 30, true),
  ('ウェア（Clothing）', 'clothing', 40, true),
  ('レインウェア（Rainwear）', 'rainwear', 50, true),
  ('クッキング（Cooking）', 'cooking', 60, true),
  ('電子機器（Electronics）', 'electronics', 70, true),
  ('応急処置（First Aid）', 'first_aid', 80, true),
  ('熊対策（Bear Safety）', 'bear_safety', 90, true),
  ('その他（Other）', 'other', 100, true)
on conflict (name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order,
    is_default = excluded.is_default;

insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('backpack', 'バックパック', 'backpack', 10),
    ('shelter', 'テント', 'tent', 10),
    ('shelter', 'タープ', 'tarp', 20),
    ('shelter', 'グラウンドシート', 'groundsheet', 30),
    ('sleep', '寝袋', 'sleeping_bag', 10),
    ('sleep', 'マット', 'sleeping_pad', 20),
    ('sleep', 'ピロー', 'pillow', 30),
    ('clothing', '保温着', 'insulation', 10),
    ('clothing', 'ダウンジャケット', 'down_jacket', 20),
    ('clothing', 'ベースレイヤー', 'base_layer', 30),
    ('rainwear', 'レインジャケット', 'rain_jacket', 10),
    ('rainwear', 'レインパンツ', 'rain_pants', 20),
    ('cooking', 'ストーブ', 'stove', 10),
    ('cooking', '燃料', 'fuel', 20),
    ('cooking', 'クッカー', 'cookware', 30),
    ('electronics', 'ヘッドランプ', 'headlamp', 10),
    ('electronics', 'GPS', 'gps', 20),
    ('electronics', 'モバイルバッテリー', 'power_bank', 30),
    ('first_aid', 'ファーストエイドキット', 'first_aid_kit', 10),
    ('bear_safety', '熊鈴', 'bear_bell', 10),
    ('bear_safety', '熊スプレー', 'bear_spray', 20),
    ('other', 'その他', 'other', 10),
    ('other', '浄水フィルター', 'water_filter', 20)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

create unique index if not exists gear_products_brand_model_lower_uniq
on public.gear_products (lower(brand), lower(model));

create index if not exists gear_products_brand_model_search_idx
on public.gear_products (brand, model);

create unique index if not exists gear_product_aliases_alias_lower_uniq
on public.gear_product_aliases (lower(alias));

delete from public.gear_product_aliases a
using public.gear_products p
where a.product_id = p.id
  and (
    lower(a.alias) = lower(p.model)
    or lower(a.alias) = lower(coalesce(p.name_ja, ''))
    or lower(a.alias) = lower(p.brand || ' ' || p.model)
  );

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
  discontinued
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
  v.color,
  v.material,
  v.capacity,
  v.official_url,
  v.image_url,
  v.released_at::date,
  v.discontinued
from (
  values
    ('finetrack', 'Mountain Shot 2', 'Mountain Shot 2', 'shelter', 'tent', 1650, 69300, null, null, null, 'ナイロン', '2人用', null, null, null, false),
    ('山と道', 'MINI2', 'MINI2', 'backpack', 'backpack', 398, 33000, 'M', '25-35L', null, 'X-Pac / mesh', null, null, null, null, false),
    ('mont-bell', 'Storm Cruiser Jacket', 'ストームクルーザー ジャケット', 'rainwear', 'rain_jacket', 254, 27500, null, null, null, 'GORE-TEX', null, null, null, null, false),
    ('Black Diamond', 'Spot 400', 'スポット 400', 'electronics', 'headlamp', 78, 7920, null, null, null, null, null, null, null, null, false),
    ('YAMAP', 'Basic First Aid Kit', 'ベーシック ファーストエイドキット', 'first_aid', 'first_aid_kit', 180, 4500, null, null, null, null, null, null, null, null, false),
    ('Hyperlite Mountain Gear', 'Southwest 55', 'Southwest 55', 'backpack', 'backpack', 899, 63800, 'M', '55L', null, 'Dyneema Composite Fabric', null, null, null, null, false)
) as v(brand, model, name_ja, category_en, subcategory_en, official_weight_grams, msrp_jpy, size, volume, color, material, capacity, official_url, image_url, released_at, discontinued)
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
    discontinued = excluded.discontinued;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('finetrack', 'Mountain Shot 2', 'マウンテンショット2'),
    ('finetrack', 'Mountain Shot 2', 'マウンテンショット'),
    ('山と道', 'MINI2', 'Yamatomichi MINI2'),
    ('山と道', 'MINI2', '山道 MINI2'),
    ('mont-bell', 'Storm Cruiser Jacket', 'ストクル'),
    ('Hyperlite Mountain Gear', 'Southwest 55', 'HMG Southwest')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
on conflict (alias) do nothing;

drop policy if exists "ai_recommendations_delete_own" on public.ai_recommendations;
create policy "ai_recommendations_delete_own"
on public.ai_recommendations for delete
to authenticated
using (auth.uid() = user_id);
