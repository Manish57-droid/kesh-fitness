-- Kesh Fitness · migration 010: existing members sign up online, joining fee on bills
-- Run AFTER 009_member_billing.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- • Join form → "Already a member": people who already train at the gym add their details
--   without paying. They go straight into Active Members (marked "Joined online") with no
--   fees recorded; the admin sets their fees with Renew / Bill.
-- • Renew / Bill can now include the one-time joining fee, for anyone who should have paid
--   it (e.g. a new member who picked "Already a member" by mistake).

-- ── Members who signed themselves up ───────────────────────────────────────────
alter table public.members
  add column if not exists self_registered boolean not null default false;

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

grant execute on function public.submit_existing_member(text, text, text, integer, text, text, text, date, text) to anon, authenticated;

-- ── Bills can include the one-time joining fee ─────────────────────────────────
drop function if exists public.admin_create_bill(bigint, text, integer, integer, date, date, jsonb, text, text);

create or replace function public.admin_create_bill(
  p_member_id bigint,
  p_plan text,
  p_monthly_fee integer,
  p_months integer,
  p_period_start date,
  p_joined_on date,
  p_items jsonb,
  p_method text,
  p_utr text,
  p_joining_fee integer default 0
)
returns table (receipt_no text, token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_member public.members%rowtype;
  v_lines jsonb := '[]'::jsonb;
  v_subtotal integer := 0;
  v_service integer := 0;
  v_period_end date;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_utr text := nullif(upper(regexp_replace(coalesce(p_utr, ''), '\s', '', 'g')), '');
  v_count integer := 0;
  v_joining integer := coalesce(p_joining_fee, 0);
  v_parts text[] := '{}';
begin
  if not public.is_admin() then raise exception 'Only admins can create bills.'; end if;

  select * into v_member from public.members where id = p_member_id for update;
  if not found then raise exception 'Member not found.'; end if;
  if p_plan not in ('gym', 'cardio', 'personal') then raise exception 'Choose a plan.'; end if;
  if p_months is null or p_months < 0 or p_months > 12 then raise exception 'Months must be between 0 and 12.'; end if;
  if p_monthly_fee is null or p_monthly_fee < 0 then raise exception 'Enter the monthly fee.'; end if;
  if v_joining < 0 then raise exception 'Joining fee can''t be negative.'; end if;
  if p_method not in ('upi', 'cash') then raise exception 'Choose cash or UPI.'; end if;
  if v_utr is not null and v_utr !~ '^[A-Z0-9]{10,22}$' then raise exception 'UTR should be 10–22 letters/numbers.'; end if;
  if p_months > 0 and p_period_start is null then raise exception 'Choose the period start date.'; end if;

  -- Joining fee line
  if v_joining > 0 then
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'name', 'Joining fee (one-time)', 'qty', 1, 'unit_price', v_joining, 'amount', v_joining
    ));
    v_subtotal := v_subtotal + v_joining;
    v_parts := v_parts || 'Joining fee';
  end if;

  -- Monthly fee line
  if p_months > 0 then
    v_period_end := (p_period_start + make_interval(months => p_months))::date;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'name', 'Monthly fee – ' || public.plan_name(p_plan) || ' (' || to_char(p_period_start, 'DD Mon YYYY') || ' to ' || to_char(v_period_end, 'DD Mon YYYY') || ')',
      'qty', p_months, 'unit_price', p_monthly_fee, 'amount', p_monthly_fee * p_months
    ));
    v_subtotal := v_subtotal + p_monthly_fee * p_months;
    v_parts := v_parts || case
      when p_months > 1 then 'Monthly fee × ' || p_months || ' – ' || public.plan_name(p_plan)
      else 'Monthly fee – ' || public.plan_name(p_plan)
    end;
  end if;

  -- Product lines
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_qty := coalesce((v_item ->> 'qty')::integer, 0);
    continue when v_qty < 1;
    if v_qty > 50 then raise exception 'Product quantity can be at most 50.'; end if;
    select * into v_product from public.products where id = (v_item ->> 'product_id')::bigint;
    if not found then raise exception 'A selected product no longer exists.'; end if;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'name', v_product.name, 'qty', v_qty, 'unit_price', v_product.price, 'amount', v_product.price * v_qty,
      'product_id', v_product.id
    ));
    v_subtotal := v_subtotal + v_product.price * v_qty;
    v_count := v_count + 1;
  end loop;

  if jsonb_array_length(v_lines) = 0 then raise exception 'Add the joining fee, at least one month or one product.'; end if;
  if v_count > 0 then
    v_service := 1;  -- keep in sync with `serviceCharge` in lib/site.ts
    v_parts := v_parts || (v_count || ' product' || case when v_count > 1 then 's' else '' end);
  end if;

  if p_months > 0 then
    update public.members
      set plan = p_plan,
          joined_on = coalesce(p_joined_on, joined_on),
          paid_until = v_period_end,
          is_active = true
    where id = p_member_id;
  elsif p_joined_on is not null then
    update public.members set joined_on = p_joined_on where id = p_member_id;
  end if;

  return query
    insert into public.orders as o (
      kind, member_id, items, period_start, period_end,
      customer_name, customer_phone, product_id, product_name, unit_price, quantity,
      subtotal, service_charge, total, payment_method, status, utr, paid_at, confirmed_by
    )
    values (
      'bill', p_member_id, v_lines, case when p_months > 0 then p_period_start end, v_period_end,
      v_member.name, v_member.phone, null, array_to_string(v_parts, ' + '),
      v_subtotal, 1, v_subtotal, v_service, v_subtotal + v_service, p_method, 'paid', v_utr, now(), auth.uid()
    )
    returning o.receipt_no, o.token;
end;
$$;

grant execute on function public.admin_create_bill(bigint, text, integer, integer, date, date, jsonb, text, text, integer) to authenticated;
