update public.gear_products as p
set weight_grams = v.official_weight_grams,
    official_weight_grams = v.official_weight_grams,
    last_verified_at = date '2026-06-15',
    verification_status = 'verified'
from (
  values
    ('アークティック48', 1425),
    ('チュガッチガイド45', 1950),
    ('チュガッチ35', 1625),
    ('コブラ65', 1620),
    ('ファントム50', 1077),
    ('ファントム38', 992),
    ('テルス45', 1650),
    ('テルス35', 1470),
    ('ノーム38', 1050),
    ('ノーム28', 930),
    ('エフピー26', 610),
    ('ミュアー60', 2040),
    ('サム 45', 940),
    ('サム 35', 875),
    ('ファクター 28', 500),
    ('サミットAMK55', 1185),
    ('サミットAMK40', 830),
    ('サミットAMK25', 420),
    ('テルスエアー 35', 735),
    ('テルスエアー 22', 520),
    ('エタ 40', 2020),
    ('エタ 30', 1760),
    ('マウンテンショット2', 1660),
    ('マウンテンショット1', 1340),
    ('マウンテングローリー2', 1930),
    ('マウンテングローリー1', 1540),
    ('サミットAMKスーパーライトー1', 1045),
    ('クライムライトジャケット（メンズ）', 285),
    ('フューチャーライトトレイルピークジャケット（ユニセックス）', 135),
    ('ストライクトレイルジャケット（メンズ）', 120),
    ('ストライクトレイルジャケット（レディース）', 110),
    ('フューチャーライトドリズルジャケット（メンズ）', 455),
    ('サンダージャケット（メンズ）', 305),
    ('サンダーラウンドネックジャケット（メンズ）', 290),
    ('クレストン ハイク ミッド ウォータープルーフ（メンズ）', 530),
    ('クレストン ハイク ミッド ウォータープルーフ（レディース）', 460),
    ('クレストン ハイク ウォータープルーフ（メンズ）', 475),
    ('クレストン ハイク ウォータープルーフ（レディース）', 395),
    ('クレストン ネオ ミッド ゴアテックス（ユニセックス）', 570),
    ('ベクティブ サプル ゴアテックス（ユニセックス）', 320),
    ('ベクティブ ブリーズ DCF（ユニセックス）', 290),
    ('ベクティブ ブリーズ 2（ユニセックス）', 300),
    ('ベクティブ フォワード（ユニセックス）', 255),
    ('ベクティブ バーサ（ユニセックス）', 250)
) as v(model, official_weight_grams)
where p.brand = 'THE NORTH FACE'
  and p.model = v.model;

delete from public.gear_product_aliases a
using public.gear_products p
where a.product_id = p.id
  and p.brand = 'finetrack'
  and p.model = 'Mountain Shot 2'
  and lower(a.alias) in (
    lower('Mountain Shot 2'),
    lower('マウンテンショット2'),
    lower('マウンテンショット')
  );

update public.gear_products
set discontinued = true,
    verification_status = 'needs_review',
    last_verified_at = date '2026-06-15'
where brand = 'finetrack'
  and model = 'Mountain Shot 2';

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('マウンテンショット2', 'Mountain Shot 2'),
    ('マウンテンショット2', 'MountainShot2'),
    ('マウンテンショット2', 'MOUNTAIN SHOT 2'),
    ('マウンテンショット2', 'マウンテンショット 2'),
    ('マウンテンショット1', 'Mountain Shot 1'),
    ('マウンテンショット1', 'MountainShot1'),
    ('マウンテンショット1', 'MOUNTAIN SHOT 1'),
    ('マウンテンショット1', 'マウンテンショット 1'),
    ('フットプリント/マウンテンショット2', 'Mountain Shot 2 Footprint'),
    ('フットプリント/マウンテンショット2', 'MountainShot2 Footprint'),
    ('フットプリント/マウンテンショット2', 'Footprint Mountain Shot 2'),
    ('フットプリント/マウンテンショット2', 'フットプリント マウンテンショット 2'),
    ('フットプリント/マウンテンショット1', 'Mountain Shot 1 Footprint'),
    ('フットプリント/マウンテンショット1', 'MountainShot1 Footprint'),
    ('フットプリント/マウンテンショット1', 'Footprint Mountain Shot 1'),
    ('フットプリント/マウンテンショット1', 'フットプリント マウンテンショット 1')
) as v(model, alias)
join public.gear_products p on p.brand = 'THE NORTH FACE' and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
