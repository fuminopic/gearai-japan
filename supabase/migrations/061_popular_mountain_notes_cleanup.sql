update public.mountain_foundation_profiles
set mandatory_gear_note = '鎖場・カニのタテバイ/ヨコバイではヘルメットを着用。'
where slug = 'tsurugi-dake';

update public.mountain_foundation_profiles
set supplementary_notes = '活火山。火山活動や入山規制は公式情報で確認。',
    restriction_status_note = null
where slug = 'nikko-shirane-san';

update public.mountain_foundation_profiles
set supplementary_notes = '北八ヶ岳北端。山頂部は岩場。'
where slug = 'tateshina-yama';

update public.mountain_foundation_profiles
set supplementary_notes = '活火山。火山活動や入山規制は公式情報で確認。',
    restriction_status_note = null
where slug = 'yotei-zan';

update public.mountain_foundation_profiles
set supplementary_notes = '屋久島の多雨環境。雨具を携行し、長時間行動に備える。'
where slug = 'miyanoura-dake';
