-- Complete static list classification for Japanese hyakumeizan and nihyakumeizan display.
-- This does not change recommendation logic or pack generation.

alter table public.mountain_foundation_profiles
  add column if not exists meizan_list text not null default 'OTHER';

alter table public.mountain_foundation_profiles
  drop constraint if exists mountain_foundation_profiles_meizan_list_check;

alter table public.mountain_foundation_profiles
  add constraint mountain_foundation_profiles_meizan_list_check
  check (
    meizan_list in (
      'JAPAN_HYAKUMEIZAN',
      'JAPAN_NIHYAKUMEIZAN_EXTRA',
      'OTHER'
    )
  );

with nihyakumeizan_extra_names(name_ja) as (
  values
    ('天塩岳'),
    ('石狩岳'),
    ('ニペソツ山'),
    ('カムイエクウチカウシ山'),
    ('ペテガリ岳'),
    ('芦別岳'),
    ('夕張岳'),
    ('暑寒別岳'),
    ('樽前山'),
    ('北海道駒ヶ岳'),
    ('白神岳'),
    ('姫神山'),
    ('秋田駒ヶ岳'),
    ('和賀岳'),
    ('焼石岳'),
    ('栗駒山'),
    ('神室山'),
    ('森吉山'),
    ('以東岳'),
    ('船形山'),
    ('杁差岳'),
    ('二王子岳'),
    ('御神楽岳'),
    ('守門岳'),
    ('中ノ岳'),
    ('八海山'),
    ('荒沢岳'),
    ('佐武流山'),
    ('鳥甲山'),
    ('帝釈山'),
    ('会津朝日岳'),
    ('女峰山'),
    ('仙ノ倉山'),
    ('白砂山'),
    ('岩菅山'),
    ('浅間隠山'),
    ('榛名山'),
    ('妙義山'),
    ('荒船山'),
    ('御座山'),
    ('武甲山'),
    ('和名倉山'),
    ('茅ヶ岳'),
    ('乾徳山'),
    ('大岳山'),
    ('三ツ峠山'),
    ('御正体山'),
    ('毛無山'),
    ('愛鷹山'),
    ('天狗岳'),
    ('黒姫山'),
    ('戸隠山'),
    ('飯縄山'),
    ('雪倉岳'),
    ('針ノ木岳'),
    ('烏帽子岳'),
    ('赤牛岳'),
    ('毛勝山'),
    ('奥大日岳'),
    ('有明山'),
    ('餓鬼岳'),
    ('燕岳'),
    ('大天井岳'),
    ('霞沢岳'),
    ('鋸岳'),
    ('農鳥岳'),
    ('上河内岳'),
    ('池口岳'),
    ('大無間山'),
    ('櫛形山'),
    ('笊ヶ岳'),
    ('七面山'),
    ('小秀山'),
    ('経ヶ岳'),
    ('南駒ヶ岳'),
    ('安平路山'),
    ('金剛堂山'),
    ('笈ヶ岳'),
    ('大日ヶ岳'),
    ('位山'),
    ('能郷白山'),
    ('御在所岳'),
    ('釈迦ヶ岳'),
    ('伯母子岳'),
    ('金剛山'),
    ('武奈ヶ岳'),
    ('氷ノ山'),
    ('上蒜山'),
    ('三瓶山'),
    ('三嶺'),
    ('東赤石山'),
    ('笹ヶ峰'),
    ('英彦山'),
    ('雲仙岳'),
    ('由布岳'),
    ('大崩山'),
    ('市房山'),
    ('尾鈴山'),
    ('高千穂峰'),
    ('桜島')
),
nihyakumeizan_extra_aliases(name_ja) as (
  values
    ('駒ヶ岳'),
    ('白石山'),
    ('御在所山'),
    ('武奈岳'),
    ('笹峰'),
    ('桜島岳'),
    ('釈迦岳'),
    ('荒澤岳')
)
update public.mountain_foundation_profiles as profile
set meizan_list = case
  when profile.is_hyakumeizan then 'JAPAN_HYAKUMEIZAN'
  when profile.slug in (
    'kentoku-san',
    'tsubakuro-dake'
  ) then 'JAPAN_NIHYAKUMEIZAN_EXTRA'
  when exists (
    select 1
    from nihyakumeizan_extra_names as source
    where source.name_ja = profile.name_ja
  ) then 'JAPAN_NIHYAKUMEIZAN_EXTRA'
  when exists (
    select 1
    from nihyakumeizan_extra_aliases as source
    where source.name_ja = profile.name_ja
  ) then 'JAPAN_NIHYAKUMEIZAN_EXTRA'
  else 'OTHER'
end;
