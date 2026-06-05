insert into public.gear_categories (name_ja, name_en, sort_order, is_default)
values
  ('背負システム', 'backpack', 10, true),
  ('シェルター', 'shelter', 20, true),
  ('睡眠システム', 'sleep', 30, true),
  ('クッキング', 'cooking', 40, true),
  ('ウェア', 'clothing', 50, true),
  ('電子機器', 'electronics', 60, true),
  ('応急処置', 'first_aid', 70, true),
  ('熊対策', 'bear_safety', 80, true),
  ('その他', 'other', 90, true)
on conflict (name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order,
    is_default = true;

update public.gear_categories
set is_default = false
where name_en in (
  'backpacking',
  'carry',
  'sleeping',
  'rainwear',
  'safety',
  'navigation',
  'hydration'
);

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
    ('cooking', 'ストーブ', 'stove', 10),
    ('cooking', 'ガス缶', 'gas_canister', 20),
    ('cooking', '燃料', 'fuel', 30),
    ('cooking', 'クッカー', 'cookware', 40),
    ('cooking', '食器', 'tableware', 50),
    ('cooking', 'アクセサリー', 'accessory', 60),
    ('clothing', 'レインウェア', 'rainwear', 10),
    ('clothing', 'レインジャケット', 'rain_jacket', 20),
    ('clothing', 'レインパンツ', 'rain_pants', 30),
    ('clothing', '保温着', 'insulation', 40),
    ('clothing', 'ダウンジャケット', 'down_jacket', 50),
    ('clothing', 'ベースレイヤー', 'base_layer', 60),
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

do $$
declare
  backpack_id uuid;
  backpack_sub_id uuid;
  sleep_id uuid;
  clothing_id uuid;
  cooking_id uuid;
  gas_canister_sub_id uuid;
  tableware_sub_id uuid;
  electronics_id uuid;
  first_aid_id uuid;
  first_aid_sub_id uuid;
  bear_safety_id uuid;
  bear_bell_sub_id uuid;
  bear_spray_sub_id uuid;
  other_id uuid;
  other_sub_id uuid;
  water_filter_sub_id uuid;
begin
  select id into backpack_id from public.gear_categories where name_en = 'backpack';
  select id into sleep_id from public.gear_categories where name_en = 'sleep';
  select id into clothing_id from public.gear_categories where name_en = 'clothing';
  select id into cooking_id from public.gear_categories where name_en = 'cooking';
  select id into electronics_id from public.gear_categories where name_en = 'electronics';
  select id into first_aid_id from public.gear_categories where name_en = 'first_aid';
  select id into bear_safety_id from public.gear_categories where name_en = 'bear_safety';
  select id into other_id from public.gear_categories where name_en = 'other';

  select id into backpack_sub_id from public.gear_subcategories where category_id = backpack_id and name_en = 'backpack';
  select id into gas_canister_sub_id from public.gear_subcategories where category_id = cooking_id and name_en = 'gas_canister';
  select id into tableware_sub_id from public.gear_subcategories where category_id = cooking_id and name_en = 'tableware';
  select id into first_aid_sub_id from public.gear_subcategories where category_id = first_aid_id and name_en = 'first_aid_kit';
  select id into bear_bell_sub_id from public.gear_subcategories where category_id = bear_safety_id and name_en = 'bear_bell';
  select id into bear_spray_sub_id from public.gear_subcategories where category_id = bear_safety_id and name_en = 'bear_spray';
  select id into other_sub_id from public.gear_subcategories where category_id = other_id and name_en = 'other';
  select id into water_filter_sub_id from public.gear_subcategories where category_id = other_id and name_en = 'water_filter';

  update public.gear_products p
  set category_id = backpack_id,
      subcategory_id = coalesce(backpack_sub_id, p.subcategory_id)
  from public.gear_categories c
  where p.category_id = c.id
    and c.name_en in ('backpacking', 'carry');

  update public.user_gear g
  set category_id = backpack_id,
      subcategory_id = coalesce(backpack_sub_id, g.subcategory_id)
  from public.gear_categories c
  where g.category_id = c.id
    and c.name_en in ('backpacking', 'carry');

  update public.gear_products p
  set category_id = sleep_id,
      subcategory_id = coalesce(
        (
          select s.id
          from public.gear_subcategories old_s
          join public.gear_subcategories s on s.category_id = sleep_id and s.name_en = old_s.name_en
          where old_s.id = p.subcategory_id
          limit 1
        ),
        p.subcategory_id
      )
  from public.gear_categories c
  where p.category_id = c.id
    and c.name_en = 'sleeping';

  update public.user_gear g
  set category_id = sleep_id,
      subcategory_id = coalesce(
        (
          select s.id
          from public.gear_subcategories old_s
          join public.gear_subcategories s on s.category_id = sleep_id and s.name_en = old_s.name_en
          where old_s.id = g.subcategory_id
          limit 1
        ),
        g.subcategory_id
      )
  from public.gear_categories c
  where g.category_id = c.id
    and c.name_en = 'sleeping';

  update public.gear_products p
  set category_id = clothing_id,
      subcategory_id = coalesce(
        (
          select s.id
          from public.gear_subcategories old_s
          join public.gear_subcategories s
            on s.category_id = clothing_id
            and s.name_en = case
              when old_s.name_en in ('rain_jacket', 'rain_pants', 'rainwear') then old_s.name_en
              else 'rainwear'
            end
          where old_s.id = p.subcategory_id
          limit 1
        ),
        p.subcategory_id
      )
  from public.gear_categories c
  where p.category_id = c.id
    and c.name_en = 'rainwear';

  update public.user_gear g
  set category_id = clothing_id,
      subcategory_id = coalesce(
        (
          select s.id
          from public.gear_subcategories old_s
          join public.gear_subcategories s
            on s.category_id = clothing_id
            and s.name_en = case
              when old_s.name_en in ('rain_jacket', 'rain_pants', 'rainwear') then old_s.name_en
              else 'rainwear'
            end
          where old_s.id = g.subcategory_id
          limit 1
        ),
        g.subcategory_id
      )
  from public.gear_categories c
  where g.category_id = c.id
    and c.name_en = 'rainwear';

  update public.gear_products p
  set category_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '') || ' ' || coalesce((select old_s.name_en from public.gear_subcategories old_s where old_s.id = p.subcategory_id), '')) ~ '(bear|熊|spray|スプレー)'
          then bear_safety_id
        else first_aid_id
      end,
      subcategory_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(spray|スプレー)'
          then bear_spray_sub_id
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '') || ' ' || coalesce((select old_s.name_en from public.gear_subcategories old_s where old_s.id = p.subcategory_id), '')) ~ '(bear|熊)'
          then bear_bell_sub_id
        else first_aid_sub_id
      end
  from public.gear_categories c
  where p.category_id = c.id
    and c.name_en = 'safety';

  update public.user_gear g
  set category_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '') || ' ' || coalesce((select old_s.name_en from public.gear_subcategories old_s where old_s.id = g.subcategory_id), '')) ~ '(bear|熊|spray|スプレー)'
          then bear_safety_id
        else first_aid_id
      end,
      subcategory_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(spray|スプレー)'
          then bear_spray_sub_id
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '') || ' ' || coalesce((select old_s.name_en from public.gear_subcategories old_s where old_s.id = g.subcategory_id), '')) ~ '(bear|熊)'
          then bear_bell_sub_id
        else first_aid_sub_id
      end
  from public.gear_categories c
  where g.category_id = c.id
    and c.name_en = 'safety';

  update public.gear_products p
  set category_id = electronics_id,
      subcategory_id = coalesce(
        (
          select s.id
          from public.gear_subcategories s
          where s.category_id = electronics_id
            and s.name_en = case
              when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(gps)' then 'gps'
              else 'power_bank'
            end
          limit 1
        ),
        p.subcategory_id
      )
  from public.gear_categories c
  where p.category_id = c.id
    and c.name_en = 'navigation';

  update public.user_gear g
  set category_id = electronics_id,
      subcategory_id = coalesce(
        (
          select s.id
          from public.gear_subcategories s
          where s.category_id = electronics_id
            and s.name_en = case
              when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(gps)' then 'gps'
              else 'power_bank'
            end
          limit 1
        ),
        g.subcategory_id
      )
  from public.gear_categories c
  where g.category_id = c.id
    and c.name_en = 'navigation';

  update public.gear_products p
  set category_id = other_id,
      subcategory_id = case
        when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(filter|フィルター|浄水)'
          then water_filter_sub_id
        else other_sub_id
      end
  from public.gear_categories c
  where p.category_id = c.id
    and c.name_en = 'hydration';

  update public.user_gear g
  set category_id = other_id,
      subcategory_id = case
        when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(filter|フィルター|浄水)'
          then water_filter_sub_id
        else other_sub_id
      end
  from public.gear_categories c
  where g.category_id = c.id
    and c.name_en = 'hydration';

  update public.gear_products p
  set subcategory_id = case
    when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(canister|gas can|ガス缶|cb tough|triple mix|power gas|パワーガス|st-711|st-712|sod-710t|sod-725t|sod-750t)'
      then gas_canister_sub_id
    when lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(mug|マグ|cup|カップ|食器)'
      then tableware_sub_id
    else p.subcategory_id
  end
  where p.category_id = cooking_id
    and (
      lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(canister|gas can|ガス缶|cb tough|triple mix|power gas|パワーガス|st-711|st-712|sod-710t|sod-725t|sod-750t)'
      or lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(mug|マグ|cup|カップ|食器)'
    );

  update public.user_gear g
  set subcategory_id = case
    when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(canister|gas can|ガス缶|cb tough|triple mix|power gas|パワーガス|st-711|st-712|sod-710t|sod-725t|sod-750t)'
      then gas_canister_sub_id
    when lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(mug|マグ|cup|カップ|食器)'
      then tableware_sub_id
    else g.subcategory_id
  end
  where g.category_id = cooking_id
    and (
      lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(canister|gas can|ガス缶|cb tough|triple mix|power gas|パワーガス|st-711|st-712|sod-710t|sod-725t|sod-750t)'
      or lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(mug|マグ|cup|カップ|食器)'
    );
end $$;
