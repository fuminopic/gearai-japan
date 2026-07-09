update public.mountain_foundation_profiles
set supported_styles = array['DAY_HIKE']::text[],
    route_seriousness = 'LOW',
    technical_terrain = 'MAINTAINED_TRAIL',
    water_availability = 'TREATED_RELIABLE',
    hut_support = 'NONE',
    route_duration_band = 'SHORT',
    escape_options = 'EASY'
where slug = 'taishaku-san';
