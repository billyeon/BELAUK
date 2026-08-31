-- BELAUK MVP-A · 0001 · extensions, enums, cleanup of scratch tables
-- Repurposing the former "lesds-saturday-6" project. The two scratch tables are empty (0 rows).

drop table if exists public.lead_notes cascade;
drop table if exists public.leads cascade;

create extension if not exists "pgcrypto";

-- Roles / trust ------------------------------------------------------------
do $$ begin
  create type public.trust_level as enum ('new', 'active', 'trusted');
exception when duplicate_object then null; end $$;

-- Product ----------------------------------------------------------------
do $$ begin
  create type public.product_status as enum ('draft', 'selling', 'reserved', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.product_condition as enum ('new', 'like_new', 'good', 'fair', 'poor');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('photo', 'video');
exception when duplicate_object then null; end $$;

-- Price events (append-only) -------------------------------------------
do $$ begin
  create type public.price_event_type as enum (
    'initial_listing', 'price_change', 'offer', 'counter_offer', 'agreed', 'confirmed_actual'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.price_event_source as enum ('seller', 'buyer', 'system');
exception when duplicate_object then null; end $$;

-- Value check / market comparison ------------------------------------
do $$ begin
  create type public.price_verdict as enum ('high', 'within_range', 'low', 'insufficient_data');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.data_sufficiency as enum ('sufficient', 'low', 'none');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.value_check_status as enum ('draft', 'recognized', 'priced', 'listed', 'abandoned');
exception when duplicate_object then null; end $$;
