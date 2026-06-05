insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, 'アクセサリー', 'accessory', 40
from public.gear_categories c
where c.name_en = 'cooking'
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
  v.material,
  v.capacity,
  v.official_url,
  v.image_url,
  null,
  false,
  v.msrp_source_url,
  date '2026-06-05',
  'verified'
from (
  values
    ('ST-331', 'TrekMaster（トレックマスター）', 'stove', 195, 12870, '幅500×奥行140×高さ105mm（使用時・ホース含む） / 幅90×奥行70×高さ105mm（収納時・ホース含む）', null, null, 'https://soto.shinfuji.co.jp/products/st-331/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-331_01.webp', 'https://soto.shinfuji.co.jp/products/st-331/'),
    ('ST-711', 'CB TOUGH 125', 'fuel', 220, 440, '直径65×高さ120mm（キャップ含む）', null, '125g', 'https://soto.shinfuji.co.jp/products/st-711/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-711_0111.jpg', 'https://soto.shinfuji.co.jp/products/st-711/'),
    ('ST-712', 'CB TOUGH 220', 'fuel', 334, 495, '直径65×高さ186mm（キャップ含む）', null, '220g', 'https://soto.shinfuji.co.jp/products/st-712/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-712_011.jpg', 'https://soto.shinfuji.co.jp/products/st-712/'),
    ('SOD-710T', 'パワーガス105トリプルミックス', 'fuel', 192, 682, '直径90×高さ65mm', null, '105g', 'https://soto.shinfuji.co.jp/products/sod-710t/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-710T_01-1.jpg', 'https://soto.shinfuji.co.jp/products/sod-710t/'),
    ('SOD-725T', 'パワーガス250トリプルミックス', 'fuel', 385, 792, '直径110×高さ90mm', null, '230g', 'https://soto.shinfuji.co.jp/products/sod-725t/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-725T_01-1.jpg', 'https://soto.shinfuji.co.jp/products/sod-725t/'),
    ('SOD-750T', 'パワーガス500トリプルミックス', 'fuel', 680, 1320, '直径110×高さ150mm', null, '460g', 'https://soto.shinfuji.co.jp/products/sod-750t/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-750T_01-1.jpg', 'https://soto.shinfuji.co.jp/products/sod-750t/'),
    ('SOD-523', 'スチームライスクッカー ITADAKI(イタダキ)', 'cookware', 250, 7480, '（使用時）φ108（鍋底φ96.6）×高さ155mm / （収納時）φ108（鍋底φ96.6）×高さ134mm', 'マグ350：ステンレス、マグ650：アルミニウム、リッド：PP、スペーサー：PP、リフター：アルミニウム、メッシュ収納袋：ポリエステル', 'マグ350：350ml（満水容量400ml） / マグ650：650ml（満水容量700ml）', 'https://soto.shinfuji.co.jp/products/sod-523/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-320_01-2.jpg', 'https://soto.shinfuji.co.jp/products/sod-523/'),
    ('ST-3108', 'ミニマルクッカー角', 'cookware', 375, 5775, '幅147×奥行147×高さ80mm', '鍋本体・フタ：アルミニウム / リフター：ステンレス', '800ml（満水容量約1,100ml）', 'https://soto.shinfuji.co.jp/products/st-3108/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-3108_01-1.jpg', 'https://soto.shinfuji.co.jp/products/st-3108/'),
    ('ST-950', 'ステンレスヘビーポット GORA(ゴーラ)', 'cookware', 3500, 19800, '20cmポット、16cmポット、14cmポット、リッド、リフターのセット', 'ポット・リッド：ステンレス / リフター：アルミニウム / 収納袋：綿', '2,500ml / 1,200ml / 900ml', 'https://soto.shinfuji.co.jp/products/st-950/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-950_01-1.jpg', 'https://soto.shinfuji.co.jp/products/st-950/'),
    ('ST-950P', 'GORA パンチングザル', 'cookware', 196, 3520, '直径195×高さ76mm', 'ステンレス', null, 'https://soto.shinfuji.co.jp/products/st-950p/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-950P_01-1.jpg', 'https://soto.shinfuji.co.jp/products/st-950p/'),
    ('ST-950FP22', 'GORA フライパン22cm', 'cookware', 855, 2970, '直径240×高さ52mm', '鉄（シリコンクリア塗装）', null, 'https://soto.shinfuji.co.jp/products/st-950fp22/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-950FP22_01-1.jpg', 'https://soto.shinfuji.co.jp/products/st-950fp22/'),
    ('ST-950FP16', 'GORA フライパン16cm', 'cookware', 433, 2090, '直径180×高さ37mm', '鉄（シリコンクリア塗装）', null, 'https://soto.shinfuji.co.jp/products/st-950fp16/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-950FP16_01-1.jpg', 'https://soto.shinfuji.co.jp/products/st-950fp16/'),
    ('SOD-532', 'チタンマグ450', 'cookware', 53, 4400, null, 'マグ本体／ハンドル：チタン', '450ml', 'https://soto.shinfuji.co.jp/products/sod-532-2/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-532_01.jpg', 'https://soto.shinfuji.co.jp/products/sod-532-2/'),
    ('SOD-533', 'チタンマグ600', 'cookware', 64, 4950, null, 'マグ本体／ハンドル：チタン', '600ml', 'https://soto.shinfuji.co.jp/products/%e3%83%81%e3%82%bf%e3%83%b3%e3%83%9e%e3%82%b0600-sod-533/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-533_04.jpg', 'https://soto.shinfuji.co.jp/products/%e3%83%81%e3%82%bf%e3%83%b3%e3%83%9e%e3%82%b0600-sod-533/'),
    ('SOD-520', 'サーモスタック', 'cookware', 182, 6985, '直径86×高さ110mm（本体収納サイズ）', 'マグ350：ステンレス / マグ400：チタン / マグリッド：樹脂、シリコン / ジョイント：樹脂、シリコン / リフター：アルミニウム、ステンレス / 収納ポーチ：ポリエステル', 'マグ350：350ml（満水容量400ml） / マグ400：400ml（満水容量500ml）', 'https://soto.shinfuji.co.jp/products/sod-520/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/S0D-520_01.jpg', 'https://soto.shinfuji.co.jp/products/sod-520/'),
    ('SOD-521', 'サーモスタッククッカーコンボ', 'cookware', 310, 8965, '本体収納サイズ：直径105×高さ125mm', 'マグ350：ステンレス / マグ400：チタン / マグ750：アルミニウム / コジー：ターポリン、アルミ蒸着シート', 'マグ350：350ml（満水容量400ml） / マグ400：400ml（満水容量500ml） / マグ750：750ml（満水容量800ml）', 'https://soto.shinfuji.co.jp/products/sod-521/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-521_01-2.jpg', 'https://soto.shinfuji.co.jp/products/sod-521/'),
    ('SOD-522', 'サーモライト', 'cookware', 154, 4455, '本体収納サイズ：直径105mm×高さ125mm', 'マグ750：アルミニウム / マグリッドL：樹脂、シリコン / コジー：ターポリン、アルミ蒸着シート / リフター：アルミニウム、ステンレス', 'マグ750：750ml（満水容量800ml）', 'https://soto.shinfuji.co.jp/products/sod-522/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-522_01-2.jpg', 'https://soto.shinfuji.co.jp/products/sod-522/'),
    ('SOD-460', 'ウインドマスター専用4本ゴトク フォーフレックス', 'accessory', 27, 2090, '幅47×奥行77×高さ44mm（収納時）', 'ステンレス', null, 'https://soto.shinfuji.co.jp/products/sod-460/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/SOD-460_01-1.jpg', 'https://soto.shinfuji.co.jp/products/sod-460/'),
    ('ST-770LU', 'ガス抜きツール ルミナス', 'accessory', 33, 2200, '幅15mm×高さ16mm×長さ100mm', 'ステンレス（本体、ガード、ピン）、樹脂（グリップ）、真鍮（グリップエンド）', null, 'https://soto.shinfuji.co.jp/products/st-770lu/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-770LU_kikaku_01-2.jpg', 'https://soto.shinfuji.co.jp/products/st-770lu/'),
    ('ST-770LUBL', 'ガス抜きツール ルミナスブルー', 'accessory', 33, 2200, '幅15mm×高さ16mm×長さ100mm', 'ステンレス（本体、ガード、ピン）、樹脂（グリップ）、真鍮（グリップエンド）', null, 'https://soto.shinfuji.co.jp/products/st-770lubl/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-770LUBL_kikaku_01.jpg', 'https://soto.shinfuji.co.jp/products/st-770lubl/'),
    ('ST-3105LU', 'レギュレーターストーブ専用アシストグリップ ルミナス', 'accessory', 8, 770, '直径8×長さ90mm（1本）', 'シリコンゴム', null, 'https://soto.shinfuji.co.jp/products/st-3105lu/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-3105LU_kikaku_01.jpg', 'https://soto.shinfuji.co.jp/products/st-3105lu/'),
    ('ST-3105LUBL', 'レギュレーターストーブ専用アシストグリップ ルミナスブルー', 'accessory', 8, 770, '直径8×長さ90mm（1本）', 'シリコンゴム', null, 'https://soto.shinfuji.co.jp/products/st-3105lubl/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-3105LUBL_kikaku_01.jpg', 'https://soto.shinfuji.co.jp/products/st-3105lubl/'),
    ('ST-526T', 'GRID テーブル', 'accessory', 315, 3795, '幅460×奥行125×高さ85mm（使用時） / 幅460×奥行125×高さ32mm（収納時）', '天板：アルミニウム / スタンド：ステンレス', null, 'https://soto.shinfuji.co.jp/products/st-526t/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-526T_01-1.jpg', 'https://soto.shinfuji.co.jp/products/st-526t/'),
    ('ST-4891KK', 'マイクロトーチ用ホルスター（カーキ）', 'accessory', 15, 1540, '幅45×奥行30×高さ70mm', 'ナイロン・ポリプロピレン・ポリエステル', null, 'https://soto.shinfuji.co.jp/products/st-4891kk/', 'https://soto.shinfuji.co.jp/wp-content/uploads/products/ST-4891KK_01.jpg', 'https://soto.shinfuji.co.jp/products/st-4891kk/')
) as v(model, name_ja, subcategory_en, official_weight_grams, msrp_jpy, size, material, capacity, official_url, image_url, msrp_source_url)
join public.gear_categories c on c.name_en = 'cooking'
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
