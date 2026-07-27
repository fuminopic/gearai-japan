-- Canonical, queryable profile details. `public.profiles.id` is already a
-- one-to-one foreign key to auth.users(id) and is deleted by that cascade.
alter table public.profiles
  add column if not exists gender text,
  add column if not exists age_range text,
  add column if not exists mountaineering_experience text,
  add column if not exists mountaineering_genres text[] not null default '{}'::text[],
  add column if not exists usual_trip_styles text[] not null default '{}'::text[],
  add column if not exists favorite_regions text[] not null default '{}'::text[],
  add column if not exists avatar_storage_path text;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ) then
    create policy "profiles_select_own"
    on public.profiles for select
    to authenticated
    using ((select auth.uid()) = id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ) then
    create policy "profiles_update_own"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_gender_allowed'
  ) then
    alter table public.profiles
    add constraint profiles_gender_allowed
    check (gender is null or gender in ('male', 'female', 'other', 'prefer_not_to_say'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_age_range_allowed'
  ) then
    alter table public.profiles
    add constraint profiles_age_range_allowed
    check (
      age_range is null
      or age_range in (
        'teens', 'twenties', 'thirties', 'forties', 'fifties', 'sixties',
        'seventies_plus', 'prefer_not_to_say'
      )
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_mountaineering_experience_allowed'
  ) then
    alter table public.profiles
    add constraint profiles_mountaineering_experience_allowed
    check (
      mountaineering_experience is null
      or mountaineering_experience in (
        'no_experience', 'under_1_year', 'one_to_three_years',
        'four_to_nine_years', 'ten_years_or_more'
      )
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_mountaineering_genres_allowed'
  ) then
    alter table public.profiles
    add constraint profiles_mountaineering_genres_allowed
    check (
      coalesce(mountaineering_genres, '{}'::text[]) <@ array[
        'hiking', 'snow_free_mountain', 'winter_mountain', 'trail_running',
        'canyoning', 'climbing', 'other'
      ]::text[]
      and cardinality(coalesce(mountaineering_genres, '{}'::text[])) <= 3
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_usual_trip_styles_allowed'
  ) then
    alter table public.profiles
    add constraint profiles_usual_trip_styles_allowed
    check (
      coalesce(usual_trip_styles, '{}'::text[]) <@ array[
        'day_hike', 'mountain_hut', 'tent_stay'
      ]::text[]
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_favorite_regions_allowed'
  ) then
    alter table public.profiles
    add constraint profiles_favorite_regions_allowed
    check (
      coalesce(favorite_regions, '{}'::text[]) <@ array[
        'hokkaido', 'tohoku', 'kanto', 'koshinetsu', 'hokuriku', 'tokai',
        'kinki', 'chugoku', 'shikoku', 'kyushu_okinawa', 'no_preference'
      ]::text[]
      and cardinality(coalesce(favorite_regions, '{}'::text[])) <= 3
      and (
        not ('no_preference' = any(coalesce(favorite_regions, '{}'::text[])))
        or cardinality(coalesce(favorite_regions, '{}'::text[])) = 1
      )
    );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and conname = 'profiles_avatar_storage_path_owned'
  ) then
    alter table public.profiles
    add constraint profiles_avatar_storage_path_owned
    check (
      avatar_storage_path is null
      or (
        split_part(avatar_storage_path, '/', 1) = id::text
        and avatar_storage_path ~* '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'
      )
    );
  end if;
end $$;
