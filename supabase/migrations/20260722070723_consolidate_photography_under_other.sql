-- Keep the legacy photography category and its detailed subcategories readable.
-- New manual entries use the single photography subcategory under Other instead.
insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select category.id, '撮影機材', 'photography', 110
from public.gear_categories as category
where category.name_en = 'other'
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

update public.gear_categories
set is_default = false
where name_en = 'photography';

do $$
begin
  if (
    select count(*)
    from public.gear_subcategories as subcategory
    join public.gear_categories as category on category.id = subcategory.category_id
    where category.name_en = 'other'
      and subcategory.name_en = 'photography'
      and subcategory.name_ja = '撮影機材'
  ) <> 1 then
    raise exception 'Other photography subcategory was not seeded exactly once';
  end if;

  if exists (
    select 1
    from public.gear_categories
    where name_en = 'photography'
      and is_default
  ) then
    raise exception 'Legacy photography category must not be a default entry category';
  end if;
end;
$$;
