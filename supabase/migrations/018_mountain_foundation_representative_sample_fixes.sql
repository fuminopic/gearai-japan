-- Representative sample corrections from the 100-mountain foundation dataset.

update public.mountain_foundation_profiles
set supported_styles = array['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK']::text[]
where slug = 'tomuraushi-yama';

update public.mountain_foundation_profiles
set supported_seasons = array['SPRING', 'SUMMER', 'AUTUMN', 'WINTER']::text[]
where slug = 'tsukuba-san';
