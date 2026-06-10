alter table public.trip_plans
  add column if not exists checked_slots text[] not null default '{}'::text[]
    check (
      checked_slots <@ array[
        'WATER_STORAGE',
        'WATER_TREATMENT',
        'TENT',
        'SLEEP_INSULATION',
        'SLEEP_PAD',
        'STOVE',
        'FUEL',
        'COOK_POT',
        'TABLEWARE',
        'RAIN_JACKET',
        'RAIN_PANTS',
        'INSULATION_LAYER',
        'BASE_LAYER',
        'GPS_DEVICE',
        'POWER_BANK',
        'FIRST_AID_KIT',
        'HEADLAMP'
      ]::text[]
    );
