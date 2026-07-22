-- Photography is an opt-in My Gear/My Pack taxonomy only. This migration does
-- not reclassify existing user gear or alter recommendation/checklist rules.
insert into public.gear_categories (name_ja, name_en, sort_order, is_default)
values ('撮影機材', 'photography', 110, true)
on conflict (name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order,
    is_default = excluded.is_default;

insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select category.id, subcategory.name_ja, subcategory.name_en, subcategory.sort_order
from public.gear_categories as category
join (
  values
    ('カメラ本体', 'camera', 10),
    ('レンズ', 'lens', 20),
    ('三脚・雲台', 'tripod', 30),
    ('ドローン', 'drone', 40),
    ('バッテリー', 'camera_battery', 50),
    ('アクセサリー', 'camera_accessory', 60)
) as subcategory(name_ja, name_en, sort_order)
  on category.name_en = 'photography'
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

do $$
begin
  if (
    select count(*)
    from public.gear_subcategories as subcategory
    join public.gear_categories as category on category.id = subcategory.category_id
    where category.name_en = 'photography'
      and subcategory.name_en in (
        'camera',
        'lens',
        'tripod',
        'drone',
        'camera_battery',
        'camera_accessory'
      )
  ) <> 6 then
    raise exception 'Photography gear subcategories were not seeded completely';
  end if;
end;
$$;
