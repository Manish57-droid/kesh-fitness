-- Kesh Fitness · migration 002: Active Members
-- Run AFTER supabase/schema.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- Adds a members list that only the admin can see and edit.
-- Required: name, phone, address. Everything else is optional.

create table if not exists public.members (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 60),
  phone text not null check (char_length(phone) between 10 and 15),
  address text not null check (char_length(address) between 1 and 200),
  email text check (char_length(email) <= 100),
  age smallint check (age between 10 and 90),
  gender text check (gender in ('male', 'female', 'other')),
  plan text check (plan in ('gym', 'cardio')),
  joined_on date not null default current_date,
  paid_until date,                                     -- monthly fee paid up to this date
  emergency_contact text check (char_length(emergency_contact) <= 60),
  notes text check (char_length(notes) <= 500),
  is_active boolean not null default true,             -- false = left / paused
  join_request_id bigint references public.join_requests (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists members_active_idx on public.members (is_active, name);

-- Reuses touch_updated_at() from schema.sql.
drop trigger if exists members_touch_updated_at on public.members;
create trigger members_touch_updated_at
  before update on public.members
  for each row execute function public.touch_updated_at();

alter table public.members enable row level security;

-- Members' personal details are private: admin only, for every operation.
drop policy if exists "members: admin all" on public.members;
create policy "members: admin all" on public.members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on public.members from anon;
