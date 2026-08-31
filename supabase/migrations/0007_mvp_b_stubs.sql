-- BELAUK MVP-A · 0007 · MVP-B skeleton tables (RLS on, minimal columns).
-- Fleshed out in MVP-B. Present now so FKs and the data model are stable.

create table public.offers (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  amount_mmk  bigint not null check (amount_mmk >= 0),
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

create table public.conversations (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (product_id, buyer_id)
);

create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null,
  created_at      timestamptz not null default now()
);

create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  seller_id   uuid not null references public.profiles(id) on delete cascade,
  buyer_id    uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending',
  created_at  timestamptz not null default now()
);

create table public.transaction_confirmations (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  actor_id       uuid not null references public.profiles(id) on delete cascade,
  actor_role     public.price_event_source not null,
  completed      boolean not null,
  actual_price_mmk bigint,
  rating         int check (rating between 1 and 5),
  created_at     timestamptz not null default now(),
  unique (transaction_id, actor_id)
);

create table public.meet_locations (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid references public.areas(id) on delete set null,
  name        text not null,
  lat         double precision,
  lng         double precision,
  attributes  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.meet_checkins (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  actor_id       uuid not null references public.profiles(id) on delete cascade,
  meet_location_id uuid references public.meet_locations(id) on delete set null,
  checked_in_at  timestamptz not null default now()
);

create table public.trust_events (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  event_type  text not null,
  context     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create table public.reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  target_type   text not null,
  target_id     uuid not null,
  reason        text not null,
  detail        text,
  status        text not null default 'open',
  created_at    timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array[
    'offers','conversations','messages','transactions','transaction_confirmations',
    'meet_locations','meet_checkins','trust_events','reports'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Minimal read policies so nothing is world-open; writes come later in MVP-B.
create policy meet_locations_read on public.meet_locations for select using (true);
create policy offers_party_read on public.offers for select
  using (buyer_id = auth.uid()
     or exists (select 1 from public.products p where p.id = offers.product_id and p.seller_id = auth.uid()));
create policy conversations_party_read on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy messages_party_read on public.messages for select
  using (exists (select 1 from public.conversations c
                 where c.id = messages.conversation_id
                   and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create policy transactions_party_read on public.transactions for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy tx_conf_party_read on public.transaction_confirmations for select
  using (exists (select 1 from public.transactions t
                 where t.id = transaction_confirmations.transaction_id
                   and (t.buyer_id = auth.uid() or t.seller_id = auth.uid())));
create policy meet_checkins_party_read on public.meet_checkins for select
  using (actor_id = auth.uid());
create policy trust_events_self_read on public.trust_events for select
  using (profile_id = auth.uid());
create policy reports_self_read on public.reports for select
  using (reporter_id = auth.uid());
