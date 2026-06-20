insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('clothing', '帽子', 'hat', 85),
    ('clothing', 'サングラス', 'sunglasses', 88),
    ('clothing', 'ゲイター', 'gaiters', 90),
    ('electronics', '地図', 'map', 40),
    ('electronics', 'コンパス', 'compass', 50),
    ('electronics', '予備電池', 'spare_battery', 60),
    ('first_aid', 'ホイッスル', 'whistle', 20),
    ('first_aid', 'エマージェンシーシート', 'emergency_sheet', 30),
    ('first_aid', '携帯トイレ', 'portable_toilet', 40),
    ('shelter', 'ペグ', 'pegs', 40),
    ('sleep', 'インナーシーツ', 'inner_sheet', 40),
    ('other', '洗面用品', 'toiletries', 60),
    ('other', '耳栓', 'earplugs', 70)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

do $$
declare
  clothing_id uuid;
  hat_sub_id uuid;
  sunglasses_sub_id uuid;
  gaiters_sub_id uuid;
  electronics_id uuid;
  map_sub_id uuid;
  compass_sub_id uuid;
  spare_battery_sub_id uuid;
  first_aid_id uuid;
  whistle_sub_id uuid;
  emergency_sheet_sub_id uuid;
  portable_toilet_sub_id uuid;
  shelter_id uuid;
  pegs_sub_id uuid;
  sleep_id uuid;
  inner_sheet_sub_id uuid;
  other_id uuid;
  toiletries_sub_id uuid;
  earplugs_sub_id uuid;
begin
  select id into clothing_id from public.gear_categories where name_en = 'clothing';
  select id into electronics_id from public.gear_categories where name_en = 'electronics';
  select id into first_aid_id from public.gear_categories where name_en = 'first_aid';
  select id into shelter_id from public.gear_categories where name_en = 'shelter';
  select id into sleep_id from public.gear_categories where name_en = 'sleep';
  select id into other_id from public.gear_categories where name_en = 'other';

  select id into hat_sub_id from public.gear_subcategories where category_id = clothing_id and name_en = 'hat';
  select id into sunglasses_sub_id from public.gear_subcategories where category_id = clothing_id and name_en = 'sunglasses';
  select id into gaiters_sub_id from public.gear_subcategories where category_id = clothing_id and name_en = 'gaiters';
  select id into map_sub_id from public.gear_subcategories where category_id = electronics_id and name_en = 'map';
  select id into compass_sub_id from public.gear_subcategories where category_id = electronics_id and name_en = 'compass';
  select id into spare_battery_sub_id from public.gear_subcategories where category_id = electronics_id and name_en = 'spare_battery';
  select id into whistle_sub_id from public.gear_subcategories where category_id = first_aid_id and name_en = 'whistle';
  select id into emergency_sheet_sub_id from public.gear_subcategories where category_id = first_aid_id and name_en = 'emergency_sheet';
  select id into portable_toilet_sub_id from public.gear_subcategories where category_id = first_aid_id and name_en = 'portable_toilet';
  select id into pegs_sub_id from public.gear_subcategories where category_id = shelter_id and name_en = 'pegs';
  select id into inner_sheet_sub_id from public.gear_subcategories where category_id = sleep_id and name_en = 'inner_sheet';
  select id into toiletries_sub_id from public.gear_subcategories where category_id = other_id and name_en = 'toiletries';
  select id into earplugs_sub_id from public.gear_subcategories where category_id = other_id and name_en = 'earplugs';

  update public.gear_products p
  set category_id = clothing_id,
      subcategory_id = hat_sub_id,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(hat|cap|beanie|balaclava|帽子|キャップ|ビーニー|バラクラバ)';

  update public.user_gear g
  set category_id = clothing_id,
      subcategory_id = hat_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(hat|cap|beanie|balaclava|帽子|キャップ|ビーニー|バラクラバ)';

  update public.gear_products p
  set category_id = clothing_id,
      subcategory_id = sunglasses_sub_id,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(sunglasses|sun glasses|サングラス)';

  update public.user_gear g
  set category_id = clothing_id,
      subcategory_id = sunglasses_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(sunglasses|sun glasses|サングラス)';

  update public.gear_products p
  set category_id = clothing_id,
      subcategory_id = gaiters_sub_id,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(gaiter|gaiters|ゲイター|スパッツ)';

  update public.user_gear g
  set category_id = clothing_id,
      subcategory_id = gaiters_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(gaiter|gaiters|ゲイター|スパッツ)';

  update public.gear_products p
  set category_id = electronics_id,
      subcategory_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(compass|コンパス)' then compass_sub_id
        else map_sub_id
      end,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(map|compass|地図|山と高原地図|コンパス)';

  update public.user_gear g
  set category_id = electronics_id,
      subcategory_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(compass|コンパス)' then compass_sub_id
        else map_sub_id
      end
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(map|compass|地図|山と高原地図|コンパス)';

  update public.gear_products p
  set category_id = electronics_id,
      subcategory_id = spare_battery_sub_id,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(spare battery|battery set|予備電池|乾電池|電池)';

  update public.user_gear g
  set category_id = electronics_id,
      subcategory_id = spare_battery_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(spare battery|battery set|予備電池|乾電池|電池)';

  update public.gear_products p
  set category_id = first_aid_id,
      subcategory_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(toilet|トイレ)' then portable_toilet_sub_id
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(sheet|blanket|シート|ブランケット)' then emergency_sheet_sub_id
        else whistle_sub_id
      end,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(whistle|emergency sheet|emergency blanket|portable toilet|ホイッスル|笛|エマージェンシーシート|サバイバルシート|携帯トイレ)';

  update public.user_gear g
  set category_id = first_aid_id,
      subcategory_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(toilet|トイレ)' then portable_toilet_sub_id
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(sheet|blanket|シート|ブランケット)' then emergency_sheet_sub_id
        else whistle_sub_id
      end
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(whistle|emergency sheet|emergency blanket|portable toilet|ホイッスル|笛|エマージェンシーシート|サバイバルシート|携帯トイレ)';

  update public.gear_products p
  set category_id = shelter_id,
      subcategory_id = pegs_sub_id,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(peg|stake|ペグ)';

  update public.user_gear g
  set category_id = shelter_id,
      subcategory_id = pegs_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(peg|stake|ペグ)';

  update public.gear_products p
  set category_id = sleep_id,
      subcategory_id = inner_sheet_sub_id,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(inner sheet|liner|インナーシーツ|シュラフシーツ|ライナー)';

  update public.user_gear g
  set category_id = sleep_id,
      subcategory_id = inner_sheet_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(inner sheet|liner|インナーシーツ|シュラフシーツ|ライナー)';

  update public.gear_products p
  set category_id = other_id,
      subcategory_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(earplug|耳栓)' then earplugs_sub_id
        else toiletries_sub_id
      end,
      last_verified_at = date '2026-06-21',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(toiletries|toothbrush|soap|earplug|洗面|歯ブラシ|石けん|耳栓)';

  update public.user_gear g
  set category_id = other_id,
      subcategory_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(earplug|耳栓)' then earplugs_sub_id
        else toiletries_sub_id
      end
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(toiletries|toothbrush|soap|earplug|洗面|歯ブラシ|石けん|耳栓)';
end $$;
