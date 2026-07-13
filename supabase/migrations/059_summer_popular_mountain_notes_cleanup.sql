update public.mountain_foundation_profiles
set supplementary_notes = '標準は小屋泊・テント泊。穂先は岩場・落石に注意。'
where slug = 'yarigatake';

update public.mountain_foundation_profiles
set supplementary_notes = '標準は小屋泊・テント泊。岩稜・落石に注意。'
where slug = 'okuhotakadake';

update public.mountain_foundation_profiles
set mandatory_gear_note = '岩場・鎖場あり。ヘルメット要否を確認。',
    supplementary_notes = '八ヶ岳主峰。山小屋・指定テント場を利用した縦走可。'
where slug = 'aka-dake';

update public.mountain_foundation_profiles
set supplementary_notes = '西日本最高峰。鎖場は迂回路あり。'
where slug = 'ishizuchi-san';

update public.mountain_foundation_profiles
set supplementary_notes = '坊ガツルでテント泊・くじゅう連山縦走可。硫黄山周辺は火山ガスに注意。',
    restriction_status_note = null
where slug = 'kuju-san';
