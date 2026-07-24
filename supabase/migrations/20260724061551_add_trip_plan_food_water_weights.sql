-- 水・食料はユーザーの通常ギアではなく、山行計画ごとの消費物として保存する。
-- 既存の計画はすべて 0 / false で読み出せるため、チェックリストや装備の状態は変えない。
alter table public.trip_plans
  add column if not exists water_volume_ml integer not null default 0,
  add column if not exists trail_food_included boolean not null default false,
  add column if not exists trail_food_weight_g integer not null default 0,
  add column if not exists meal_count integer not null default 0,
  add column if not exists meal_weight_g integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_plans_water_volume_ml_range'
      and conrelid = 'public.trip_plans'::regclass
  ) then
    alter table public.trip_plans
      add constraint trip_plans_water_volume_ml_range
      check (water_volume_ml >= 0 and water_volume_ml <= 30000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_plans_trail_food_weight_g_range'
      and conrelid = 'public.trip_plans'::regclass
  ) then
    alter table public.trip_plans
      add constraint trip_plans_trail_food_weight_g_range
      check (trail_food_weight_g >= 0 and trail_food_weight_g <= 30000);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_plans_meal_count_range'
      and conrelid = 'public.trip_plans'::regclass
  ) then
    alter table public.trip_plans
      add constraint trip_plans_meal_count_range
      check (meal_count >= 0 and meal_count <= 99);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'trip_plans_meal_weight_g_range'
      and conrelid = 'public.trip_plans'::regclass
  ) then
    alter table public.trip_plans
      add constraint trip_plans_meal_weight_g_range
      check (meal_weight_g >= 0 and meal_weight_g <= 30000);
  end if;
end $$;
