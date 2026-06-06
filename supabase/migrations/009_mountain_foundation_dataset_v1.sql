create table if not exists public.mountain_foundation_profiles (
  slug text primary key
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ja text not null unique,
  region text not null
    check (
      region in (
        'KANTO_TOKYO',
        'KANTO_TOKYO_SAITAMA_YAMANASHI',
        'NORTHERN_ALPS_NAGANO',
        'NORTHERN_ALPS_NAGANO_GIFU'
      )
    ),
  elevation_m integer not null check (elevation_m > 0),
  is_hyakumeizan boolean not null,
  supported_seasons text[] not null
    check (
      cardinality(supported_seasons) > 0
      and supported_seasons <@ array['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']::text[]
    ),
  supported_styles text[] not null
    check (
      cardinality(supported_styles) > 0
      and supported_styles <@ array[
        'DAY_HIKE',
        'OVERNIGHT_HUT',
        'OVERNIGHT_TENT',
        'MULTI_DAY_TREK'
      ]::text[]
    ),
  trip_profile text not null
    check (
      trip_profile in (
        'FRONT_COUNTRY_DAY_HIKE',
        'BACKCOUNTRY_DAY_HIKE',
        'OVERNIGHT_BACKPACKING',
        'ALPINE_TREK'
      )
    ),
  typical_required_systems text[] not null
    check (
      cardinality(typical_required_systems) > 0
      and typical_required_systems <@ array[
        'WATER_SYSTEM',
        'SHELTER_SYSTEM',
        'SLEEP_SYSTEM',
        'COOK_SYSTEM',
        'RAIN_SYSTEM',
        'COLD_WEATHER_LAYER',
        'NAVIGATION_SYSTEM',
        'EMERGENCY_SYSTEM'
      ]::text[]
    )
);

alter table public.mountain_foundation_profiles enable row level security;

drop policy if exists "mountain_foundation_profiles_select_all"
on public.mountain_foundation_profiles;

create policy "mountain_foundation_profiles_select_all"
on public.mountain_foundation_profiles for select
to authenticated
using (true);

insert into public.mountain_foundation_profiles (
  slug,
  name_ja,
  region,
  elevation_m,
  is_hyakumeizan,
  supported_seasons,
  supported_styles,
  trip_profile,
  typical_required_systems
)
values
  (
    'takao-san',
    '高尾山',
    'KANTO_TOKYO',
    599,
    false,
    array['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']::text[],
    array['DAY_HIKE']::text[],
    'FRONT_COUNTRY_DAY_HIKE',
    array['WATER_SYSTEM', 'RAIN_SYSTEM', 'NAVIGATION_SYSTEM', 'EMERGENCY_SYSTEM']::text[]
  ),
  (
    'kumotori-yama',
    '雲取山',
    'KANTO_TOKYO_SAITAMA_YAMANASHI',
    2017,
    true,
    array['SPRING', 'SUMMER', 'AUTUMN']::text[],
    array['DAY_HIKE', 'OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[],
    'OVERNIGHT_BACKPACKING',
    array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  ),
  (
    'tsubakuro-dake',
    '燕岳',
    'NORTHERN_ALPS_NAGANO',
    2763,
    false,
    array['SUMMER', 'AUTUMN']::text[],
    array['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[],
    'ALPINE_TREK',
    array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  ),
  (
    'jonen-dake',
    '常念岳',
    'NORTHERN_ALPS_NAGANO',
    2857,
    true,
    array['SUMMER', 'AUTUMN']::text[],
    array['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[],
    'ALPINE_TREK',
    array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  ),
  (
    'cho-gatake',
    '蝶ヶ岳',
    'NORTHERN_ALPS_NAGANO',
    2677,
    false,
    array['SUMMER', 'AUTUMN']::text[],
    array['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[],
    'ALPINE_TREK',
    array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  ),
  (
    'yarigatake',
    '槍ヶ岳',
    'NORTHERN_ALPS_NAGANO_GIFU',
    3180,
    true,
    array['SUMMER', 'AUTUMN']::text[],
    array['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[],
    'ALPINE_TREK',
    array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  ),
  (
    'okuhotakadake',
    '奥穂高岳',
    'NORTHERN_ALPS_NAGANO_GIFU',
    3190,
    true,
    array['SUMMER', 'AUTUMN']::text[],
    array['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[],
    'ALPINE_TREK',
    array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  )
on conflict (slug) do update
set name_ja = excluded.name_ja,
    region = excluded.region,
    elevation_m = excluded.elevation_m,
    is_hyakumeizan = excluded.is_hyakumeizan,
    supported_seasons = excluded.supported_seasons,
    supported_styles = excluded.supported_styles,
    trip_profile = excluded.trip_profile,
    typical_required_systems = excluded.typical_required_systems;
