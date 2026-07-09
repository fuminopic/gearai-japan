update public.mountain_foundation_profiles
set region = 'TOHOKU',
    primary_region = 'TOHOKU',
    updated_at = now()
where slug in ('asahi-dake-tohoku', 'iide-san');
