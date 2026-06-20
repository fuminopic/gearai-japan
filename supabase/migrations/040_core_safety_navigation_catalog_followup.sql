insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('electronics', 'GPS', 'gps', 20),
    ('electronics', 'モバイルバッテリー', 'power_bank', 30),
    ('first_aid', 'ファーストエイドキット', 'first_aid_kit', 10)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

do $$
declare
  electronics_id uuid;
  gps_sub_id uuid;
  power_bank_sub_id uuid;
  first_aid_id uuid;
  first_aid_sub_id uuid;
begin
  select id into electronics_id from public.gear_categories where name_en = 'electronics';
  select id into first_aid_id from public.gear_categories where name_en = 'first_aid';

  select id into gps_sub_id
  from public.gear_subcategories
  where category_id = electronics_id and name_en = 'gps';

  select id into power_bank_sub_id
  from public.gear_subcategories
  where category_id = electronics_id and name_en = 'power_bank';

  select id into first_aid_sub_id
  from public.gear_subcategories
  where category_id = first_aid_id and name_en = 'first_aid_kit';

  update public.gear_products p
  set category_id = electronics_id,
      subcategory_id = gps_sub_id,
      last_verified_at = date '2026-06-20',
      verification_status = case
        when p.brand = 'Garmin' and p.model = 'eTrex SE' then 'verified'
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  from public.gear_categories c
  where p.category_id = c.id
    and (
      (
        c.name_en = 'navigation'
        and exists (
          select 1
          from public.gear_subcategories s
          where s.id = p.subcategory_id
            and s.name_en = 'gps'
        )
      )
      or lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(garmin|etrex|gpsmap|inreach|\mgps\M)'
    );

  update public.user_gear g
  set category_id = electronics_id,
      subcategory_id = gps_sub_id
  from public.gear_categories c
  where g.category_id = c.id
    and (
      (
        c.name_en = 'navigation'
        and exists (
          select 1
          from public.gear_subcategories s
          where s.id = g.subcategory_id
            and s.name_en = 'gps'
        )
      )
      or lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(garmin|etrex|gpsmap|inreach|\mgps\M)'
    );

  update public.gear_products p
  set category_id = electronics_id,
      subcategory_id = power_bank_sub_id,
      last_verified_at = date '2026-06-20',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  where lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(power bank|powercore|battery pack|mobile battery|portable battery|モバイルバッテリー|携帯バッテリー|バッテリーパック)';

  update public.user_gear g
  set category_id = electronics_id,
      subcategory_id = power_bank_sub_id
  where lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(power bank|powercore|battery pack|mobile battery|portable battery|モバイルバッテリー|携帯バッテリー|バッテリーパック)';

  update public.gear_products p
  set category_id = first_aid_id,
      subcategory_id = first_aid_sub_id,
      last_verified_at = date '2026-06-20',
      verification_status = case
        when p.verification_status = 'verified' then p.verification_status
        else 'needs_review'
      end
  from public.gear_categories c
  where p.category_id = c.id
    and (
      (c.name_en = 'safety' and lower(coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) !~ '(bear|熊|spray|スプレー)')
      or lower(coalesce(p.brand, '') || ' ' || coalesce(p.name_ja, '') || ' ' || coalesce(p.model, '')) ~ '(first aid|medical kit|ファーストエイド|救急)'
    );

  update public.user_gear g
  set category_id = first_aid_id,
      subcategory_id = first_aid_sub_id
  from public.gear_categories c
  where g.category_id = c.id
    and (
      (c.name_en = 'safety' and lower(coalesce(g.name, '') || ' ' || coalesce(g.model, '')) !~ '(bear|熊|spray|スプレー)')
      or lower(coalesce(g.brand, '') || ' ' || coalesce(g.name, '') || ' ' || coalesce(g.model, '')) ~ '(first aid|medical kit|ファーストエイド|救急)'
    );
end $$;

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
  v.brand,
  v.model,
  v.name_ja,
  c.id,
  s.id,
  v.official_weight_grams,
  v.official_weight_grams,
  null,
  null,
  v.size,
  null,
  null,
  null,
  v.capacity,
  v.official_url,
  v.image_url,
  null,
  false,
  v.official_url,
  date '2026-06-20',
  'verified'
from (
  values
    (
      'Garmin',
      'eTrex SE',
      'eTrex SE',
      'electronics',
      'gps',
      157,
      '2.4" x 4.0" x 1.3" / 6.1 x 10.0 x 3.3 cm',
      '2 AA batteries',
      'https://www.garmin.com/en-US/p/835742/pn/010-02734-00/',
      'https://res.garmin.com/en/products/010-02734-00/v/cf-lg.jpg'
    )
) as v(brand, model, name_ja, category_en, subcategory_en, official_weight_grams, size, capacity, official_url, image_url)
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
    discontinued = false,
    msrp_source_url = excluded.msrp_source_url,
    last_verified_at = excluded.last_verified_at,
    verification_status = excluded.verification_status;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('Garmin', 'eTrex SE', 'ガーミン eTrex SE'),
    ('Garmin', 'eTrex SE', 'イートレックス SE'),
    ('Garmin', 'eTrex SE', '010-02734-00'),
    ('Garmin', 'eTrex SE', 'eTrex SE GPS'),
    ('Garmin', 'eTrex SE', 'Garmin Explore')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
where not exists (
  select 1
  from public.gear_product_aliases existing
  where lower(existing.alias) = lower(v.alias)
);
