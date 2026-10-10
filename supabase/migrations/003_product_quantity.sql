-- Kesh Fitness · migration 003: product stock quantity
-- Run AFTER 002_members.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- Adds a stock count to products. The admin panel's − / + buttons change it, and
-- "In stock" switches off automatically when it reaches 0.

alter table public.products
  add column if not exists quantity integer not null default 0 check (quantity >= 0);

-- Existing products that are marked in stock start at 1 so they don't suddenly show as sold out.
update public.products set quantity = 1 where in_stock and quantity = 0;
