-- BELAUK MVP-A · 0006 · public view + RPCs

-- Public product view: township-level location only, no phone/address (PRD §9)
create or replace view public.public_products
with (security_invoker = true) as
select
  p.id,
  p.title,
  p.description,
  p.category_id,
  c.slug          as category_slug,
  p.brand,
  p.model,
  p.condition,
  p.purchase_period,
  p.has_purchase_proof,
  p.has_video,
  p.status,
  p.ai_generated,
  p.checked,
  p.current_price_mmk,
  p.view_count,
  p.created_at,
  a.city          as area_city,
  a.township      as area_township,
  a.name_my       as area_name_my,
  a.name_en       as area_name_en,
  a.name_zh       as area_name_zh,
  a.name_ko       as area_name_ko,
  seller.display_name as seller_name,
  seller.trust_level  as seller_trust_level,
  (select pm.storage_path from public.product_media pm
     where pm.product_id = p.id order by pm.sort limit 1) as cover_path
from public.products p
left join public.categories c on c.id = p.category_id
left join public.areas a on a.id = p.area_id
left join public.profiles seller on seller.id = p.seller_id
where p.status <> 'draft';

grant select on public.public_products to anon, authenticated;

-- Market price range (PRD §4.1: 높음 / 적정범위 / 낮음 / 데이터 부족) ----
-- NOTE: kept as a STABLE pure-SQL function (temp tables are disallowed in
-- non-volatile functions). See migration 0008 for the deployed definition.
create or replace function public.get_price_range(
  p_category_id uuid,
  p_brand text default null,
  p_model text default null,
  p_country text default 'MM',
  p_months int default 6,
  p_desired bigint default null
)
returns table (
  sample_size int, price_min bigint, price_p25 bigint, price_median bigint,
  price_p75 bigint, price_max bigint,
  data_sufficiency public.data_sufficiency, verdict public.price_verdict
)
language sql stable security definer set search_path = public as $$
  with obs as (
    select pe.amount_mmk as amount
    from public.price_events pe
    join public.products pr on pr.id = pe.product_id
    left join public.areas ar on ar.id = pr.area_id
    where pe.event_type = 'confirmed_actual'
      and pe.created_at >= now() - make_interval(months => greatest(p_months, 1))
      and (p_category_id is null or pr.category_id = p_category_id)
      and (p_brand is null or pr.brand ilike p_brand)
      and (p_model is null or pr.model ilike p_model)
      and coalesce(ar.country, 'MM') = p_country
    union all
    select pr.current_price_mmk
    from public.products pr
    left join public.areas ar on ar.id = pr.area_id
    where pr.status in ('selling', 'reserved')
      and pr.created_at >= now() - make_interval(months => greatest(p_months, 1))
      and (p_category_id is null or pr.category_id = p_category_id)
      and (p_brand is null or pr.brand ilike p_brand)
      and (p_model is null or pr.model ilike p_model)
      and coalesce(ar.country, 'MM') = p_country
  ),
  agg as (
    select count(*)::int as n, min(amount) as mn,
      percentile_cont(0.25) within group (order by amount)::bigint as p25,
      percentile_cont(0.50) within group (order by amount)::bigint as p50,
      percentile_cont(0.75) within group (order by amount)::bigint as p75,
      max(amount) as mx
    from obs
  )
  select n,
    case when n >= 5 then mn end,
    case when n >= 5 then p25 end,
    case when n >= 5 then p50 end,
    case when n >= 5 then p75 end,
    case when n >= 5 then mx end,
    (case when n >= 15 then 'sufficient' when n >= 5 then 'low' else 'none' end)::public.data_sufficiency,
    (case
       when n < 5 then 'insufficient_data'
       when p_desired is null then 'within_range'
       when p_desired < p25 then 'low'
       when p_desired > p75 then 'high'
       else 'within_range'
     end)::public.price_verdict
  from agg;
$$;

grant execute on function public.get_price_range(uuid, text, text, text, int, bigint) to anon, authenticated;

-- Append-only write channels (used by server via service role) -----
create or replace function public.insert_price_event(
  p_product_id uuid,
  p_event_type public.price_event_type,
  p_amount_mmk bigint,
  p_actor_id uuid default null,
  p_actor_role public.price_event_source default 'system',
  p_context jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into public.price_events (product_id, event_type, amount_mmk, actor_id, actor_role, context)
  values (p_product_id, p_event_type, p_amount_mmk, p_actor_id, p_actor_role, p_context)
  returning id into new_id;
  return new_id;
end $$;

create or replace function public.insert_market_comparison(
  p_value_check_id uuid,
  p_product_id uuid,
  p_target_category_id uuid,
  p_target_brand text,
  p_target_model text,
  p_sample_size int,
  p_price_min bigint,
  p_price_p25 bigint,
  p_price_median bigint,
  p_price_p75 bigint,
  p_price_max bigint,
  p_data_sufficiency public.data_sufficiency,
  p_verdict public.price_verdict,
  p_desired_price bigint,
  p_computed_from jsonb default '{}'::jsonb
)
returns uuid language plpgsql security definer set search_path = public as $$
declare new_id uuid;
begin
  insert into public.market_comparisons (
    value_check_id, product_id, target_category_id, target_brand, target_model,
    sample_size, price_min, price_p25, price_median, price_p75, price_max,
    data_sufficiency, verdict, desired_price, computed_from
  ) values (
    p_value_check_id, p_product_id, p_target_category_id, p_target_brand, p_target_model,
    p_sample_size, p_price_min, p_price_p25, p_price_median, p_price_p75, p_price_max,
    p_data_sufficiency, p_verdict, p_desired_price, p_computed_from
  ) returning id into new_id;
  return new_id;
end $$;

-- View-count bump (no-audit convenience) --------------------------
create or replace function public.bump_product_view(p_product_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.products set view_count = view_count + 1 where id = p_product_id;
$$;
grant execute on function public.bump_product_view(uuid) to anon, authenticated;
