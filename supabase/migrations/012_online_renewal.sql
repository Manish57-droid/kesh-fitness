-- Kesh Fitness · migration 012: members renew their monthly fee online
-- Run AFTER 011_signup_switch_retention.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- • Website → "Renew" (/renew): a member enters their mobile number, picks how many months
--   and pays by UPI (or cash at the counter). This creates an unpaid monthly-fee bill.
-- • Admin → Transactions: marking that bill paid moves the member's due date forward.
--   Nothing changes on the member until the admin confirms the payment.
-- • Cancelling a bill now only rolls the due date back if the bill had been paid.

-- Same digits-only match the join form uses for duplicate numbers.
create or replace function public.member_by_phone(p_phone text)
returns public.members
language sql stable security definer set search_path = public as $$
  select m.* from public.members m
  where right(regexp_replace(m.phone, '\D', '', 'g'), 10) = right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)
    and char_length(right(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g'), 10)) = 10
  order by m.is_active desc, m.id desc
  limit 1;
$$;
revoke all on function public.member_by_phone(text) from public, anon, authenticated;

-- Where an online renewal starts: the current due date, or today for members never billed.
create or replace function public.renewal_start(p_paid_until date)
returns date
language sql stable set search_path = public as $$
  select coalesce(p_paid_until, (now() at time zone 'Asia/Kolkata')::date);
$$;

-- ── Member looks themselves up ─────────────────────────────────────────────────
-- Only what the renew page needs: first name, plan, fee and due date.
create or replace function public.get_renewal_info(p_phone text)
returns table (first_name text, plan text, plan_name text, monthly_fee integer, paid_until date, period_start date, has_open_bill boolean)
language plpgsql stable security definer set search_path = public as $$
declare
  v_member public.members%rowtype;
  v_plan text;
begin
  v_member := public.member_by_phone(p_phone);
  if v_member.id is null then
    raise exception 'We couldn''t find a member with this mobile number. Use the number you gave the gym, or ask at the counter.';
  end if;
  v_plan := coalesce(v_member.plan, 'gym');

  return query
    select split_part(trim(v_member.name), ' ', 1), v_plan, public.plan_name(v_plan),
           (select f.monthly_fee from public.plan_fees(v_plan) f),
           v_member.paid_until, public.renewal_start(v_member.paid_until),
           exists (select 1 from public.orders o where o.member_id = v_member.id and o.kind = 'bill' and o.status = 'verifying');
end;
$$;
grant execute on function public.get_renewal_info(text) to anon, authenticated;

-- ── Member creates an unpaid renewal bill ──────────────────────────────────────
-- The fee comes from the website prices (Admin → Website → Plans). An older unpaid renewal
-- for the same member (no UTR entered) is replaced, so retrying doesn't pile up bills.
create or replace function public.create_renewal(p_phone text, p_months integer, p_method text)
returns table (receipt_no text, token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_member public.members%rowtype;
  v_plan text;
  v_fee integer;
  v_start date;
  v_end date;
  v_label text;
begin
  if p_months is null or p_months < 1 or p_months > 12 then raise exception 'Choose between 1 and 12 months.'; end if;
  if p_method not in ('upi', 'cash') then raise exception 'Choose UPI or cash.'; end if;

  v_member := public.member_by_phone(p_phone);
  if v_member.id is null then
    raise exception 'We couldn''t find a member with this mobile number. Use the number you gave the gym, or ask at the counter.';
  end if;
  perform 1 from public.members where id = v_member.id for update;

  if exists (select 1 from public.orders o where o.member_id = v_member.id and o.kind = 'bill' and o.status = 'verifying') then
    raise exception 'Your last payment is still being checked by the gym. Please wait for it to be confirmed.';
  end if;

  update public.orders o set status = 'cancelled'
  where o.member_id = v_member.id and o.kind = 'bill' and o.status = 'pending' and o.confirmed_by is null;

  v_plan := coalesce(v_member.plan, 'gym');
  select f.monthly_fee into v_fee from public.plan_fees(v_plan) f;
  v_start := public.renewal_start(v_member.paid_until);
  v_end := (v_start + make_interval(months => p_months))::date;
  v_label := case
    when p_months > 1 then 'Monthly fee × ' || p_months || ' – ' || public.plan_name(v_plan)
    else 'Monthly fee – ' || public.plan_name(v_plan)
  end;

  return query
    insert into public.orders as o (
      kind, member_id, items, period_start, period_end,
      customer_name, customer_phone, product_id, product_name, unit_price, quantity,
      subtotal, service_charge, total, payment_method
    )
    values (
      'bill', v_member.id,
      -- No dates in the line name: the period can move if the admin confirms after another bill.
      jsonb_build_array(jsonb_build_object(
        'name', 'Monthly fee – ' || public.plan_name(v_plan), 'qty', p_months, 'unit_price', v_fee, 'amount', v_fee * p_months, 'plan', v_plan
      )),
      v_start, v_end,
      left(v_member.name, 60), v_member.phone, null, v_label, v_fee * p_months, 1,
      v_fee * p_months, 0, v_fee * p_months, p_method
    )
    returning o.receipt_no, o.token;
end;
$$;
grant execute on function public.create_renewal(text, integer, text) to anon, authenticated;

-- ── Confirming a bill updates the member; cancelling only undoes paid bills ────
create or replace function public.admin_set_order_status(p_id bigint, p_status text)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders%rowtype;
  v_paid_until date;
  v_months integer;
  v_start date;
  v_end date;
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

    -- Online renewal: extend the member now that the money is in.
    if v_order.kind = 'bill' and v_order.member_id is not null and v_order.period_start is not null and v_order.period_end is not null then
      select paid_until into v_paid_until from public.members where id = v_order.member_id for update;
      v_start := v_order.period_start;
      v_end := v_order.period_end;
      -- Already renewed past this bill's start (e.g. the admin billed them meanwhile): add the months on top.
      if v_paid_until is not null and v_paid_until > v_start then
        v_months := coalesce((v_order.items -> 0 ->> 'qty')::integer, 1);
        v_start := v_paid_until;
        v_end := (v_start + make_interval(months => v_months))::date;
        update public.orders set period_start = v_start, period_end = v_end where id = p_id;
      end if;
      update public.members
        set paid_until = v_end,
            plan = coalesce(v_order.items -> 0 ->> 'plan', plan),
            is_active = true
      where id = v_order.member_id;
    end if;

  elsif p_status = 'cancelled' then
    if v_order.status = 'cancelled' then return; end if;
    update public.orders set status = 'cancelled' where id = p_id;
    -- Undo the months a paid bill added, if it's still the member's latest payment.
    if v_order.status = 'paid' and v_order.member_id is not null and v_order.period_end is not null and v_order.period_start is not null then
      update public.members
        set paid_until = v_order.period_start
      where id = v_order.member_id and paid_until = v_order.period_end;
    end if;

  else
    raise exception 'Invalid status.';
  end if;
end;
$$;

grant execute on function public.admin_set_order_status(bigint, text) to authenticated;
