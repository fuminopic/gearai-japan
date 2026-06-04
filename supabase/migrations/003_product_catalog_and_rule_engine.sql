create table if not exists public.gear_subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.gear_categories(id) on delete cascade,
  name_ja text not null,
  name_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (category_id, name_en)
);

create table if not exists public.gear_products (
  id uuid primary key default gen_random_uuid(),
  brand text not null,
  model text not null,
  name_ja text,
  category_id uuid not null references public.gear_categories(id),
  subcategory_id uuid references public.gear_subcategories(id),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  msrp_jpy integer check (msrp_jpy is null or msrp_jpy >= 0),
  size text,
  volume text,
  capacity text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand, model)
);

create table if not exists public.gear_product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.gear_products(id) on delete cascade,
  alias text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.recommendation_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  mountain_region text,
  season text,
  weather_risk text,
  accommodation_style text,
  category text not null,
  subcategory text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  weight_type text not null check (weight_type in ('base', 'consumable', 'worn')),
  estimated_weight_grams integer not null default 0,
  estimated_price_jpy integer not null default 0,
  reason_ja text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mountain_knowledge (
  id uuid primary key default gen_random_uuid(),
  region text not null unique,
  aliases text[] not null default '{}',
  elevation_band text not null check (elevation_band in ('low', 'mid', 'high')),
  hut_available boolean not null default false,
  camping_available boolean not null default false,
  default_weather_risks text[] not null default '{}',
  notes_ja text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.gear_categories (name_ja, name_en, sort_order, is_default)
values
  ('Sleep', 'sleep', 10, true),
  ('Shelter', 'shelter', 20, true),
  ('Carry', 'carry', 30, true),
  ('Clothing', 'clothing', 40, true),
  ('Cooking', 'cooking', 50, true),
  ('Electronics', 'electronics', 60, true),
  ('Navigation', 'navigation', 70, true),
  ('Safety', 'safety', 80, true),
  ('Hydration', 'hydration', 90, true),
  ('Other', 'other', 100, true)
on conflict (name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order,
    is_default = excluded.is_default;

update public.gear_categories
set name_en = 'carry', name_ja = 'Carry', sort_order = 30
where name_en = 'backpacking'
  and not exists (select 1 from public.gear_categories where name_en = 'carry');

update public.gear_categories
set name_en = 'sleep', name_ja = 'Sleep', sort_order = 10
where name_en = 'sleeping'
  and not exists (select 1 from public.gear_categories where name_en = 'sleep');

insert into public.gear_subcategories (category_id, name_ja, name_en, sort_order)
select c.id, v.name_ja, v.name_en, v.sort_order
from public.gear_categories c
join (
  values
    ('sleep', 'Sleeping Bag', 'sleeping_bag', 10),
    ('sleep', 'Sleeping Pad', 'sleeping_pad', 20),
    ('sleep', 'Pillow', 'pillow', 30),
    ('shelter', 'Tent', 'tent', 10),
    ('shelter', 'Tarp', 'tarp', 20),
    ('shelter', 'Groundsheet', 'groundsheet', 30),
    ('carry', 'Backpack', 'backpack', 10),
    ('clothing', 'Rainwear', 'rainwear', 10),
    ('clothing', 'Down Jacket', 'down_jacket', 20),
    ('clothing', 'Insulation', 'insulation', 30),
    ('clothing', 'Base Layer', 'base_layer', 40),
    ('cooking', 'Stove', 'stove', 10),
    ('cooking', 'Gas Canister', 'gas_canister', 20),
    ('cooking', 'Cookware', 'cookware', 30),
    ('electronics', 'Headlamp', 'headlamp', 10),
    ('electronics', 'Battery', 'battery', 20),
    ('electronics', 'Power Bank', 'power_bank', 30),
    ('navigation', 'Map', 'map', 10),
    ('navigation', 'Compass', 'compass', 20),
    ('navigation', 'GPS', 'gps', 30),
    ('safety', 'First Aid Kit', 'first_aid_kit', 10),
    ('safety', 'Bear Bell', 'bear_bell', 20),
    ('hydration', 'Bladder', 'bladder', 10),
    ('hydration', 'Bottle', 'bottle', 20),
    ('hydration', 'Filter', 'filter', 30)
) as v(category_en, name_ja, name_en, sort_order)
on c.name_en = v.category_en
on conflict (category_id, name_en) do update
set name_ja = excluded.name_ja,
    sort_order = excluded.sort_order;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'weight_g'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'weight_grams'
  ) then
    alter table public.user_gear rename column weight_g to weight_grams;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'price_jpy'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'purchase_price_jpy'
  ) then
    alter table public.user_gear rename column price_jpy to purchase_price_jpy;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'notes'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'user_gear' and column_name = 'memo'
  ) then
    alter table public.user_gear rename column notes to memo;
  end if;
end $$;

alter table public.user_gear
  add column if not exists product_id uuid references public.gear_products(id) on delete set null,
  add column if not exists subcategory_id uuid references public.gear_subcategories(id) on delete set null,
  add column if not exists model text,
  add column if not exists msrp_jpy integer check (msrp_jpy is null or msrp_jpy >= 0),
  add column if not exists size text,
  add column if not exists volume text,
  add column if not exists capacity text;

alter table public.user_gear
  alter column weight_grams type integer using round(weight_grams)::integer,
  alter column weight_grams set default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'user_gear_weight_grams_check'
      and conrelid = 'public.user_gear'::regclass
  ) then
    alter table public.user_gear
      add constraint user_gear_weight_grams_check check (weight_grams >= 0) not valid;
  end if;
end $$;

alter table public.user_gear validate constraint user_gear_weight_grams_check;

create index if not exists user_gear_product_id_idx on public.user_gear(product_id);
create index if not exists user_gear_subcategory_id_idx on public.user_gear(subcategory_id);
create index if not exists gear_products_category_id_idx on public.gear_products(category_id);
create index if not exists gear_products_subcategory_id_idx on public.gear_products(subcategory_id);
create index if not exists gear_product_aliases_product_id_idx on public.gear_product_aliases(product_id);
create index if not exists recommendation_rules_trip_idx
on public.recommendation_rules(mountain_region, season, weather_risk, accommodation_style);

create or replace trigger set_gear_products_updated_at
before update on public.gear_products
for each row execute function public.set_updated_at();

create or replace trigger set_mountain_knowledge_updated_at
before update on public.mountain_knowledge
for each row execute function public.set_updated_at();

insert into public.mountain_knowledge (
  region,
  aliases,
  elevation_band,
  hut_available,
  camping_available,
  default_weather_risks,
  notes_ja
)
values
  ('富士山', array['fuji', 'mt fuji', '富士'], 'high', true, false, array['cold', 'wind', 'rain'], '夏でも山頂付近は低温・強風になりやすい。'),
  ('北アルプス', array['north alps', 'kita alps'], 'high', true, true, array['cold', 'wind', 'rain'], '稜線の風雨と低温、行動時間の長さを前提にする。'),
  ('南アルプス', array['south alps', 'minami alps'], 'high', true, true, array['cold', 'rain'], '長いアプローチと水場間隔を意識する。'),
  ('八ヶ岳', array['yatsugatake'], 'high', true, true, array['cold', 'wind'], '岩稜帯と季節による低温差に注意する。'),
  ('谷川岳', array['tanigawa'], 'mid', true, false, array['rain', 'wind'], '天候変化が速く、雨具と保温の余裕が重要。')
on conflict (region) do update
set aliases = excluded.aliases,
    elevation_band = excluded.elevation_band,
    hut_available = excluded.hut_available,
    camping_available = excluded.camping_available,
    default_weather_risks = excluded.default_weather_risks,
    notes_ja = excluded.notes_ja;

insert into public.mountains (
  name_ja,
  region,
  elevation_m,
  difficulty_level,
  best_season,
  camping_available,
  hut_available,
  snow_risk,
  notes
)
values
  ('北アルプス', '長野県・富山県・岐阜県', null, 'advanced', '7月-10月', true, true, 'seasonal', '稜線の風雨と低温、行動時間の長さを前提にする。'),
  ('南アルプス', '山梨県・長野県・静岡県', null, 'advanced', '7月-10月', true, true, 'seasonal', '長いアプローチと水場間隔を意識する。'),
  ('八ヶ岳', '長野県・山梨県', null, 'intermediate', '6月-10月', true, true, 'seasonal', '岩稜帯と季節による低温差に注意する。'),
  ('谷川岳', '群馬県・新潟県', 1977, 'intermediate', '6月-10月', false, true, 'seasonal', '天候変化が速く、雨具と保温の余裕が重要。')
on conflict do nothing;

insert into public.gear_products (
  brand,
  model,
  name_ja,
  category_id,
  subcategory_id,
  weight_grams,
  msrp_jpy,
  size,
  volume,
  capacity
)
select v.brand, v.model, v.name_ja, c.id, s.id, v.weight_grams, v.msrp_jpy, v.size, v.volume, v.capacity
from (
  values
    ('mont-bell', 'Storm Cruiser Jacket', 'ストームクルーザー ジャケット', 'clothing', 'rainwear', 254, 27500, null, null, null),
    ('mont-bell', 'Alpine Down Parka', 'アルパイン ダウンパーカ', 'clothing', 'down_jacket', 414, 31900, null, null, null),
    ('YAMAP', 'Basic First Aid Kit', 'ベーシック ファーストエイドキット', 'safety', 'first_aid_kit', 180, 4500, null, null, null),
    ('Black Diamond', 'Spot 400', 'スポット 400', 'electronics', 'headlamp', 78, 7920, null, null, null),
    ('Nalgene', 'Wide Mouth 1.0L', '広口 1.0L ボトル', 'hydration', 'bottle', 180, 2750, null, '1L', null),
    ('Garmin', 'eTrex SE', 'eTrex SE', 'navigation', 'gps', 156, 32800, null, null, null),
    ('EVERNEW', 'Ti 570FD Cup', 'Ti 570FD Cup', 'cooking', 'cookware', 55, 3850, null, '570ml', null),
    ('SOTO', 'WindMaster', 'ウインドマスター', 'cooking', 'stove', 87, 9955, null, null, null),
    ('NEMO', 'Tensor Trail Regular', 'Tensor Trail Regular', 'sleep', 'sleeping_pad', 369, 24200, 'Regular', null, null),
    ('mont-bell', 'Down Hugger 800 #3', 'ダウンハガー 800 #3', 'sleep', 'sleeping_bag', 555, 42900, null, null, null),
    ('Durston', 'X-Mid 1 Solid', 'X-Mid 1 Solid', 'shelter', 'tent', 825, 53900, null, null, '1人用'),
    ('finetrack', 'Mountain Shot 2', 'Mountain Shot 2', 'shelter', 'tent', 1650, 69300, null, null, '2人用'),
    ('山と道', 'MINI2', 'MINI2', 'carry', 'backpack', 398, 33000, 'M', '25-35L', null),
    ('Hyperlite Mountain Gear', 'Southwest 55', 'Southwest 55', 'carry', 'backpack', 899, 63800, 'M', '55L', null)
) as v(brand, model, name_ja, category_en, subcategory_en, weight_grams, msrp_jpy, size, volume, capacity)
join public.gear_categories c on c.name_en = v.category_en
join public.gear_subcategories s on s.category_id = c.id and s.name_en = v.subcategory_en
on conflict (brand, model) do update
set name_ja = excluded.name_ja,
    category_id = excluded.category_id,
    subcategory_id = excluded.subcategory_id,
    weight_grams = excluded.weight_grams,
    msrp_jpy = excluded.msrp_jpy,
    size = excluded.size,
    volume = excluded.volume,
    capacity = excluded.capacity;

insert into public.gear_product_aliases (product_id, alias)
select p.id, v.alias
from (
  values
    ('mont-bell', 'Storm Cruiser Jacket', 'ストクル'),
    ('mont-bell', 'Storm Cruiser Jacket', 'storm cruiser'),
    ('mont-bell', 'Alpine Down Parka', 'アルパインダウン'),
    ('Black Diamond', 'Spot 400', 'スポット'),
    ('Nalgene', 'Wide Mouth 1.0L', 'ナルゲン'),
    ('SOTO', 'WindMaster', 'ウィンドマスター'),
    ('mont-bell', 'Down Hugger 800 #3', 'ダウンハガー'),
    ('finetrack', 'Mountain Shot 2', 'Mountain Shot 2'),
    ('finetrack', 'Mountain Shot 2', 'マウンテンショット2'),
    ('山と道', 'MINI2', '山と道 MINI2'),
    ('山と道', 'MINI2', 'Yamatomichi MINI2'),
    ('Hyperlite Mountain Gear', 'Southwest 55', 'HMG Southwest')
) as v(brand, model, alias)
join public.gear_products p on p.brand = v.brand and p.model = v.model
on conflict (alias) do nothing;

insert into public.recommendation_rules (
  rule_key,
  mountain_region,
  season,
  weather_risk,
  accommodation_style,
  category,
  subcategory,
  priority,
  weight_type,
  estimated_weight_grams,
  estimated_price_jpy,
  reason_ja
)
values
  ('core-backpack', null, null, null, null, 'carry', 'backpack', 'high', 'base', 900, 22000, '装備量と行動時間に合わせた容量が必要です。'),
  ('core-rainwear', null, null, null, null, 'clothing', 'rainwear', 'high', 'base', 280, 24000, '雨と風による体温低下を防ぐ最優先装備です。'),
  ('core-headlamp', null, null, null, null, 'electronics', 'headlamp', 'high', 'base', 90, 6000, '行動遅延や早朝出発に備える必須装備です。'),
  ('core-map', null, null, null, null, 'navigation', 'map', 'high', 'base', 40, 1200, '電池切れに依存しない現在地確認手段です。'),
  ('tent-shelter', null, null, null, 'tent', 'shelter', 'tent', 'high', 'base', 1500, 65000, 'テント泊では風雨を避ける寝床として必須です。'),
  ('tent-sleeping-bag', null, null, null, 'tent', 'sleep', 'sleeping_bag', 'high', 'base', 760, 45000, '夜間の想定最低気温に合わせた保温が必要です。'),
  ('tent-stove', null, null, null, 'tent', 'cooking', 'stove', 'medium', 'base', 90, 9000, 'テント泊の食事と温かい飲み物に使います。')
on conflict (rule_key) do update
set mountain_region = excluded.mountain_region,
    season = excluded.season,
    weather_risk = excluded.weather_risk,
    accommodation_style = excluded.accommodation_style,
    category = excluded.category,
    subcategory = excluded.subcategory,
    priority = excluded.priority,
    weight_type = excluded.weight_type,
    estimated_weight_grams = excluded.estimated_weight_grams,
    estimated_price_jpy = excluded.estimated_price_jpy,
    reason_ja = excluded.reason_ja;

alter table public.gear_subcategories enable row level security;
alter table public.gear_products enable row level security;
alter table public.gear_product_aliases enable row level security;
alter table public.recommendation_rules enable row level security;
alter table public.mountain_knowledge enable row level security;

drop policy if exists "gear_subcategories_select_all" on public.gear_subcategories;
create policy "gear_subcategories_select_all"
on public.gear_subcategories for select
to authenticated
using (true);

drop policy if exists "gear_products_select_all" on public.gear_products;
create policy "gear_products_select_all"
on public.gear_products for select
to authenticated
using (true);

drop policy if exists "gear_product_aliases_select_all" on public.gear_product_aliases;
create policy "gear_product_aliases_select_all"
on public.gear_product_aliases for select
to authenticated
using (true);

drop policy if exists "recommendation_rules_select_all" on public.recommendation_rules;
create policy "recommendation_rules_select_all"
on public.recommendation_rules for select
to authenticated
using (true);

drop policy if exists "mountain_knowledge_select_all" on public.mountain_knowledge;
create policy "mountain_knowledge_select_all"
on public.mountain_knowledge for select
to authenticated
using (true);
