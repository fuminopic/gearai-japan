insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('other', 'アイゼン', 'crampons', 52),
    ('other', '渡渉用シューズ', 'water_shoes', 55)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

do $$
declare
  other_id uuid;
  sleep_id uuid;
  crampons_sub_id uuid;
  water_shoes_sub_id uuid;
  traction_device_sub_id uuid;
  gloves_sub_id uuid;
  other_sub_id uuid;
  inner_sheet_sub_id uuid;
begin
  select id into other_id from public.gear_categories where name_en = 'other';
  select id into sleep_id from public.gear_categories where name_en = 'sleep';

  if other_id is null then
    raise exception 'Required category other is missing';
  end if;

  if sleep_id is null then
    raise exception 'Required category sleep is missing';
  end if;

  select id into crampons_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'crampons';

  select id into water_shoes_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'water_shoes';

  select id into traction_device_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'traction_device';

  select id into gloves_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'gloves';

  select id into other_sub_id
  from public.gear_subcategories
  where category_id = other_id and name_en = 'other';

  select id into inner_sheet_sub_id
  from public.gear_subcategories
  where category_id = sleep_id and name_en = 'inner_sheet';

  if crampons_sub_id is null then
    raise exception 'Required subcategory other/crampons is missing';
  end if;

  if water_shoes_sub_id is null then
    raise exception 'Required subcategory other/water_shoes is missing';
  end if;

  if traction_device_sub_id is null then
    raise exception 'Required subcategory other/traction_device is missing';
  end if;

  if gloves_sub_id is null then
    raise exception 'Required subcategory other/gloves is missing';
  end if;

  if other_sub_id is null then
    raise exception 'Required subcategory other/other is missing';
  end if;

  if inner_sheet_sub_id is null then
    raise exception 'Required subcategory sleep/inner_sheet is missing';
  end if;

  update public.gear_products
  set category_id = other_id,
      subcategory_id = crampons_sub_id
  where brand = 'Black Diamond'
    and model in (
      'コンタクト ストラップ',
      'セラック ストラップ',
      'セラック クリップ',
      'セイバートゥース プロ',
      'サイボーグ プロ',
      'ネーベ プロ',
      'ネーベ ストラップ'
    );

  update public.gear_products
  set category_id = other_id,
      subcategory_id = gloves_sub_id
  where brand = 'Black Diamond'
    and model in (
      'ライトウェイト スクリーンタップライナー',
      'ミッドウェイト スクリーンタップライナー',
      'ヘビーウェイト スクリーンタップライナー'
    )
    and category_id = sleep_id
    and subcategory_id = inner_sheet_sub_id;

  update public.gear_products
  set category_id = other_id,
      subcategory_id = other_sub_id
  where brand = '山と道'
    and model = 'Pack Liner (3pcs.)'
    and category_id = sleep_id
    and subcategory_id = inner_sheet_sub_id;
end $$;
