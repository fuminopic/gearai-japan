update public.mountain_foundation_profiles
set region = 'HOKURIKU',
    primary_region = 'HOKURIKU',
    supplementary_notes = '南竜ヶ馬場でテント泊可。別山方面へ縦走可。',
    restriction_status_note = null
where slug = 'hakusan';

update public.mountain_foundation_profiles
set route_seriousness = 'MODERATE',
    technical_terrain = 'MAINTAINED_TRAIL',
    route_duration_band = 'HALF_DAY',
    escape_options = 'MODERATE',
    supplementary_notes = '畳平から剣ヶ峰方面へ登る夏山ルート。',
    restriction_status_note = null
where slug = 'norikura-dake';

update public.mountain_foundation_profiles
set supplementary_notes = '活火山。火山活動や入山規制は公式情報で確認。',
    restriction_status_note = null
where slug = 'tokachi-dake';
