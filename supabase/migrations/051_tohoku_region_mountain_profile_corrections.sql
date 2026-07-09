update public.mountain_foundation_profiles
set region = 'TOHOKU',
    primary_region = 'TOHOKU'
where slug in ('asahi-dake-tohoku', 'iide-san');
