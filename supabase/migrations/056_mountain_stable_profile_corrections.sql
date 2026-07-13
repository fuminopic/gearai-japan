update public.mountain_foundation_profiles
set supported_styles = array['DAY_HIKE']::text[],
    hut_support = 'NONE',
    supplementary_notes = null,
    restriction_status_note = null
where slug = 'aso-san';
