update public.mountain_foundation_profiles
set supplementary_notes = '開山期中心の高所登山。テント泊不可（路線上禁止）。防寒・高山病対策を確認。',
    restriction_status_note = null
where slug = 'fuji-san';

update public.mountain_foundation_profiles
set supplementary_notes = '監視名は「弥陀ヶ原」。地獄谷では火山ガスに注意。室堂までアルペンルート利用、雷鳥沢でテント泊可。',
    restriction_status_note = null
where slug = 'tateyama';

update public.mountain_foundation_profiles
set supplementary_notes = '活火山。沼ノ平火口付近では火山ガスに注意。',
    restriction_status_note = null
where slug = 'adatara-yama';
