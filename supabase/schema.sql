-- PrimeForm schema for Supabase/Postgres
-- Lean, RLS-ready, and designed for daily self-tracking across face, physic, and brain.

create extension if not exists pgcrypto;

do $$
begin
  create type public.pillar as enum ('face', 'physic', 'brain');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.plan_type as enum ('skincare', 'workout', 'study', 'wellness', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.theme_preference as enum ('system', 'dark', 'light');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.unit_preference as enum ('metric', 'imperial');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  bio text,
  timezone text not null default 'UTC',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) <= 80)
);

create table if not exists public.profile_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme public.theme_preference not null default 'system',
  units public.unit_preference not null default 'metric',
  analysis_model text not null default 'openai/gpt-oss-20b',
  face_photo_reminder_enabled boolean not null default true,
  brain_screen_time_required boolean not null default true,
  daily_cutoff_time time not null default '21:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pillar public.pillar not null,
  plan_type public.plan_type not null default 'other',
  title text not null,
  description text,
  target jsonb not null default '{}'::jsonb,
  schedule jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint custom_plans_title_length check (char_length(title) <= 120),
  constraint custom_plans_dates_check check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists custom_plans_user_id_idx on public.custom_plans (user_id);
create index if not exists custom_plans_user_active_idx on public.custom_plans (user_id, is_active);
create index if not exists custom_plans_user_pillar_idx on public.custom_plans (user_id, pillar);

create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  face_score numeric(5,2),
  physic_score numeric(5,2),
  brain_score numeric(5,2),
  prime_score numeric(5,2),
  face_payload jsonb not null default '{}'::jsonb,
  physic_payload jsonb not null default '{}'::jsonb,
  brain_payload jsonb not null default '{}'::jsonb,
  ai_summary jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_logs_unique_day unique (user_id, log_date),
  constraint daily_logs_scores_range check (
    (face_score is null or (face_score >= 0 and face_score <= 100)) and
    (physic_score is null or (physic_score >= 0 and physic_score <= 100)) and
    (brain_score is null or (brain_score >= 0 and brain_score <= 100)) and
    (prime_score is null or (prime_score >= 0 and prime_score <= 100))
  )
);

create index if not exists daily_logs_user_date_idx on public.daily_logs (user_id, log_date desc);
create index if not exists daily_logs_user_created_idx on public.daily_logs (user_id, created_at desc);

create table if not exists public.face_progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  storage_path text not null,
  public_url text,
  caption text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint face_progress_photos_unique_day unique (user_id, log_date, storage_path)
);

create index if not exists face_progress_photos_user_date_idx on public.face_progress_photos (user_id, log_date desc);
create index if not exists face_progress_photos_user_created_idx on public.face_progress_photos (user_id, created_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'timezone', 'UTC')
  )
  on conflict (user_id) do nothing;

  insert into public.profile_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists set_profile_settings_updated_at on public.profile_settings;
create trigger set_profile_settings_updated_at
before update on public.profile_settings
for each row execute procedure public.set_updated_at();

drop trigger if exists set_custom_plans_updated_at on public.custom_plans;
create trigger set_custom_plans_updated_at
before update on public.custom_plans
for each row execute procedure public.set_updated_at();

drop trigger if exists set_daily_logs_updated_at on public.daily_logs;
create trigger set_daily_logs_updated_at
before update on public.daily_logs
for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_settings enable row level security;
alter table public.custom_plans enable row level security;
alter table public.daily_logs enable row level security;
alter table public.face_progress_photos enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = user_id);

drop policy if exists "profile_settings_select_own" on public.profile_settings;
create policy "profile_settings_select_own"
on public.profile_settings
for select
using (auth.uid() = user_id);

drop policy if exists "profile_settings_insert_own" on public.profile_settings;
create policy "profile_settings_insert_own"
on public.profile_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "profile_settings_update_own" on public.profile_settings;
create policy "profile_settings_update_own"
on public.profile_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "profile_settings_delete_own" on public.profile_settings;
create policy "profile_settings_delete_own"
on public.profile_settings
for delete
using (auth.uid() = user_id);

drop policy if exists "custom_plans_select_own" on public.custom_plans;
create policy "custom_plans_select_own"
on public.custom_plans
for select
using (auth.uid() = user_id);

drop policy if exists "custom_plans_insert_own" on public.custom_plans;
create policy "custom_plans_insert_own"
on public.custom_plans
for insert
with check (auth.uid() = user_id);

drop policy if exists "custom_plans_update_own" on public.custom_plans;
create policy "custom_plans_update_own"
on public.custom_plans
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "custom_plans_delete_own" on public.custom_plans;
create policy "custom_plans_delete_own"
on public.custom_plans
for delete
using (auth.uid() = user_id);

drop policy if exists "daily_logs_select_own" on public.daily_logs;
create policy "daily_logs_select_own"
on public.daily_logs
for select
using (auth.uid() = user_id);

drop policy if exists "daily_logs_insert_own" on public.daily_logs;
create policy "daily_logs_insert_own"
on public.daily_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "daily_logs_update_own" on public.daily_logs;
create policy "daily_logs_update_own"
on public.daily_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "daily_logs_delete_own" on public.daily_logs;
create policy "daily_logs_delete_own"
on public.daily_logs
for delete
using (auth.uid() = user_id);

drop policy if exists "face_progress_photos_select_own" on public.face_progress_photos;
create policy "face_progress_photos_select_own"
on public.face_progress_photos
for select
using (auth.uid() = user_id);

drop policy if exists "face_progress_photos_insert_own" on public.face_progress_photos;
create policy "face_progress_photos_insert_own"
on public.face_progress_photos
for insert
with check (auth.uid() = user_id);

drop policy if exists "face_progress_photos_update_own" on public.face_progress_photos;
create policy "face_progress_photos_update_own"
on public.face_progress_photos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "face_progress_photos_delete_own" on public.face_progress_photos;
create policy "face_progress_photos_delete_own"
on public.face_progress_photos
for delete
using (auth.uid() = user_id);
