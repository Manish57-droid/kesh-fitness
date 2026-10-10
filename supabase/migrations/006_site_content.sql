-- Kesh Fitness · migration 006: editable website content
-- Run AFTER 005_unlimited_stock.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- Stores the landing-page text, images, prices and timings that the admin edits in
-- Admin → Website. Everyone can read it; only the admin can change it.

create table if not exists public.site_content (
  key text primary key,                       -- 'home' for the landing page
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create or replace function public.touch_site_content()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists site_content_touch on public.site_content;
create trigger site_content_touch
  before insert or update on public.site_content
  for each row execute function public.touch_site_content();

alter table public.site_content enable row level security;

drop policy if exists "site content: everyone reads" on public.site_content;
create policy "site content: everyone reads" on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists "site content: admin writes" on public.site_content;
create policy "site content: admin writes" on public.site_content
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Public bucket for website images (hero, about, coach…). Only admins can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site', 'site', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site images: admin upload" on storage.objects;
create policy "site images: admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'site' and public.is_admin());

drop policy if exists "site images: admin delete" on storage.objects;
create policy "site images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'site' and public.is_admin());
