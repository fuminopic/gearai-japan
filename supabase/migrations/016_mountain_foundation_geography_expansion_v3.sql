alter table public.mountain_foundation_profiles
  drop constraint if exists mountain_foundation_profiles_region_check;

alter table public.mountain_foundation_profiles
  drop constraint if exists mountain_foundation_profiles_primary_region_check;

update public.mountain_foundation_profiles
set primary_region = case
      when slug = 'takao-san' then 'KANTO'
      when slug in ('tanigawa-dake', 'naeba-san', 'asama-yama') then 'HOKUSHINETSU'
      when region = 'KANTO_TOKYO' then 'KANTO'
      when region = 'KANTO_TOKYO_SAITAMA_YAMANASHI' then 'OKUCHICHIBU'
      when region = 'NORTHERN_ALPS_NAGANO' then 'NORTHERN_ALPS'
      when region = 'NORTHERN_ALPS_NAGANO_GIFU' then 'NORTHERN_ALPS'
      when primary_region = 'KANTO_TOKYO' then 'KANTO'
      when primary_region = 'JOSHU' then 'HOKUSHINETSU'
      else primary_region
    end,
    region = case
      when slug = 'takao-san' then 'KANTO'
      when slug in ('tanigawa-dake', 'naeba-san', 'asama-yama') then 'HOKUSHINETSU'
      when region = 'KANTO_TOKYO' then 'KANTO'
      when region = 'KANTO_TOKYO_SAITAMA_YAMANASHI' then 'OKUCHICHIBU'
      when region = 'NORTHERN_ALPS_NAGANO' then 'NORTHERN_ALPS'
      when region = 'NORTHERN_ALPS_NAGANO_GIFU' then 'NORTHERN_ALPS'
      when region = 'JOSHU' then 'HOKUSHINETSU'
      else region
    end;

alter table public.mountain_foundation_profiles
  add constraint mountain_foundation_profiles_region_check
  check (
    region in (
      'HOKKAIDO',
      'TOHOKU',
      'HOKUSHINETSU',
      'KANTO',
      'FUJI',
      'OKUCHICHIBU',
      'TANZAWA',
      'NIKKO',
      'YATSUGATAKE',
      'NORTHERN_ALPS',
      'CENTRAL_ALPS',
      'SOUTHERN_ALPS',
      'CHUGOKU',
      'SHIKOKU',
      'KYUSHU',
      'YAKUSHIMA',
      'KANTO_TOKYO',
      'KANTO_TOKYO_SAITAMA_YAMANASHI',
      'NORTHERN_ALPS_NAGANO',
      'NORTHERN_ALPS_NAGANO_GIFU',
      'JOSHU'
    )
  );

alter table public.mountain_foundation_profiles
  add constraint mountain_foundation_profiles_primary_region_check
  check (
    primary_region in (
      'HOKKAIDO',
      'TOHOKU',
      'HOKUSHINETSU',
      'KANTO',
      'FUJI',
      'OKUCHICHIBU',
      'TANZAWA',
      'NIKKO',
      'YATSUGATAKE',
      'NORTHERN_ALPS',
      'CENTRAL_ALPS',
      'SOUTHERN_ALPS',
      'CHUGOKU',
      'SHIKOKU',
      'KYUSHU',
      'YAKUSHIMA',
      'KANTO_TOKYO',
      'JOSHU'
    )
  );
