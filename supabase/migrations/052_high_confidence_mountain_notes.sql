update public.mountain_foundation_profiles
set mandatory_gear_note = '山開き前後は山頂直下に雪壁が残る場合があり、12本爪アイゼン・ピッケル等の要否を事前確認してください',
    supplementary_notes = '赤倉沢からの往復長時間ルート。熊ノ平避難小屋は無人の緊急避難用で、トイレなし、水場は沢水で渇水期に涸れる場合があります。渡渉・増水・林道状況を確認し、登山届を提出してください',
    restriction_status_note = '過去の豪雨規制は解除済みですが、林道・登山道の最新情報を自治体等で確認してください'
where slug = 'aizu-asahi-dake';

update public.mountain_foundation_profiles
set mandatory_gear_note = '朝日連峰の小屋は避難小屋で、寝具・食事の提供はありません。シュラフ・マット・調理器具の持参を前提にしてください',
    supplementary_notes = '大朝日小屋周辺の水場は小屋から離れています。トイレットペーパー持参、幕営可否、水場状況、登山口道路情報を管理者・自治体情報で確認してください',
    restriction_status_note = 'アクセス道路は冬季閉鎖区間があります。各登山口の道路・登山道情報は管理市町の最新情報で確認してください'
where slug = 'asahi-dake-tohoku';

update public.mountain_foundation_profiles
set mandatory_gear_note = '飯豊連峰の山小屋は避難小屋で、寝袋・マットの持参が必要です（自治体公式情報）',
    supplementary_notes = '上級者向けの山域です。鎖場・岩場があり、登山者カードの提出、登山道・水場・小屋営業状況を自治体等の最新情報で確認してください',
    restriction_status_note = 'アクセス林道・登山道の通行状況は関係自治体の年度別登山情報で出発前に確認してください'
where slug = 'iide-san';

update public.mountain_foundation_profiles
set mandatory_gear_note = '赤井川登山道6合目登山口で入山届の提出が求められています',
    supplementary_notes = '活火山です。登れるのは赤井川登山道の馬ノ背までです。異常を感じたら直ちに下山し、気象庁・自治体の公式情報を確認してください',
    restriction_status_note = '火口周辺規制により山頂部・火口原は立入規制区域です。馬ノ背までの規制緩和範囲、入山届、最新公式情報確認が必要です'
where slug = 'hokkaido-komagatake';

update public.mountain_foundation_profiles
set mandatory_gear_note = 'トイレは各自携帯トイレの持参が求められています（新庄市公式）',
    supplementary_notes = '避難小屋の備品状況は変わる可能性があります。水場は小屋から下るため、飲料は余裕をもって携行してください。山頂直下のやせ尾根に注意してください'
where slug = 'kamuro-san';

update public.mountain_foundation_profiles
set mandatory_gear_note = 'ヒグマ生息地のため、鈴などで登山者の位置を知らせながら行動してください（増毛町公式）',
    supplementary_notes = '登山ルートは暑寒・箸別・雨竜の3本です。山開き頃は雪渓が残る場合がありますが、現地状況を確認してください。水場は涸れる場合があり、ゴミは必ず持ち帰ってください'
where slug = 'shokanbetsu-dake';

update public.mountain_foundation_profiles
set mandatory_gear_note = '蟻の塔渡り等の岩稜ではヘルメット等の頭部保護を推奨・確認してください',
    supplementary_notes = '蟻の塔渡り・剣の刃渡り等のナイフリッジで滑落事故が発生しています。一不動〜戸隠牧場の下りは沢筋で鎖場・渡渉があるため、増水時の通行可否を確認してください。岩場経験のない方の入山は推奨されません'
where slug = 'togakushi-yama';
