-- Kesh Fitness · migration 011: on/off switch for existing-member sign-up, 24-month transaction history
-- Run AFTER 010_existing_members.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- • Admin → Active Members has a switch for the join form's "Already a member" option.
--   When it's off, the option is hidden and the database also refuses those sign-ups.
-- • Transactions are kept for the current month plus the 24 months before it. When a new
--   month starts, the oldest month is deleted (e.g. on 1 Nov 2028, October 2026 goes).
--   Download a month's report (Admin → Transactions → Monthly report) before then.

-- ── Existing-member sign-up switch ─────────────────────────────────────────────
-- Stored in the website content as plans.existingMembers (missing = on).
create or replace function public.existing_signup_open()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (data -> 'plans' ->> 'existingMembers')::boolean from public.site_content where key = 'home'), true);
$$;

create or replace function public.admin_set_existing_signup(p_open boolean)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can change this.'; end if;
  insert into public.site_content (key, data)
  values ('home', jsonb_build_object('plans', jsonb_build_object('existingMembers', p_open)))
  on conflict (key) do update
    set data = jsonb_set(
      public.site_content.data,
      '{plans}',
      coalesce(public.site_content.data -> 'plans', '{}'::jsonb) || jsonb_build_object('existingMembers', p_open)
    );
end;
$$;

grant execute on function public.admin_set_existing_signup(boolean) to authenticated;

-- Same as migration 010, plus the switch check.
create or replace function public.submit_existing_member(
  p_name text, p_phone text, p_email text, p_age integer, p_gender text, p_plan text,
  p_area text, p_joined_on date, p_notes text
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_digits text := right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10);
begin
  if not public.existing_signup_open() then
    raise exception 'Online sign-up for existing members is closed right now. Please contact the gym.';
  end if;
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Please enter your name.'; end if;
  if trim(coalesce(p_phone, '')) !~ '^[0-9+ \-]{10,15}$' then raise exception 'Please enter a valid mobile number.'; end if;
  if char_length(trim(coalesce(p_area, ''))) = 0 then raise exception 'Please enter your address.'; end if;
  if p_plan not in ('gym', 'cardio', 'personal') then raise exception 'Please choose your current plan.'; end if;
  if p_age is not null and (p_age < 10 or p_age > 90) then raise exception 'Age should be between 10 and 90.'; end if;
  if p_joined_on is not null and (p_joined_on > v_today or p_joined_on < date '2000-01-01') then
    raise exception 'Please check the date you joined the gym.';
  end if;

  if exists (
    select 1 from public.members m
    where right(regexp_replace(m.phone, '\D', '', 'g'), 10) = v_digits
  ) then
    raise exception 'This mobile number is already on our members list. Please contact the gym if your details need changing.';
  end if;

  insert into public.members (name, phone, address, email, age, gender, plan, joined_on, paid_until, notes, self_registered)
  values (
    left(trim(p_name), 60), trim(p_phone), left(trim(p_area), 200), nullif(left(trim(coalesce(p_email, '')), 100), ''), p_age,
    nullif(p_gender, ''), p_plan, coalesce(p_joined_on, v_today), null, nullif(left(trim(coalesce(p_notes, '')), 500), ''), true
  );
end;
$$;

-- ── Keep 24 months of transactions ─────────────────────────────────────────────
-- Oldest kept moment: the 1st of the month 24 months ago, midnight India time.
-- Keep in sync with `keepFromMonth` in lib/format.ts.
create or replace function public.orders_keep_from()
returns timestamptz
language sql stable set search_path = public as $$
  select (date_trunc('month', now() at time zone 'Asia/Kolkata') - interval '24 months') at time zone 'Asia/Kolkata';
$$;

-- Deletes older transactions. Returns how many were removed.
create or replace function public.purge_old_orders()
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  delete from public.orders where created_at < public.orders_keep_from();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.purge_old_orders() from public, anon, authenticated;

-- Same, for the admin. The Transactions page calls it in case the daily job below isn't available.
create or replace function public.admin_purge_old_orders()
returns integer
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can do this.'; end if;
  return public.purge_old_orders();
end;
$$;

grant execute on function public.admin_purge_old_orders() to authenticated;

-- Daily at 1:00 AM India time (19:30 UTC), using Supabase's pg_cron.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule('kesh-purge-old-orders', '30 19 * * *', $cmd$select public.purge_old_orders()$cmd$);
exception when others then
  raise notice 'Daily clean-up not scheduled (%). Old transactions will be removed when the admin opens Transactions.', sqlerrm;
end;
$$;

-- Clean up anything already older than 24 months.
select public.purge_old_orders();
