-- BELAUK MVP-A · 0010 · MSRP (new-price) cache + web-search cost ledger
-- Supports "정가 기반 감가상각" pricing: look up a product's new / launch price
-- once via Anthropic server-side web search, cache it, then depreciate in code.
-- Both tables are server-only (service role). No scraping, no login — the model's
-- web_search tool only returns pages already indexed by search engines.

-- Cached new-price per (brand, model). Mutable: refreshed when expired. --------
create table if not exists public.product_msrp_cache (
  id               uuid primary key default gen_random_uuid(),
  brand_key        text not null,                 -- lower(trim(brand))
  model_key        text not null,                 -- lower(trim(model))
  category_slug    text,
  found            boolean not null default false,
  msrp_mmk         bigint,                        -- new price normalised to MMK
  source_currency  text,                          -- e.g. "USD", "MMK"
  source_amount    numeric,                       -- price as quoted in the source
  fx_rate_to_mmk   numeric,                       -- rate used for the conversion
  source_url       text,
  source_title     text,
  as_of            text,                          -- launch year / observation date, free text
  note             text,
  ai_model         text,
  checked_at       timestamptz not null default now(),
  expires_at       timestamptz not null
);
create unique index if not exists product_msrp_cache_key
  on public.product_msrp_cache (brand_key, model_key);

alter table public.product_msrp_cache enable row level security;
revoke all on public.product_msrp_cache from anon, authenticated;

-- Append-only spend log so the monthly web-search budget guard has a source of
-- truth even after cache rows are overwritten on refresh. ---------------------
create table if not exists public.web_search_ledger (
  id             uuid primary key default gen_random_uuid(),
  purpose        text not null default 'msrp_lookup',
  brand          text,
  model          text,
  searches       int not null default 0,
  input_tokens   int not null default 0,
  output_tokens  int not null default 0,
  cost_usd       numeric not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists web_search_ledger_month_idx
  on public.web_search_ledger (created_at);

alter table public.web_search_ledger enable row level security;
revoke all on public.web_search_ledger from anon, authenticated;

-- Month-to-date web-search spend (UTC month), for the budget cap. -------------
create or replace function public.web_search_spend_mtd()
returns numeric
language sql stable security definer set search_path = public as $$
  select coalesce(sum(cost_usd), 0)::numeric
  from public.web_search_ledger
  where created_at >= date_trunc('month', now() at time zone 'utc');
$$;
