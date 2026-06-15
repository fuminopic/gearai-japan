insert into public.gear_categories (name_ja, name_en, sort_order, is_default)
values ('レインウェア（Rainwear）', 'rainwear', 50, true)
on conflict (name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order,
    is_default = excluded.is_default;

insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('レインジャケット', 'rain_jacket', 10),
    ('レインパンツ', 'rain_pants', 20)
) as v(name_ja, name_en, sort_order)
  on c.name_en = 'rainwear'
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
  'mont-bell',
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
  v.material,
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
    ('ストームクルーザー ジャケット Men''s', 'ストームクルーザー ジャケット Men''s', 'rain_jacket', 254, 22000, 'XS、S、M、L、XL、XXL、M-R(M ゆったり幅)、L-R(L ゆったり幅)', '8 x 8 x 15cm (1L）', 'スーパー ドライテック 3レイヤー［表：30デニール・ バリスティック® ナイロン・リップストップ］', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128733', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128733_bl26.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128733'),
    ('ストームクルーザー ジャケット Women''s', 'ストームクルーザー ジャケット Women''s', 'rain_jacket', 225, 21000, 'XS、S、M、L、XL、M-R(M ゆったり幅)、L-R(L ゆったり幅)', '7 x 7 x 14cm (0.7L）', 'スーパー ドライテック 3レイヤー［表：30デニール・ バリスティック® ナイロン・リップストップ］', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128735', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128735_pk.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128735'),
    ('ストームクルーザー パンツ Men''s', 'ストームクルーザー パンツ Men''s', 'rain_pants', 195, 13365, 'XS、S、XL-S(XL ショート丈)、S-L(S ロング丈)、M-L(M ロング丈)、L-L(L ロング丈)、XL-L(XL ロング丈)', '7 x 7 x 12cm (0.6L）', 'ゴアテックス ファブリクス3レイヤー[表:20デニール・ バリスティック® ナイロン・リップストップ]透湿性35,000g/m&sup2;・24hrs （JIS L-1099B-1法・参考値）', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128562', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128562_ogrd.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128562'),
    ('ストームクルーザー パンツ Women''s', 'ストームクルーザー パンツ Women''s', 'rain_pants', 173, 11900, 'XS、S、M、L、XL、M-S(M ショート丈)、L-S(L ショート丈)、XL-S(XL ショート丈)、XXL-S(XXLショート丈)、S-L(S ロング丈)、M-L(M ロング丈)、L-L(L ロング丈)', '7 x 7 x 11cm (0.6L）', 'ゴアテックス ファブリクス3レイヤー［表：20デニール･ バリスティック® ナイロン・リップストップ］透湿性35,000g/m&sup2;・24hrs （JIS L-1099B-1法・参考値）', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128536', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128536_gm.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128536'),
    ('サンダーパス ジャケット Men''s', 'サンダーパス ジャケット Men''s', 'rain_jacket', 313, 13600, 'S、M、L、XL、XXL', '9 x 9 x 14 cm （1.2 L）', 'ドライテック 3レイヤー[表：50デニール・ナイロン・リップストップ]', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128770', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128770_gn.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128770'),
    ('サンダーパス ジャケット Women''s', 'サンダーパス ジャケット Women''s', 'rain_jacket', 284, 13000, 'XS、S、M、L、XL', '8 x 8 x 13 cm （0.9 L）', 'ドライテック 3レイヤー[表：50デニール・ナイロン・リップストップ]', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128771', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128771_iv.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128771'),
    ('サンダーパス パンツ Men''s', 'サンダーパス パンツ Men''s', 'rain_pants', 242, 7650, 'S、M、L、XL、M-S(M ショート丈)、L-S(L ショート丈)、XL-S(XL ショート丈)、S-L(S ロング丈)、M-L(M ロング丈)、L-L(L ロング丈)、XL-L(XL ロング丈)', '8 x 8 x 15cm (1L）', 'ドライテック 3レイヤー[表：50デニール・ナイロン・リップストップ]透湿性15,000g/m&sup2;・24hrs（JIS L-1099B-1法・参考値）', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128637', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128637_bnsd.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128637'),
    ('バーサライト ジャケット Men''s', 'バーサライト ジャケット Men''s', 'rain_jacket', 143, 24000, 'S、M、L、XL', '7 x 7 x 11cm (0.6L）', 'スーパー ドライテック 3レイヤー［表：7デニール・ バリスティック エアライト® ナイロン・リップストップ］', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128743', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128743_bl.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128743'),
    ('バーサライト ジャケット Women''s', 'バーサライト ジャケット Women''s', 'rain_jacket', 128, 22900, 'XS、S、M、L、XL', '7 x 7 x 10cm (0.5L）', 'スーパー ドライテック 3レイヤー［表：7デニール・ バリスティック エアライト® ナイロン・リップストップ］', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128744', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128744_lgn.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128744'),
    ('バーサライトパンツ Men''s', 'バーサライトパンツ Men''s', 'rain_pants', 110, 11000, 'S', '6 x 6 x 9cm (0.4L）', 'ウィンドストッパー®ファブリクス バイ ゴアテックス ラボ 2レイヤー[表：10デニール・ バリスティック エアライト® ナイロン・リップストップ]透湿性43,000g/m&sup2;・24hrs（JIS L-1099B-1法・参考値）', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128665', 'https://webshop.montbell.jp/common/images/product/prod_s/s_1128665_bk.jpg', 'https://webshop.montbell.jp/goods/disp.php?product_id=1128665')
) as v(model, name_ja, subcategory_en, official_weight_grams, msrp_jpy, size, volume, material, official_url, image_url, msrp_source_url)
join public.gear_categories c on c.name_en = 'rainwear'
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
    ('ストームクルーザー ジャケット Men''s', '#1128733'),
    ('ストームクルーザー ジャケット Men''s', 'Storm Cruiser Jacket Men''s'),
    ('ストームクルーザー ジャケット Women''s', '#1128735'),
    ('ストームクルーザー ジャケット Women''s', 'Storm Cruiser Jacket Women''s'),
    ('ストームクルーザー パンツ Men''s', '#1128562'),
    ('ストームクルーザー パンツ Men''s', 'Storm Cruiser Pants Men''s'),
    ('ストームクルーザー パンツ Women''s', '#1128536'),
    ('ストームクルーザー パンツ Women''s', 'Storm Cruiser Pants Women''s'),
    ('サンダーパス ジャケット Men''s', '#1128770'),
    ('サンダーパス ジャケット Men''s', 'Thunder Pass Jacket Men''s'),
    ('サンダーパス ジャケット Women''s', '#1128771'),
    ('サンダーパス ジャケット Women''s', 'Thunder Pass Jacket Women''s'),
    ('サンダーパス パンツ Men''s', '#1128637'),
    ('サンダーパス パンツ Men''s', 'Thunder Pass Pants Men''s'),
    ('バーサライト ジャケット Men''s', '#1128743'),
    ('バーサライト ジャケット Men''s', 'Versalite Jacket Men''s'),
    ('バーサライト ジャケット Women''s', '#1128744'),
    ('バーサライト ジャケット Women''s', 'Versalite Jacket Women''s'),
    ('バーサライトパンツ Men''s', '#1128665'),
    ('バーサライトパンツ Men''s', 'Versalite Pants Men''s')
) as v(model, alias)
join public.gear_products p on p.brand = 'mont-bell' and p.model = v.model
on conflict (alias) do nothing;
