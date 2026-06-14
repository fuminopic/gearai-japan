-- Static Mountain Foundation corrections reviewed by Opus 4.8 and Sonnet 4.6.
-- This updates mountain profile data only and does not change recommendation engines, pack planning, or gear matching.

update public.mountain_foundation_profiles
set bear_or_wildlife_risk = 'LOW'
where slug = 'rishiri-zan';

update public.mountain_foundation_profiles
set
  route_seriousness = 'LOW',
  technical_terrain = 'MAINTAINED_TRAIL'
where slug = 'utsukushigahara';

update public.mountain_foundation_profiles
set
  route_seriousness = 'LOW',
  technical_terrain = 'MAINTAINED_TRAIL'
where slug = 'kirigamine';

update public.mountain_foundation_profiles
set
  route_seriousness = 'MODERATE',
  technical_terrain = 'MAINTAINED_TRAIL'
where slug = 'daibosatsu-rei';

update public.mountain_foundation_profiles
set
  route_seriousness = 'MODERATE',
  technical_terrain = 'MAINTAINED_TRAIL'
where slug = 'tsurugi-san-shikoku';
