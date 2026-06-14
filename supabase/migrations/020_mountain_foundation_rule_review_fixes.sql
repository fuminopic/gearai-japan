-- Static Mountain Foundation corrections from recommendation rule review.
-- No schema, engine, or recommendation workflow changes.

update public.mountain_foundation_profiles
set volcanic_risk = 'ACTIVE_RESTRICTED',
    restriction_status_note = '噴火警戒レベル2（火口周辺規制）',
    supplementary_notes = '2026/06時点 噴火警戒レベル2（火口周辺規制）。阿寒湖畔コースは6合目より上、雌阿寒温泉コース・オンネトーコースは7合目より上が立入禁止。北海道のため春は積雪期＝季節データ要見直し'
where slug = 'meakan-dake';

update public.mountain_foundation_profiles
set mandatory_gear_note = '額平川の渡渉装備（沢靴/替え靴）・携帯トイレ必携',
    supplementary_notes = '渡渉が核心。増水時は中止判断が必要。北海道・非火山。ヒグマ対策も'
where slug = 'poroshiri-dake';
