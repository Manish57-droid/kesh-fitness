-- Kesh Fitness database schema.
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste → Run.
--
-- Visitors don't log in. They can read announcements and send messages; only the
-- admin logs in (create the admin in Authentication → Users → Add user).
--
-- If you ran an older version of this file, uncomment this block first to start clean:
-- drop table if exists public.notification_reads, public.workouts, public.messages, public.notifications cascade;
-- drop function if exists public.touch_last_seen(), public.set_user_role(uuid, text);

-- ─────────────────────────────────────────────────────────────
-- Profiles: one per auth user, with a role. Only admins use accounts.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());

-- Nobody edits profiles through the API; roles are set with SQL.
revoke insert, update, delete on public.profiles from anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Messages from visitors to the gym, with an optional admin reply
-- ─────────────────────────────────────────────────────────────
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 60),
  phone text check (char_length(phone) <= 20),
  body text not null check (char_length(body) between 1 and 1000),
  -- Secret kept in the sender's browser so they can see the reply without an account.
  token uuid not null default gen_random_uuid(),
  is_read boolean not null default false,
  reply text check (char_length(reply) <= 1000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.messages enable row level security;

-- Visitors never touch the table directly; they go through the two functions below.
drop policy if exists "messages: admin read" on public.messages;
create policy "messages: admin read" on public.messages
  for select to authenticated using (public.is_admin());

drop policy if exists "messages: admin update" on public.messages;
create policy "messages: admin update" on public.messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "messages: admin delete" on public.messages;
create policy "messages: admin delete" on public.messages
  for delete to authenticated using (public.is_admin());

revoke insert, update on public.messages from anon, authenticated;
grant update (is_read, reply, replied_at) on public.messages to authenticated;

-- Send a message. Returns the id and secret token for the sender's browser to keep.
create or replace function public.send_message(p_name text, p_phone text, p_body text)
returns table (id bigint, token uuid)
language plpgsql security definer set search_path = public as $$
begin
  return query
    insert into public.messages as m (name, phone, body)
    values (trim(p_name), nullif(trim(p_phone), ''), trim(p_body))
    returning m.id, m.token;
end;
$$;

-- Fetch the sender's own messages (and replies) by the tokens their browser saved.
create or replace function public.get_my_messages(p_tokens uuid[])
returns table (id bigint, body text, is_read boolean, reply text, replied_at timestamptz, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select m.id, m.body, m.is_read, m.reply, m.replied_at, m.created_at
  from public.messages m
  where m.token = any (p_tokens[1:50])
  order by m.created_at desc;
$$;

grant execute on function public.send_message(text, text, text) to anon, authenticated;
grant execute on function public.get_my_messages(uuid[]) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────
-- Announcements: admins post, everyone reads
-- ─────────────────────────────────────────────────────────────
create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  title text not null check (char_length(title) between 1 and 100),
  body text check (char_length(body) <= 500),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications: everyone reads" on public.notifications;
create policy "notifications: everyone reads" on public.notifications
  for select to anon, authenticated using (true);

drop policy if exists "notifications: admin insert" on public.notifications;
create policy "notifications: admin insert" on public.notifications
  for insert to authenticated with check (public.is_admin());

drop policy if exists "notifications: admin delete" on public.notifications;
create policy "notifications: admin delete" on public.notifications
  for delete to authenticated using (public.is_admin());

-- Live delivery of new announcements to everyone on the site.
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

-- ─────────────────────────────────────────────────────────────
-- Make the admin (after adding the user in Authentication → Users):
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- ─────────────────────────────────────────────────────────────
