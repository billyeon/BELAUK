-- BELAUK MVP-A · 0004 · APPEND-ONLY: price_events + market_comparisons
-- PRD §12: 실거래 데이터는 절대 덮어쓰지 않는다.

create table public.price_events (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  event_type  public.price_event_type not null,
  amount_mmk  bigint not null check (amount_mmk >= 0),
  actor_id    uuid references public.profiles(id) on delete set null,
  actor_role  public.price_event_source not null default 'system',
  context     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index price_events_product_idx on public.price_events(product_id, created_at);
create index price_events_type_idx    on public.price_events(event_type);

create table public.market_comparisons (
  id                 uuid primary key default gen_random_uuid(),
  value_check_id     uuid references public.value_checks(id) on delete set null,
  product_id         uuid references public.products(id) on delete set null,
  target_category_id uuid references public.categories(id) on delete set null,
  target_brand       text,
  target_model       text,
  sample_size        int not null default 0,
  price_min          bigint,
  price_p25          bigint,
  price_median       bigint,
  price_p75          bigint,
  price_max          bigint,
  data_sufficiency   public.data_sufficiency not null default 'none',
  verdict            public.price_verdict not null default 'insufficient_data',
  desired_price      bigint,
  computed_from      jsonb not null default '{}'::jsonb,
  created_at         timestamptz not null default now()
);
create index market_comparisons_value_check_idx on public.market_comparisons(value_check_id);
create index market_comparisons_product_idx     on public.market_comparisons(product_id);

-- Block UPDATE / DELETE at the database level -----------------------
create or replace function public.reject_mutation()
returns trigger language plpgsql as $$
begin
  raise exception 'Table %.% is append-only; % is not allowed',
    tg_table_schema, tg_table_name, tg_op
    using errcode = 'restrict_violation';
end $$;

create trigger price_events_append_only
  before update or delete on public.price_events
  for each row execute function public.reject_mutation();

create trigger market_comparisons_append_only
  before update or delete on public.market_comparisons
  for each row execute function public.reject_mutation();

create trigger ai_recognitions_append_only
  before update or delete on public.ai_recognitions
  for each row execute function public.reject_mutation();

create trigger ai_recognition_edits_append_only
  before update or delete on public.ai_recognition_edits
  for each row execute function public.reject_mutation();

-- Defense in depth: no direct DML grants to client roles ----------
revoke insert, update, delete on public.price_events        from anon, authenticated;
revoke insert, update, delete on public.market_comparisons  from anon, authenticated;
revoke update, delete          on public.ai_recognitions      from anon, authenticated;
revoke update, delete          on public.ai_recognition_edits from anon, authenticated;
revoke insert, update, delete  on public.audit_log            from anon, authenticated;
