-- Static Mountain Foundation list classification for mountain picker display.
-- This is display metadata only; it is not used by recommendation engines.

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

update public.mountain_foundation_profiles
set meizan_list = case
  when is_hyakumeizan then 'JAPAN_HYAKUMEIZAN'
  when slug in (
    'kentoku-san',
    'tsubakuro-dake'
  ) then 'JAPAN_NIHYAKUMEIZAN_EXTRA'
  else 'OTHER'
end;
