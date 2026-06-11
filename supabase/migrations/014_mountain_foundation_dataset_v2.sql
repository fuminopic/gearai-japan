alter table public.mountain_foundation_profiles
  drop constraint if exists mountain_foundation_profiles_typical_required_systems_check;

alter table public.mountain_foundation_profiles
  add constraint mountain_foundation_profiles_typical_required_systems_check
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
      'TECHNICAL_SAFETY_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
  );

alter table public.mountain_foundation_profiles
  add column if not exists route_seriousness text not null default 'MODERATE'
    constraint mountain_foundation_profiles_route_seriousness_check
    check (route_seriousness in ('LOW', 'MODERATE', 'HIGH', 'EXTREME')),
  add column if not exists technical_terrain text not null default 'MAINTAINED_TRAIL'
    constraint mountain_foundation_profiles_technical_terrain_check
    check (technical_terrain in ('MAINTAINED_TRAIL', 'STEEP_ROCKY', 'CHAIN_LADDER', 'EXPOSED_SCRAMBLE')),
  add column if not exists helmet_guidance text not null default 'NOT_NEEDED'
    constraint mountain_foundation_profiles_helmet_guidance_check
    check (helmet_guidance in ('NOT_NEEDED', 'RECOMMENDED', 'REQUIRED')),
  add column if not exists water_availability text not null default 'NATURAL_RELIABLE'
    constraint mountain_foundation_profiles_water_availability_check
    check (water_availability in ('TREATED_RELIABLE', 'HUT_OR_SHOP_RELIABLE', 'NATURAL_RELIABLE', 'LIMITED_OR_SEASONAL', 'UNRELIABLE')),
  add column if not exists hut_support text not null default 'BASIC_NO_BEDDING'
    constraint mountain_foundation_profiles_hut_support_check
    check (hut_support in ('NONE', 'EMERGENCY_ONLY', 'BASIC_NO_BEDDING', 'BEDDING_ONLY', 'FULL_SERVICE')),
  add column if not exists tent_site_availability text not null default 'UNKNOWN'
    constraint mountain_foundation_profiles_tent_site_availability_check
    check (tent_site_availability in ('NONE', 'DESIGNATED', 'LIMITED', 'WILD_PERMITTED', 'UNKNOWN')),
  add column if not exists alpine_environment text not null default 'LOWLAND_FOREST'
    constraint mountain_foundation_profiles_alpine_environment_check
    check (alpine_environment in ('LOWLAND_FOREST', 'SUBALPINE_FOREST', 'ABOVE_TREELINE', 'HIGH_ALPINE_EXPOSED')),
  add column if not exists snow_or_ice_risk text not null default 'LOW'
    constraint mountain_foundation_profiles_snow_or_ice_risk_check
    check (snow_or_ice_risk in ('NONE', 'LOW', 'SEASONAL_PATCHES', 'LIKELY', 'WINTER_ALPINE')),
  add column if not exists route_duration_band text not null default 'FULL_DAY'
    constraint mountain_foundation_profiles_route_duration_band_check
    check (route_duration_band in ('SHORT', 'HALF_DAY', 'FULL_DAY', 'LONG_DAY', 'MULTI_DAY')),
  add column if not exists escape_options text not null default 'MODERATE'
    constraint mountain_foundation_profiles_escape_options_check
    check (escape_options in ('EASY', 'MODERATE', 'LIMITED', 'REMOTE')),
  add column if not exists cell_signal_reliability text not null default 'PARTIAL'
    constraint mountain_foundation_profiles_cell_signal_reliability_check
    check (cell_signal_reliability in ('RELIABLE', 'PARTIAL', 'POOR', 'NONE')),
  add column if not exists bear_or_wildlife_risk text not null default 'LOW'
    constraint mountain_foundation_profiles_bear_or_wildlife_risk_check
    check (bear_or_wildlife_risk in ('LOW', 'MODERATE', 'HIGH')),
  add column if not exists volcanic_risk text not null default 'NONE'
    constraint mountain_foundation_profiles_volcanic_risk_check
    check (volcanic_risk in ('NONE', 'ACTIVE_MONITORED', 'ACTIVE_RESTRICTED')),
  add column if not exists season_opening_window text not null default 'SNOW_FREE'
    constraint mountain_foundation_profiles_season_opening_window_check
    check (season_opening_window in ('YEAR_ROUND', 'SNOW_FREE', 'SUMMER_AUTUMN', 'HUT_SEASON', 'WINTER_EXPERT_ONLY'));

insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from (
  values
    ('other', 'ヘルメット', 'helmet', 40),
    ('other', '軽アイゼン・チェーンスパイク', 'traction_device', 50)
) as v(category_en, name_ja, name_en, sort_order)
join public.gear_categories c on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

update public.mountain_foundation_profiles
set route_seriousness = 'LOW',
    technical_terrain = 'MAINTAINED_TRAIL',
    helmet_guidance = 'NOT_NEEDED',
    water_availability = 'TREATED_RELIABLE',
    hut_support = 'NONE',
    tent_site_availability = 'NONE',
    alpine_environment = 'LOWLAND_FOREST',
    snow_or_ice_risk = 'LOW',
    route_duration_band = 'HALF_DAY',
    escape_options = 'EASY',
    cell_signal_reliability = 'RELIABLE',
    bear_or_wildlife_risk = 'LOW',
    volcanic_risk = 'NONE',
    season_opening_window = 'YEAR_ROUND'
where slug = 'takao-san';

update public.mountain_foundation_profiles
set route_seriousness = 'HIGH',
    technical_terrain = 'STEEP_ROCKY',
    helmet_guidance = 'NOT_NEEDED',
    water_availability = 'LIMITED_OR_SEASONAL',
    hut_support = 'FULL_SERVICE',
    tent_site_availability = 'DESIGNATED',
    alpine_environment = 'SUBALPINE_FOREST',
    snow_or_ice_risk = 'LOW',
    route_duration_band = 'LONG_DAY',
    escape_options = 'LIMITED',
    cell_signal_reliability = 'PARTIAL',
    bear_or_wildlife_risk = 'MODERATE',
    volcanic_risk = 'NONE',
    season_opening_window = 'SNOW_FREE'
where slug = 'kumotori-yama';

update public.mountain_foundation_profiles
set route_seriousness = 'HIGH',
    technical_terrain = 'STEEP_ROCKY',
    helmet_guidance = 'NOT_NEEDED',
    water_availability = 'HUT_OR_SHOP_RELIABLE',
    hut_support = 'FULL_SERVICE',
    tent_site_availability = 'DESIGNATED',
    alpine_environment = 'HIGH_ALPINE_EXPOSED',
    snow_or_ice_risk = 'SEASONAL_PATCHES',
    route_duration_band = 'MULTI_DAY',
    escape_options = 'MODERATE',
    cell_signal_reliability = 'PARTIAL',
    bear_or_wildlife_risk = 'MODERATE',
    volcanic_risk = 'NONE',
    season_opening_window = 'SUMMER_AUTUMN',
    typical_required_systems = array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'TECHNICAL_SAFETY_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
where slug = 'tsubakuro-dake';

update public.mountain_foundation_profiles
set route_seriousness = 'EXTREME',
    technical_terrain = 'EXPOSED_SCRAMBLE',
    helmet_guidance = 'RECOMMENDED',
    water_availability = 'HUT_OR_SHOP_RELIABLE',
    hut_support = 'FULL_SERVICE',
    tent_site_availability = 'DESIGNATED',
    alpine_environment = 'HIGH_ALPINE_EXPOSED',
    snow_or_ice_risk = 'SEASONAL_PATCHES',
    route_duration_band = 'MULTI_DAY',
    escape_options = 'LIMITED',
    cell_signal_reliability = 'POOR',
    bear_or_wildlife_risk = 'MODERATE',
    volcanic_risk = 'NONE',
    season_opening_window = 'SUMMER_AUTUMN',
    typical_required_systems = array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'TECHNICAL_SAFETY_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
where slug = 'yarigatake';

update public.mountain_foundation_profiles
set route_seriousness = 'EXTREME',
    technical_terrain = 'EXPOSED_SCRAMBLE',
    helmet_guidance = 'RECOMMENDED',
    water_availability = 'HUT_OR_SHOP_RELIABLE',
    hut_support = 'FULL_SERVICE',
    tent_site_availability = 'DESIGNATED',
    alpine_environment = 'HIGH_ALPINE_EXPOSED',
    snow_or_ice_risk = 'SEASONAL_PATCHES',
    route_duration_band = 'MULTI_DAY',
    escape_options = 'LIMITED',
    cell_signal_reliability = 'POOR',
    bear_or_wildlife_risk = 'MODERATE',
    volcanic_risk = 'NONE',
    season_opening_window = 'SUMMER_AUTUMN',
    typical_required_systems = array[
      'WATER_SYSTEM',
      'SHELTER_SYSTEM',
      'SLEEP_SYSTEM',
      'COOK_SYSTEM',
      'RAIN_SYSTEM',
      'COLD_WEATHER_LAYER',
      'NAVIGATION_SYSTEM',
      'TECHNICAL_SAFETY_SYSTEM',
      'EMERGENCY_SYSTEM'
    ]::text[]
where slug = 'okuhotakadake';
