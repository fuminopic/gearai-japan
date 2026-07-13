update public.mountain_foundation_profiles
set mandatory_gear_note = 'ヒグマ対策と食料管理を徹底。',
    supplementary_notes = '知床国立公園。活火山。ヒグマ対策と公式情報を確認。',
    restriction_status_note = null
where slug = 'rausu-dake';

update public.mountain_foundation_profiles
set supplementary_notes = '旭岳ロープウェイ利用の夏山ルート。活火山・火山ガス・天候急変に注意。',
    restriction_status_note = null
where slug = 'daisetsuzan-asahi-dake';

update public.mountain_foundation_profiles
set mandatory_gear_note = '気象急変・撤退判断を確認。',
    supplementary_notes = 'ロープウェイ利用の天神尾根ルートあり。西黒尾根は岩場あり。'
where slug = 'tanigawa-dake';

update public.mountain_foundation_profiles
set supplementary_notes = '豪雪地帯。春は残雪・山スキー利用が多く、夏も残雪状況と登山道情報を確認。'
where slug = 'gassan';
