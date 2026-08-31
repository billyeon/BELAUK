-- BELAUK MVP-A · 0003 · products + product media

create table public.products (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.profiles(id) on delete cascade,
  value_check_id    uuid references public.value_checks(id) on delete set null,
  title             text not null,
  description       text not null default '',
  category_id       uuid references public.categories(id) on delete set null,
  brand             text,
  model             text,
  condition         public.product_condition not null default 'good',
  purchase_period   text,
  has_purchase_proof boolean not null default false,
  has_video         boolean not null default false,
  area_id           uuid references public.areas(id) on delete set null,
  status            public.product_status not null default 'selling',
  ai_generated      boolean not null default false,
  checked           jsonb not null default '{}'::jsonb,
  current_price_mmk bigint not null,
  view_count        int not null default 0,
  search_tsv        tsvector generated always as (
                       to_tsvector('simple',
                         coalesce(title,'') || ' ' ||
                         coalesce(brand,'') || ' ' ||
                         coalesce(model,'') || ' ' ||
                         coalesce(description,''))
                     ) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index products_status_idx   on public.products(status);
create index products_category_idx on public.products(category_id);
create index products_area_idx     on public.products(area_id);
create index products_seller_idx   on public.products(seller_id);
create index products_search_idx   on public.products using gin(search_tsv);
create index products_created_idx  on public.products(created_at desc);

create trigger products_touch before update on public.products
  for each row execute function public.touch_updated_at();

create table public.product_media (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  storage_path text not null,
  kind        public.media_kind not null default 'photo',
  sort        int not null default 0,
  redaction   jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);
create index product_media_product_idx on public.product_media(product_id, sort);
