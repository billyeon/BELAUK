-- BELAUK MVP-A · seed · Yangon areas, categories, demo listings + confirmed prices
-- Safe to re-run: uses stable keys and on-conflict guards.

-- Areas -----------------------------------------------------------------
insert into public.areas (country, city, township, name_my, name_en, name_zh, name_ko, sort) values
  ('MM','Yangon','Sanchaung',   'စမ်းချောင်း','Sanchaung','三桥镇','산차웅',1),
  ('MM','Yangon','Bahan',       'ဗဟန်း','Bahan','巴罕镇','바한',2),
  ('MM','Yangon','Kamayut',     'ကမာရွတ်','Kamayut','卡马育镇','카마유',3),
  ('MM','Yangon','Hlaing',      'လှိုင်','Hlaing','莱镇','흘라잉',4),
  ('MM','Yangon','Thingangyun', 'သင်္ဃန်းကျွန်း','Thingangyun','丁茵镇','띤간준',5),
  ('MM','Yangon','Mayangone',   'မရမ်းကုန်း','Mayangone','马扬贡镇','마양곤',6),
  ('MM','Yangon','South Okkalapa','တောင်ဥက္ကလာပ','South Okkalapa','南奥卡拉帕镇','남옥칼라파',7),
  ('MM','Yangon','Insein',      'အင်းစိန်','Insein','茵盛镇','인세인',8)
on conflict (country, city, township) do nothing;

-- Categories (2 levels) ----------------------------------------------
insert into public.categories (slug, name_my, name_en, name_zh, name_ko, icon, sort) values
  ('electronics','အီလက်ထရွန်နစ်','Electronics','电子产品','전자기기','📱',1),
  ('home','အိမ်သုံးပစ္စည်း','Home & Appliances','家居家电','생활·가전','🏠',2),
  ('fashion','ဖက်ရှင်','Fashion','时尚','패션','👜',3),
  ('vehicles','ယာဉ်','Vehicles','车辆','차량','🛥',4),
  ('hobby','ဝါသနာ','Hobby & Sports','兴趣·运动','취미·스포츠','⚽',5)
on conflict (slug) do nothing;

insert into public.categories (parent_id, slug, name_my, name_en, name_zh, name_ko, sort)
select c.id, v.slug, v.name_my, v.name_en, v.name_zh, v.name_ko, v.sort
from (values
  ('electronics','phones','ဖုန်း','Phones','手机','휴대폰',1),
  ('electronics','laptops','လက်တော့','Laptops','笔记本电脑','노트북',2),
  ('electronics','audio','အသံစက်ပစ္စည်း','Audio','音频设备','오디오',3),
  ('home','kitchen','မီးဖိုချောင်','Kitchen','厨房','주방',1),
  ('home','laundry','အဝတ်လျှော်စက်','Laundry','洗衣','세탁',2),
  ('fashion','bags','အိတ်','Bags','箱包','가방',1),
  ('fashion','shoes','ဖိနပ်','Shoes','鞋','신발',2)
) as v(parent_slug, slug, name_my, name_en, name_zh, name_ko, sort)
join public.categories c on c.slug = v.parent_slug
on conflict (slug) do nothing;

-- Seed seller (synthetic auth user; handle_new_user creates the profile) --
insert into auth.users (id, instance_id, aud, role, phone, phone_confirmed_at, created_at, updated_at)
values
  ('00000000-0000-0000-0000-0000000000a1','00000000-0000-0000-0000-000000000000','authenticated','authenticated','959700000001', now(), now(), now()),
  ('00000000-0000-0000-0000-0000000000a2','00000000-0000-0000-0000-000000000000','authenticated','authenticated','959700000002', now(), now(), now())
on conflict (id) do nothing;

update public.profiles set display_name = 'BELAUK Seller A', trust_level = 'active',
  primary_area_id = (select id from public.areas where township = 'Sanchaung')
where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set display_name = 'BELAUK Seller B', trust_level = 'trusted',
  primary_area_id = (select id from public.areas where township = 'Bahan')
where id = '00000000-0000-0000-0000-0000000000a2';

-- Demo listings ----------------------------------------------------
with seller_a as (select '00000000-0000-0000-0000-0000000000a1'::uuid id),
     seller_b as (select '00000000-0000-0000-0000-0000000000a2'::uuid id)
insert into public.products
  (id, seller_id, title, description, category_id, brand, model, condition,
   purchase_period, has_purchase_proof, has_video, area_id, status, ai_generated,
   checked, current_price_mmk, created_at)
select
  v.id,
  case when v.seller = 'a' then (select id from seller_a) else (select id from seller_b) end,
  v.title, v.description,
  (select id from public.categories where slug = v.cat),
  v.brand, v.model, v.condition::public.product_condition,
  v.purchase_period, v.has_proof, v.has_video,
  (select id from public.areas where township = v.township),
  'selling', true,
  jsonb_build_object(
    'photos_ok', true, 'condition_provided', true, 'purchase_period_provided', true,
    'has_video', v.has_video, 'has_purchase_proof', v.has_proof, 'price_reviewed', true),
  v.price,
  now() - (v.age_days || ' days')::interval
from (values
  ('11111111-0000-0000-0000-000000000001'::uuid,'a','iPhone 11 64GB','ခလုတ်များ ကောင်းမွန်စွာ အလုပ်လုပ်သည်။ ဘက်ထရီ 84%။','phones','Apple','iPhone 11','good','2021',false,true,'Sanchaung',285000,3),
  ('11111111-0000-0000-0000-000000000002'::uuid,'b','iPhone 11 128GB Black','Face ID ကောင်း၊ မှန်သားမကွဲ။','phones','Apple','iPhone 11','like_new','2022',true,false,'Bahan',315000,6),
  ('11111111-0000-0000-0000-000000000003'::uuid,'a','iPhone 11 64GB White','ဘက်ထရီ 79%။ အနောက်မှန် အက်ကြောင်းအနည်းငယ်။','phones','Apple','iPhone 11','fair','2020',false,false,'Kamayut',255000,10),
  ('11111111-0000-0000-0000-000000000004'::uuid,'b','iPhone 13 128GB','အခြေအနေကောင်း၊ box ပါ။','phones','Apple','iPhone 13','like_new','2023',true,true,'Mayangone',720000,2),
  ('11111111-0000-0000-0000-000000000005'::uuid,'a','iPhone 13 256GB Blue','ဘက်ထရီ 91%။','phones','Apple','iPhone 13','good','2022',false,false,'Hlaing',760000,8),
  ('11111111-0000-0000-0000-000000000006'::uuid,'b','Samsung Galaxy A54','Mid-range၊ ကင်မရာ ကောင်း။','phones','Samsung','Galaxy A54','good','2023',false,false,'Thingangyun',330000,5),
  ('11111111-0000-0000-0000-000000000007'::uuid,'a','MacBook Air M1 2020','8GB / 256GB Space Gray။ Cycle 210။','laptops','Apple','MacBook Air M1','good','2021',true,true,'Sanchaung',850000,4),
  ('11111111-0000-0000-0000-000000000008'::uuid,'b','MacBook Air M2 2022','16GB / 512GB။ အသစ်နီးပါး။','laptops','Apple','MacBook Air M2','like_new','2023',true,false,'Bahan',1550000,7),
  ('11111111-0000-0000-0000-000000000009'::uuid,'a','Dell XPS 13 9310','i7 / 16GB / 512GB။','laptops','Dell','XPS 13 9310','good','2021',false,false,'Insein',900000,12),
  ('11111111-0000-0000-0000-00000000000a'::uuid,'b','Sony WH-1000XM4','Noise cancelling headphone။ Case ပါ။','audio','Sony','WH-1000XM4','good','2022',false,false,'Kamayut',210000,9),
  ('11111111-0000-0000-0000-00000000000b'::uuid,'a','Samsung Front Load 7.5kg','Inverter၊ 2019။ ကောင်းမွန်စွာ အလုပ်လုပ်။','laundry','Samsung','WW75','good','2019',false,true,'South Okkalapa',265000,14),
  ('11111111-0000-0000-0000-00000000000c'::uuid,'b','Panasonic Rice Cooker 1.8L','မီးဖိုချောင် သုံးပစ္စည်း။','kitchen','Panasonic','SR-1.8L','like_new','2023',false,false,'Mayangone',48000,6),
  ('11111111-0000-0000-0000-00000000000d'::uuid,'a','Tory Burch Ella Tote','Canvas၊ အခြေအနေကောင်း။','bags','Tory Burch','Ella Tote','good','2022',true,false,'Bahan',210000,11),
  ('11111111-0000-0000-0000-00000000000e'::uuid,'b','Nike Air Force 1 (42)','ဝတ်ထားသည် အနည်းငယ်။','shoes','Nike','Air Force 1','good','2023',false,false,'Hlaing',95000,3)
) as v(id, seller, title, description, cat, brand, model, condition, purchase_period, has_proof, has_video, township, price, age_days)
on conflict (id) do nothing;

-- Initial listing price events (append-only) -----------------------
insert into public.price_events (product_id, event_type, amount_mmk, actor_role, context)
select p.id, 'initial_listing', p.current_price_mmk, 'seller', jsonb_build_object('seed', true)
from public.products p
where p.id::text like '11111111-%'
  and not exists (select 1 from public.price_events e where e.product_id = p.id and e.event_type = 'initial_listing');

-- Confirmed actual transaction prices (gives get_price_range real samples) --
insert into public.price_events (product_id, event_type, amount_mmk, actor_role, context, created_at)
select v.pid::uuid, 'confirmed_actual', v.amount, 'system', jsonb_build_object('seed', true), now() - (v.age || ' days')::interval
from (values
  ('11111111-0000-0000-0000-000000000001', 270000, 20),
  ('11111111-0000-0000-0000-000000000002', 300000, 34),
  ('11111111-0000-0000-0000-000000000003', 240000, 45),
  ('11111111-0000-0000-0000-000000000004', 700000, 15),
  ('11111111-0000-0000-0000-000000000005', 735000, 22),
  ('11111111-0000-0000-0000-000000000004', 745000, 40),
  ('11111111-0000-0000-0000-000000000005', 690000, 55),
  ('11111111-0000-0000-0000-000000000007', 820000, 30),
  ('11111111-0000-0000-0000-000000000008', 1500000, 18)
) as v(pid, amount, age)
where not exists (
  select 1 from public.price_events e
  where e.product_id = v.pid::uuid and e.event_type = 'confirmed_actual'
);

-- One cover media row per product (paths are placeholders until real uploads) --
insert into public.product_media (product_id, storage_path, kind, sort)
select p.id, 'seed/' || right(p.id::text, 12) || '.jpg', 'photo', 0
from public.products p
where p.id::text like '11111111-%'
  and not exists (select 1 from public.product_media m where m.product_id = p.id);
