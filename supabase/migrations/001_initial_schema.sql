create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'ja',
  experience_level text not null default 'beginner'
    check (experience_level in ('beginner', 'intermediate', 'advanced', 'expert')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gear_categories (
  id uuid primary key default gen_random_uuid(),
  name_ja text not null,
  name_en text not null unique,
  sort_order integer not null default 0,
  is_default boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_gear (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid not null references public.gear_categories(id),
  name text not null,
  brand text,
  weight_g numeric(10, 1) not null default 0 check (weight_g >= 0),
  price_jpy integer check (price_jpy is null or price_jpy >= 0),
  purchase_date date,
  status text not null default 'owned' check (status in ('owned', 'wishlist')),
  weight_type text not null default 'base' check (weight_type in ('base', 'consumable', 'worn')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mountains (
  id uuid primary key default gen_random_uuid(),
  name_ja text not null,
  region text,
  elevation_m integer,
  difficulty_level text,
  best_season text,
  camping_available boolean,
  hut_available boolean,
  snow_risk text check (snow_risk is null or snow_risk in ('none', 'low', 'medium', 'high', 'seasonal')),
  seasonal_temperature jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pack_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mountain_id uuid references public.mountains(id) on delete set null,
  name text not null,
  mountain_name text,
  month integer check (month is null or (month >= 1 and month <= 12)),
  days integer not null default 1 check (days >= 1),
  is_camping boolean not null default false,
  visibility text not null default 'private' check (visibility in ('private', 'shared')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pack_list_items (
  id uuid primary key default gen_random_uuid(),
  pack_list_id uuid not null references public.pack_lists(id) on delete cascade,
  user_gear_id uuid references public.user_gear(id) on delete set null,
  quantity integer not null default 1 check (quantity >= 1),
  is_required boolean not null default true,
  is_missing boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mountain_id uuid references public.mountains(id) on delete set null,
  input jsonb not null,
  output jsonb not null,
  owned_analysis jsonb,
  missing_analysis jsonb,
  model text not null,
  prompt_tokens integer,
  completion_tokens integer,
  created_at timestamptz not null default now()
);

create index user_gear_user_id_idx on public.user_gear(user_id);
create index user_gear_category_id_idx on public.user_gear(category_id);
create index user_gear_status_idx on public.user_gear(status);
create index user_gear_weight_type_idx on public.user_gear(weight_type);
create index pack_lists_user_id_idx on public.pack_lists(user_id);
create index pack_list_items_pack_list_id_idx on public.pack_list_items(pack_list_id);
create index ai_recommendations_user_id_created_at_idx on public.ai_recommendations(user_id, created_at desc);
create index mountains_name_ja_idx on public.mountains(name_ja);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_user_gear_updated_at
before update on public.user_gear
for each row execute function public.set_updated_at();

create trigger set_mountains_updated_at
before update on public.mountains
for each row execute function public.set_updated_at();

create trigger set_pack_lists_updated_at
before update on public.pack_lists
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

insert into public.gear_categories (name_ja, name_en, sort_order, is_default)
values
  ('背負システム', 'backpacking', 10, true),
  ('睡眠システム', 'sleeping', 20, true),
  ('ウェア', 'clothing', 30, true),
  ('クッキング', 'cooking', 40, true),
  ('セーフティ', 'safety', 50, true),
  ('電子機器', 'electronics', 60, true),
  ('その他', 'other', 70, true)
on conflict (name_en) do nothing;

insert into public.mountains (
  name_ja,
  region,
  elevation_m,
  difficulty_level,
  best_season,
  camping_available,
  hut_available,
  snow_risk,
  seasonal_temperature,
  notes
)
values
  (
    '富士山',
    '山梨県・静岡県',
    3776,
    'intermediate',
    '7月-9月',
    false,
    true,
    'seasonal',
    '{"spring":{"min_c":-10,"max_c":2},"summer":{"min_c":2,"max_c":12},"autumn":{"min_c":-8,"max_c":4},"winter":{"min_c":-25,"max_c":-8}}',
    '夏山シーズンでも防寒と雨対策が必要。'
  ),
  (
    '高尾山',
    '東京都',
    599,
    'beginner',
    '通年',
    false,
    false,
    'low',
    '{"spring":{"min_c":8,"max_c":18},"summer":{"min_c":20,"max_c":30},"autumn":{"min_c":10,"max_c":20},"winter":{"min_c":0,"max_c":10}}',
    '初心者の日帰り登山に適した山。'
  ),
  (
    '立山',
    '富山県',
    3015,
    'intermediate',
    '7月-10月',
    true,
    true,
    'seasonal',
    '{"spring":{"min_c":-12,"max_c":2},"summer":{"min_c":4,"max_c":15},"autumn":{"min_c":-6,"max_c":8},"winter":{"min_c":-20,"max_c":-5}}',
    '残雪期と秋以降は雪・低温リスクに注意。'
  )
on conflict do nothing;

alter table public.profiles enable row level security;
alter table public.gear_categories enable row level security;
alter table public.user_gear enable row level security;
alter table public.mountains enable row level security;
alter table public.pack_lists enable row level security;
alter table public.pack_list_items enable row level security;
alter table public.ai_recommendations enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "gear_categories_select_all"
on public.gear_categories for select
to authenticated
using (true);

create policy "user_gear_select_own"
on public.user_gear for select
to authenticated
using (auth.uid() = user_id);

create policy "user_gear_insert_own"
on public.user_gear for insert
to authenticated
with check (auth.uid() = user_id);

create policy "user_gear_update_own"
on public.user_gear for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "user_gear_delete_own"
on public.user_gear for delete
to authenticated
using (auth.uid() = user_id);

create policy "mountains_select_all"
on public.mountains for select
to authenticated
using (true);

create policy "pack_lists_select_own"
on public.pack_lists for select
to authenticated
using (auth.uid() = user_id);

create policy "pack_lists_insert_own"
on public.pack_lists for insert
to authenticated
with check (auth.uid() = user_id);

create policy "pack_lists_update_own"
on public.pack_lists for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "pack_lists_delete_own"
on public.pack_lists for delete
to authenticated
using (auth.uid() = user_id);

create policy "pack_list_items_select_own"
on public.pack_list_items for select
to authenticated
using (
  exists (
    select 1
    from public.pack_lists
    where pack_lists.id = pack_list_items.pack_list_id
      and pack_lists.user_id = auth.uid()
  )
);

create policy "pack_list_items_insert_own"
on public.pack_list_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.pack_lists
    where pack_lists.id = pack_list_items.pack_list_id
      and pack_lists.user_id = auth.uid()
  )
);

create policy "pack_list_items_update_own"
on public.pack_list_items for update
to authenticated
using (
  exists (
    select 1
    from public.pack_lists
    where pack_lists.id = pack_list_items.pack_list_id
      and pack_lists.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.pack_lists
    where pack_lists.id = pack_list_items.pack_list_id
      and pack_lists.user_id = auth.uid()
  )
);

create policy "pack_list_items_delete_own"
on public.pack_list_items for delete
to authenticated
using (
  exists (
    select 1
    from public.pack_lists
    where pack_lists.id = pack_list_items.pack_list_id
      and pack_lists.user_id = auth.uid()
  )
);

create policy "ai_recommendations_select_own"
on public.ai_recommendations for select
to authenticated
using (auth.uid() = user_id);

create policy "ai_recommendations_insert_own"
on public.ai_recommendations for insert
to authenticated
with check (auth.uid() = user_id);

