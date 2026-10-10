-- Kesh Fitness · migration 007: pay-to-join workflow and Personal Training plan
-- Run AFTER 006_site_content.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- New flow: visitor fills the join form → pays (UPI with UTR, or cash at the gym) →
-- admin confirms the payment → request becomes "joined" and the person is added to
-- Active Members with fees paid for the first month.

-- ── Personal Training plan ('personal') is allowed everywhere ───────────────────
alter table public.join_requests drop constraint if exists join_requests_plan_check;
alter table public.join_requests
  add constraint join_requests_plan_check check (plan in ('gym', 'cardio', 'personal'));

alter table public.members drop constraint if exists members_plan_check;
alter table public.members
  add constraint members_plan_check check (plan in ('gym', 'cardio', 'personal'));

-- ── Payment details on join requests ────────────────────────────────────────────
create sequence if not exists public.join_receipt_seq;

alter table public.join_requests
  add column if not exists token uuid not null default gen_random_uuid(),
  add column if not exists receipt_no text not null default (
    'KFM' || to_char(now() at time zone 'Asia/Kolkata', 'YYMMDD') || '-' ||
    lpad(nextval('public.join_receipt_seq')::text, 4, '0')
  ),
  add column if not exists joining_fee integer,
  add column if not exists monthly_fee integer,
  add column if not exists amount integer,
  add column if not exists payment_method text check (payment_method in ('upi', 'cash')),
  add column if not exists payment_status text not null default 'pending'
    check (payment_status in ('pending', 'verifying', 'paid', 'cancelled')),
  add column if not exists utr text check (utr ~ '^[A-Z0-9]{10,22}$'),
  add column if not exists paid_at timestamptz;

create unique index if not exists join_requests_token_key on public.join_requests (token);
create unique index if not exists join_requests_receipt_key on public.join_requests (receipt_no);

-- Requests marked "joined" before this migration count as paid.
update public.join_requests set payment_status = 'paid' where status = 'joined' and payment_status = 'pending';

-- Visitors now join through submit_join_request() so the amount is always set by the database.
drop policy if exists "join: anyone submits" on public.join_requests;
revoke insert on public.join_requests from anon, authenticated;

-- Fees from the admin-edited website content (Admin → Website), with fallbacks.
-- Fallbacks must match lib/content.ts defaults.
create or replace function public.plan_fees(p_plan text, out joining_fee integer, out monthly_fee integer)
language plpgsql stable security definer set search_path = public as $$
declare
  v_plans jsonb := (select data -> 'plans' from public.site_content where key = 'home');
begin
  joining_fee := coalesce((v_plans ->> 'joiningFee')::integer, 1000);
  select (item ->> 'monthly')::integer into monthly_fee
  from jsonb_array_elements(coalesce(v_plans -> 'items', '[]'::jsonb)) as item
  where item ->> 'id' = p_plan;
  monthly_fee := coalesce(monthly_fee, case p_plan when 'gym' then 500 when 'cardio' then 800 when 'personal' then 4000 end);
end;
$$;

-- Visitor submits the join form. Returns the receipt number and a secret token for the status page.
create or replace function public.submit_join_request(
  p_name text, p_phone text, p_email text, p_age integer, p_gender text, p_plan text,
  p_timing text, p_goal text, p_area text, p_notes text, p_method text
)
returns table (receipt_no text, token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_fees record;
begin
  if char_length(trim(coalesce(p_name, ''))) = 0 then raise exception 'Please enter your name.'; end if;
  if trim(coalesce(p_phone, '')) !~ '^[0-9+ \-]{10,15}$' then raise exception 'Please enter a valid mobile number.'; end if;
  if char_length(trim(coalesce(p_area, ''))) = 0 then raise exception 'Please enter your address.'; end if;
  if p_plan not in ('gym', 'cardio', 'personal') then raise exception 'Please choose a plan.'; end if;
  if p_method not in ('upi', 'cash') then raise exception 'Please choose how you will pay.'; end if;

  select * into v_fees from public.plan_fees(p_plan);

  return query
    insert into public.join_requests as j (
      name, phone, email, age, gender, plan, timing, goal, area, notes,
      payment_method, joining_fee, monthly_fee, amount
    )
    values (
      trim(p_name), trim(p_phone), nullif(trim(p_email), ''), p_age, nullif(p_gender, ''), p_plan,
      nullif(p_timing, ''), nullif(p_goal, ''), trim(p_area), nullif(trim(p_notes), ''),
      p_method, v_fees.joining_fee, v_fees.monthly_fee, v_fees.joining_fee + v_fees.monthly_fee
    )
    returning j.receipt_no, j.token;
end;
$$;

-- Visitor submits the UPI transaction ID after paying.
create or replace function public.submit_join_utr(p_token uuid, p_utr text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_utr text := upper(regexp_replace(coalesce(p_utr, ''), '\s', '', 'g'));
begin
  if v_utr !~ '^[A-Z0-9]{10,22}$' then
    raise exception 'Please enter the 12-digit UPI transaction ID (UTR) from your payment app.';
  end if;
  update public.join_requests
    set utr = v_utr, payment_status = 'verifying'
  where token = p_token and payment_method = 'upi' and payment_status in ('pending', 'verifying');
  if not found then raise exception 'This request can no longer be updated.'; end if;
end;
$$;

-- Visitor reads their own join request (status page / membership receipt).
create or replace function public.get_join_request(p_token uuid)
returns table (
  receipt_no text, name text, phone text, plan text, joining_fee integer, monthly_fee integer,
  amount integer, payment_method text, payment_status text, utr text, paid_at timestamptz,
  status text, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select j.receipt_no, j.name, j.phone, j.plan, j.joining_fee, j.monthly_fee, j.amount,
         j.payment_method, j.payment_status, j.utr, j.paid_at, j.status, j.created_at
  from public.join_requests j
  where j.token = p_token;
$$;

-- Admin confirms the payment: request becomes "joined" and the person is added to Active Members.
create or replace function public.admin_confirm_join_payment(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req public.join_requests%rowtype;
  v_fees record;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
begin
  if not public.is_admin() then raise exception 'Only admins can confirm payments.'; end if;

  select * into v_req from public.join_requests where id = p_id for update;
  if not found then raise exception 'Join request not found.'; end if;
  if v_req.payment_status = 'paid' then return; end if;

  select * into v_fees from public.plan_fees(v_req.plan);

  update public.join_requests
    set payment_status = 'paid',
        paid_at = now(),
        status = 'joined',
        payment_method = coalesce(payment_method, 'cash'),
        joining_fee = coalesce(joining_fee, v_fees.joining_fee),
        monthly_fee = coalesce(monthly_fee, v_fees.monthly_fee),
        amount = coalesce(amount, v_fees.joining_fee + v_fees.monthly_fee)
  where id = p_id;

  if not exists (select 1 from public.members where join_request_id = p_id) then
    insert into public.members (name, phone, address, email, age, gender, plan, joined_on, paid_until, join_request_id)
    values (
      v_req.name, v_req.phone, coalesce(nullif(trim(v_req.area), ''), 'Not provided'), v_req.email, v_req.age,
      v_req.gender, v_req.plan, v_today, (v_today + interval '1 month')::date, p_id
    );
  end if;
end;
$$;

-- Admin cancels a payment (e.g. never paid). The request stays so it can be followed up.
create or replace function public.admin_cancel_join_payment(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can update payments.'; end if;
  update public.join_requests set payment_status = 'cancelled' where id = p_id and payment_status <> 'paid';
end;
$$;

grant execute on function public.submit_join_request(text, text, text, integer, text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.submit_join_utr(uuid, text) to anon, authenticated;
grant execute on function public.get_join_request(uuid) to anon, authenticated;
grant execute on function public.admin_confirm_join_payment(bigint) to authenticated;
grant execute on function public.admin_cancel_join_payment(bigint) to authenticated;
