-- BELAUK MVP-A · 0009 · phone OTP table (mock auth) + storage buckets
-- Mock OTP: codes are generated + verified in the app. Swap for a real SMS
-- gateway later by replacing the send step only.

create table if not exists public.phone_otps (
  id          uuid primary key default gen_random_uuid(),
  phone       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  consumed_at timestamptz,
  attempts    int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists phone_otps_phone_idx on public.phone_otps(phone, created_at desc);

alter table public.phone_otps enable row level security;
-- No client policies: only the service role (server) touches this table.
revoke all on public.phone_otps from anon, authenticated;

-- Storage buckets ---------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('scan-media', 'scan-media', false, 26214400,
   array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']),
  ('product-media', 'product-media', true, 26214400,
   array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_media_public_read" on storage.objects;
create policy "product_media_public_read" on storage.objects
  for select using (bucket_id = 'product-media');

drop policy if exists "product_media_auth_write" on storage.objects;
create policy "product_media_auth_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-media');

drop policy if exists "product_media_auth_update" on storage.objects;
create policy "product_media_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'product-media');

drop policy if exists "scan_media_owner_all" on storage.objects;
create policy "scan_media_owner_all" on storage.objects
  for all to authenticated using (bucket_id = 'scan-media') with check (bucket_id = 'scan-media');
