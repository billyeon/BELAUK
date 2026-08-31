-- BELAUK MVP-A · 0002 · core support tables + value-check / AI recognition

-- Areas (Yangon-first) ---------------------------------------------------
create table public.areas (
  id          uuid primary key default gen_random_uuid(),
  country     text not null default 'MM',
  city        text not null,
  township    text not null,
  name_my     text not null,
  name_en     text not null,
  name_zh     text not null,
  name_ko     text not null,
  lat         double precision,
  lng         double precision,
  sort        int not null default 0,
  created_at  timestamptz not null default now(),
  unique (country, city, township)
);

-- Categories (2 levels) ------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.categories(id) on delete set null,
  slug        text not null unique,
  name_my     text not null,
  name_en     text not null,
  name_zh     text not null,
  name_ko     text not null,
  icon        text,
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

-- Profiles (extends auth.users) --------------------------------------
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  phone            text unique,
  display_name     text,
  locale           text not null default 'my',
  primary_area_id  uuid references public.areas(id) on delete set null,
  trust_level      public.trust_level not null default 'new',
  onboarded_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Value checks (may start anonymous) --------------------------------
create table public.value_checks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  anon_token  text,
  status      public.value_check_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint value_checks_owner_present check (user_id is not null or anon_token is not null)
);
create index value_checks_user_idx on public.value_checks(user_id);
create index value_checks_anon_idx on public.value_checks(anon_token);

-- Media attached to a value check ----------------------------------
create table public.media (
  id             uuid primary key default gen_random_uuid(),
  value_check_id uuid not null references public.value_checks(id) on delete cascade,
  storage_path   text not null,
  kind           public.media_kind not null default 'photo',
  width          int,
  height         int,
  bytes          bigint,
  ai_ordinal     int not null default 0,
  created_at     timestamptz not null default now()
);
create index media_value_check_idx on public.media(value_check_id);

-- AI recognition results (APPEND-ONLY: re-run => new row) ----------
create table public.ai_recognitions (
  id                   uuid primary key default gen_random_uuid(),
  value_check_id       uuid not null references public.value_checks(id) on delete cascade,
  model                text not null,
  model_version        text,
  prompt_version       text not null,
  raw_response         jsonb not null,
  detected_category_id uuid references public.categories(id) on delete set null,
  detected_brand       text,
  detected_model       text,
  detected_condition   public.product_condition,
  detected_attributes  jsonb not null default '{}'::jsonb,
  missing_shots        jsonb not null default '[]'::jsonb,
  confidence           numeric(4,3),
  created_at           timestamptz not null default now()
);
create index ai_recognitions_value_check_idx on public.ai_recognitions(value_check_id);

-- User edits to AI values (APPEND-ONLY, kept separate from source) -
create table public.ai_recognition_edits (
  id                 uuid primary key default gen_random_uuid(),
  ai_recognition_id  uuid not null references public.ai_recognitions(id) on delete cascade,
  field              text not null,
  old_value          text,
  new_value          text,
  edited_by          uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now()
);
create index ai_recognition_edits_rec_idx on public.ai_recognition_edits(ai_recognition_id);

-- Generic audit log --------------------------------------------------
create table public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  entity      text not null,
  entity_id   uuid,
  action      text not null,
  actor_id    uuid references public.profiles(id) on delete set null,
  diff        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_entity_idx on public.audit_log(entity, entity_id);

-- updated_at helper -------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger value_checks_touch before update on public.value_checks
  for each row execute function public.touch_updated_at();

-- Create a profile row on new auth user ---------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
