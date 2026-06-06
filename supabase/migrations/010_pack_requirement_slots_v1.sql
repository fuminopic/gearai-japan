insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, 'ボトル', 'bottle', 30
from public.gear_categories c
where c.name_en = 'other'
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;
