-- Kesh Fitness · migration 004: shop orders (UPI / cash) and admin-managed photo gallery
-- Run AFTER 003_product_quantity.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.

-- ─────────────────────────────────────────────────────────────
-- Orders
-- Customers never touch this table directly. They go through place_order / submit_utr /
-- get_order below, so prices, totals and stock are always calculated by the database.
-- ─────────────────────────────────────────────────────────────
create sequence if not exists public.order_receipt_seq;

create table if not exists public.orders (
  id bigint generated always as identity primary key,
  -- e.g. KF261010-0007 (date in India time + running number)
  receipt_no text not null unique default (
    'KF' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' ||
    lpad(nextval('public.order_receipt_seq')::text, 4, '0')
  ),
  token uuid not null unique default gen_random_uuid(),  -- secret link to the receipt
  customer_name text not null check (char_length(customer_name) between 1 and 60),
  customer_phone text not null check (char_length(customer_phone) between 10 and 15),
  product_id bigint references public.products (id) on delete set null,
  product_name text not null,                              -- copy, in case the product changes later
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 50),
  subtotal integer not null,
  service_charge integer not null default 0,
  total integer not null,
  payment_method text not null check (payment_method in ('upi', 'cash')),
  -- pending:   created; UPI not paid yet, or cash not collected yet
  -- verifying: customer entered a UPI transaction ID (UTR); admin needs to check it
  -- paid:      confirmed by admin
  -- cancelled: cancelled by admin (stock is returned)
  status text not null default 'pending' check (status in ('pending', 'verifying', 'paid', 'cancelled')),
  utr text check (utr ~ '^[A-Z0-9]{10,22}$'),
  paid_at timestamptz,
  confirmed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_status_idx on public.orders (status, created_at desc);

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

alter table public.orders enable row level security;

drop policy if exists "orders: admin read" on public.orders;
create policy "orders: admin read" on public.orders
  for select to authenticated using (public.is_admin());

-- No direct writes for anyone; everything goes through the functions below.
revoke insert, update, delete on public.orders from anon, authenticated;

-- Place an order. Checks stock, reserves it, and works out the total on the server.
-- Service charge: ₹1 per order (keep in sync with `serviceCharge` in lib/site.ts).
create or replace function public.place_order(
  p_product_id bigint, p_quantity integer, p_method text, p_name text, p_phone text
)
returns table (receipt_no text, token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_product public.products%rowtype;
  v_service integer := 1;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 50 then
    raise exception 'Please choose a quantity between 1 and 50.';
  end if;
  if p_method not in ('upi', 'cash') then
    raise exception 'Invalid payment method.';
  end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'Please enter your name.';
  end if;
  if trim(coalesce(p_phone, '')) !~ '^[0-9+ \-]{10,15}$' then
    raise exception 'Please enter a valid phone number.';
  end if;

  select * into v_product from public.products
  where id = p_product_id and is_active
  for update;

  if not found then
    raise exception 'This product is no longer available.';
  end if;
  if not v_product.in_stock or v_product.quantity < p_quantity then
    raise exception 'Sorry, only % left in stock.', greatest(v_product.quantity, 0);
  end if;

  update public.products
    set quantity = quantity - p_quantity,
        in_stock = (quantity - p_quantity) > 0
  where id = v_product.id;

  return query
    insert into public.orders as o (
      customer_name, customer_phone, product_id, product_name, unit_price, quantity,
      subtotal, service_charge, total, payment_method
    )
    values (
      trim(p_name), trim(p_phone), v_product.id, v_product.name, v_product.price, p_quantity,
      v_product.price * p_quantity, v_service, v_product.price * p_quantity + v_service, p_method
    )
    returning o.receipt_no, o.token;
end;
$$;

-- Customer submits the UPI transaction ID (UTR) after paying.
create or replace function public.submit_utr(p_token uuid, p_utr text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_utr text := upper(regexp_replace(coalesce(p_utr, ''), '\s', '', 'g'));
begin
  if v_utr !~ '^[A-Z0-9]{10,22}$' then
    raise exception 'Please enter the 12-digit UPI transaction ID (UTR) from your payment app.';
  end if;

  update public.orders
    set utr = v_utr, status = 'verifying'
  where token = p_token and payment_method = 'upi' and status in ('pending', 'verifying');

  if not found then
    raise exception 'This order can no longer be updated.';
  end if;
end;
$$;

-- Customer reads their own order (for the receipt page) using its secret token.
create or replace function public.get_order(p_token uuid)
returns table (
  receipt_no text, customer_name text, customer_phone text, product_name text,
  unit_price integer, quantity integer, subtotal integer, service_charge integer, total integer,
  payment_method text, status text, utr text, paid_at timestamptz, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select o.receipt_no, o.customer_name, o.customer_phone, o.product_name,
         o.unit_price, o.quantity, o.subtotal, o.service_charge, o.total,
         o.payment_method, o.status, o.utr, o.paid_at, o.created_at
  from public.orders o
  where o.token = p_token;
$$;

-- Admin confirms a payment or cancels an order (cancelling returns the stock).
create or replace function public.admin_set_order_status(p_id bigint, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Only admins can update orders.';
  end if;

  select * into v_order from public.orders where id = p_id for update;
  if not found then
    raise exception 'Order not found.';
  end if;

  if p_status = 'paid' then
    if v_order.status not in ('pending', 'verifying') then
      raise exception 'Only pending orders can be marked paid.';
    end if;
    update public.orders
      set status = 'paid', paid_at = now(), confirmed_by = auth.uid()
    where id = p_id;

  elsif p_status = 'cancelled' then
    if v_order.status = 'cancelled' then
      return;
    end if;
    update public.orders set status = 'cancelled' where id = p_id;
    if v_order.product_id is not null then
      update public.products
        set quantity = quantity + v_order.quantity, in_stock = true
      where id = v_order.product_id;
    end if;

  else
    raise exception 'Invalid status.';
  end if;
end;
$$;

grant execute on function public.place_order(bigint, integer, text, text, text) to anon, authenticated;
grant execute on function public.submit_utr(uuid, text) to anon, authenticated;
grant execute on function public.get_order(uuid) to anon, authenticated;
grant execute on function public.admin_set_order_status(bigint, text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- Photo gallery (website slideshow), managed by the admin
-- ─────────────────────────────────────────────────────────────
create table if not exists public.gallery_photos (
  id bigint generated always as identity primary key,
  image_url text not null,
  caption text check (char_length(caption) <= 100),
  sort_order integer not null default 0,     -- lower numbers show first
  is_active boolean not null default true,   -- false = hidden from the website
  created_at timestamptz not null default now()
);

alter table public.gallery_photos enable row level security;

drop policy if exists "gallery: public reads visible" on public.gallery_photos;
create policy "gallery: public reads visible" on public.gallery_photos
  for select to anon, authenticated using (is_active or public.is_admin());

drop policy if exists "gallery: admin insert" on public.gallery_photos;
create policy "gallery: admin insert" on public.gallery_photos
  for insert to authenticated with check (public.is_admin());

drop policy if exists "gallery: admin update" on public.gallery_photos;
create policy "gallery: admin update" on public.gallery_photos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "gallery: admin delete" on public.gallery_photos;
create policy "gallery: admin delete" on public.gallery_photos
  for delete to authenticated using (public.is_admin());

-- Start with the photos that ship with the website (only if the gallery is empty).
insert into public.gallery_photos (image_url, caption, sort_order)
select v.url, v.caption, v.ord
from (values
  ('/images/gallery-1.jpg', 'On the rocks', 1),
  ('/images/gallery-2.jpg', 'All smiles', 2),
  ('/images/gallery-3.jpg', 'By the river', 3),
  ('/images/gallery-4.jpg', 'Peak bicep', 4),
  ('/images/gallery-5.jpg', 'Competition day', 5),
  ('/images/gallery-6.jpg', 'Backstage', 6)
) as v(url, caption, ord)
where not exists (select 1 from public.gallery_photos);

-- Public bucket for gallery photos (max 8 MB, images only). Only admins can upload or delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "gallery images: admin upload" on storage.objects;
create policy "gallery images: admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery' and public.is_admin());

drop policy if exists "gallery images: admin delete" on storage.objects;
create policy "gallery images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery' and public.is_admin());
