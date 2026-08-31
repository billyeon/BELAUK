-- BELAUK MVP-A · 0005 · Row Level Security

alter table public.areas                enable row level security;
alter table public.categories           enable row level security;
alter table public.profiles             enable row level security;
alter table public.value_checks         enable row level security;
alter table public.media                enable row level security;
alter table public.ai_recognitions      enable row level security;
alter table public.ai_recognition_edits enable row level security;
alter table public.products             enable row level security;
alter table public.product_media        enable row level security;
alter table public.price_events         enable row level security;
alter table public.market_comparisons   enable row level security;
alter table public.audit_log            enable row level security;

-- Reference data: world-readable ----------------------------------
create policy areas_read on public.areas for select using (true);
create policy categories_read on public.categories for select using (true);

-- Profiles: owner only (public seller info surfaced via views) -----
create policy profiles_self_read on public.profiles
  for select using (id = auth.uid());
create policy profiles_self_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Anonymous value-check ownership helper --------------------------
create or replace function public.owns_value_check(vc public.value_checks)
returns boolean language sql stable as $$
  select vc.user_id is not null and vc.user_id = auth.uid()
      or vc.anon_token is not null
         and vc.anon_token = current_setting('request.headers', true)::json->>'x-belauk-anon';
$$;

create policy value_checks_owner_all on public.value_checks
  for all using (public.owns_value_check(value_checks))
  with check (public.owns_value_check(value_checks));

create policy media_owner_all on public.media
  for all using (
    exists (select 1 from public.value_checks vc
            where vc.id = media.value_check_id and public.owns_value_check(vc))
  ) with check (
    exists (select 1 from public.value_checks vc
            where vc.id = media.value_check_id and public.owns_value_check(vc))
  );

-- AI recognition: owner can read + insert; never update/delete ----
create policy ai_recognitions_owner_read on public.ai_recognitions
  for select using (
    exists (select 1 from public.value_checks vc
            where vc.id = ai_recognitions.value_check_id and public.owns_value_check(vc))
  );
create policy ai_recognitions_owner_insert on public.ai_recognitions
  for insert with check (
    exists (select 1 from public.value_checks vc
            where vc.id = ai_recognitions.value_check_id and public.owns_value_check(vc))
  );
create policy ai_recognition_edits_owner_read on public.ai_recognition_edits
  for select using (
    exists (select 1 from public.ai_recognitions r
            join public.value_checks vc on vc.id = r.value_check_id
            where r.id = ai_recognition_edits.ai_recognition_id and public.owns_value_check(vc))
  );
create policy ai_recognition_edits_owner_insert on public.ai_recognition_edits
  for insert with check (
    exists (select 1 from public.ai_recognitions r
            join public.value_checks vc on vc.id = r.value_check_id
            where r.id = ai_recognition_edits.ai_recognition_id and public.owns_value_check(vc))
  );

-- Products: public listings readable; seller manages own ----------
create policy products_public_read on public.products
  for select using (status <> 'draft' or seller_id = auth.uid());
create policy products_seller_insert on public.products
  for insert with check (seller_id = auth.uid());
create policy products_seller_update on public.products
  for update using (seller_id = auth.uid()) with check (seller_id = auth.uid());

create policy product_media_read on public.product_media
  for select using (
    exists (select 1 from public.products p
            where p.id = product_media.product_id
              and (p.status <> 'draft' or p.seller_id = auth.uid()))
  );
create policy product_media_seller_write on public.product_media
  for all using (
    exists (select 1 from public.products p
            where p.id = product_media.product_id and p.seller_id = auth.uid())
  ) with check (
    exists (select 1 from public.products p
            where p.id = product_media.product_id and p.seller_id = auth.uid())
  );

-- Price history + comparisons: read-only evidence (PRD "근거 공개") --
create policy price_events_read on public.price_events for select using (true);
create policy market_comparisons_read on public.market_comparisons
  for select using (
    product_id is not null
    or exists (select 1 from public.value_checks vc
               where vc.id = market_comparisons.value_check_id and public.owns_value_check(vc))
  );

-- audit_log: no client access (service role bypasses RLS) --------
