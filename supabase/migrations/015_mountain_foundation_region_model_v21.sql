alter table public.mountain_foundation_profiles
  drop constraint if exists mountain_foundation_profiles_region_check;

alter table public.mountain_foundation_profiles
  add constraint mountain_foundation_profiles_region_check
  check (
    region in (
      'KANTO_TOKYO',
      'KANTO_TOKYO_SAITAMA_YAMANASHI',
      'NORTHERN_ALPS_NAGANO',
      'NORTHERN_ALPS_NAGANO_GIFU',
      'FUJI',
      'YATSUGATAKE',
      'CENTRAL_ALPS',
      'SOUTHERN_ALPS',
      'NORTHERN_ALPS',
      'OKUCHICHIBU',
      'TANZAWA',
      'NIKKO',
      'JOSHU'
    )
  );

alter table public.mountain_foundation_profiles
  add column if not exists primary_region text,
  add column if not exists mountain_range text,
  add column if not exists prefectures text[];

update public.mountain_foundation_profiles
set primary_region = case slug
      when 'takao-san' then 'KANTO_TOKYO'
      when 'kumotori-yama' then 'OKUCHICHIBU'
      when 'tsubakuro-dake' then 'NORTHERN_ALPS'
      when 'jonen-dake' then 'NORTHERN_ALPS'
      when 'cho-gatake' then 'NORTHERN_ALPS'
      when 'yarigatake' then 'NORTHERN_ALPS'
      when 'okuhotakadake' then 'NORTHERN_ALPS'
      else coalesce(
        primary_region,
        case region
          when 'NORTHERN_ALPS_NAGANO' then 'NORTHERN_ALPS'
          when 'NORTHERN_ALPS_NAGANO_GIFU' then 'NORTHERN_ALPS'
          when 'KANTO_TOKYO_SAITAMA_YAMANASHI' then 'OKUCHICHIBU'
          else 'KANTO_TOKYO'
        end
      )
    end,
    mountain_range = case slug
      when 'takao-san' then '高尾山系'
      when 'kumotori-yama' then '奥秩父山塊'
      when 'tsubakuro-dake' then '北アルプス'
      when 'jonen-dake' then '北アルプス'
      when 'cho-gatake' then '北アルプス'
      when 'yarigatake' then '北アルプス'
      when 'okuhotakadake' then '北アルプス'
      else coalesce(mountain_range, region)
    end,
    prefectures = case slug
      when 'takao-san' then array['東京都']::text[]
      when 'kumotori-yama' then array['東京都', '埼玉県', '山梨県']::text[]
      when 'tsubakuro-dake' then array['長野県']::text[]
      when 'jonen-dake' then array['長野県']::text[]
      when 'cho-gatake' then array['長野県']::text[]
      when 'yarigatake' then array['長野県', '岐阜県']::text[]
      when 'okuhotakadake' then array['長野県', '岐阜県']::text[]
      else coalesce(prefectures, array['UNKNOWN']::text[])
    end;

alter table public.mountain_foundation_profiles
  alter column primary_region set not null,
  alter column primary_region drop default,
  alter column mountain_range set not null,
  alter column mountain_range drop default,
  alter column prefectures set not null,
  alter column prefectures drop default;

alter table public.mountain_foundation_profiles
  drop constraint if exists mountain_foundation_profiles_primary_region_check,
  drop constraint if exists mountain_foundation_profiles_mountain_range_check,
  drop constraint if exists mountain_foundation_profiles_prefectures_check;

alter table public.mountain_foundation_profiles
  add constraint mountain_foundation_profiles_primary_region_check
  check (
    primary_region in (
      'KANTO_TOKYO',
      'FUJI',
      'YATSUGATAKE',
      'CENTRAL_ALPS',
      'SOUTHERN_ALPS',
      'NORTHERN_ALPS',
      'OKUCHICHIBU',
      'TANZAWA',
      'NIKKO',
      'JOSHU'
    )
  ),
  add constraint mountain_foundation_profiles_mountain_range_check
  check (
    length(trim(mountain_range)) > 0
    and mountain_range <> 'UNKNOWN'
  ),
  add constraint mountain_foundation_profiles_prefectures_check
  check (
    cardinality(prefectures) > 0
    and not (prefectures @> array['']::text[])
    and not (prefectures @> array['UNKNOWN']::text[])
  );
