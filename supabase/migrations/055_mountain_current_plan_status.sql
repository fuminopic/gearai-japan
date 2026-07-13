create table if not exists public.mountain_current_plan_status (
  mountain_slug text primary key
    references public.mountain_foundation_profiles(slug)
    on update cascade
    on delete cascade,
  status text not null
    constraint mountain_current_plan_status_status_check
    check (status in ('REVIEW_REQUIRED', 'BLOCKED')),
  reason_code text not null
    constraint mountain_current_plan_status_reason_code_check
    check (
      reason_code in (
        'VOLCANO_RESTRICTION',
        'TRAIL_CLOSURE',
        'SEASONAL_SNOW',
        'OTHER'
      )
  ),
  message_ja text not null
    constraint mountain_current_plan_status_message_ja_nonempty_check
    check (btrim(message_ja) <> ''),
  source_url text not null
    constraint mountain_current_plan_status_source_url_nonempty_check
    check (btrim(source_url) <> '')
    constraint mountain_current_plan_status_source_url_format_check
    check (source_url ~ '^https?://'),
  verified_at date not null,
  review_after date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mountain_current_plan_status_review_window_check
    check (review_after >= verified_at)
);

alter table public.mountain_current_plan_status enable row level security;

revoke all on table public.mountain_current_plan_status from public, anon, authenticated;
grant select on table public.mountain_current_plan_status to authenticated;
grant select, insert, update, delete on table public.mountain_current_plan_status to service_role;

drop policy if exists "mountain_current_plan_status_select_all"
on public.mountain_current_plan_status;

create policy "mountain_current_plan_status_select_all"
on public.mountain_current_plan_status for select
to authenticated
using (true);

drop trigger if exists set_mountain_current_plan_status_updated_at
on public.mountain_current_plan_status;

create trigger set_mountain_current_plan_status_updated_at
before update on public.mountain_current_plan_status
for each row execute function public.set_updated_at();
