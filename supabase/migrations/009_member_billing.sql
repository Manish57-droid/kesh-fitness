-- Kesh Fitness · migration 009: monthly bills for members
-- Run AFTER 008_gym_location.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- • Admin → Active Members → "Renew / Bill": records a paid monthly fee (optionally with
--   shop products), updates the member's due date, and shows up in Transactions.
-- • Confirmed join-form payments now also show up in Transactions.
-- All money is kept in the `orders` table, so monthly totals include everything.

-- ── Orders can now hold several lines (monthly fee + products) ─────────────────
alter table public.orders
  add column if not exists kind text not null default 'product' check (kind in ('product', 'bill', 'membership')),
  add column if not exists member_id bigint references public.members (id) on delete set null,
  add column if not exists items jsonb,          -- [{ name, qty, unit_price, amount }]; null = single product
  add column if not exists period_start date,    -- membership period paid for
  add column if not exists period_end date;      -- = member's next due date

create index if not exists orders_member_idx on public.orders (member_id, created_at desc);

-- Plan display name from the admin-edited website content, with fallbacks.
create or replace function public.plan_name(p_plan text)
returns text
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select item ->> 'name'
     from public.site_content sc, jsonb_array_elements(coalesce(sc.data -> 'plans' -> 'items', '[]'::jsonb)) as item
     where sc.key = 'home' and item ->> 'id' = p_plan
     limit 1),
    case p_plan when 'gym' then 'Gym' when 'cardio' then 'Gym + Cardio' when 'personal' then 'Personal Training' else p_plan end
  );
$$;

-- ── Admin records a monthly bill ───────────────────────────────────────────────
-- p_items: [{ "product_id": 6, "qty": 2 }, …]. Product prices come from the products table.
-- ₹1 service charge only when at least one product is included.
create or replace function public.admin_create_bill(
  p_member_id bigint,
  p_plan text,
  p_monthly_fee integer,
  p_months integer,
  p_period_start date,
  p_joined_on date,
  p_items jsonb,
  p_method text,
  p_utr text
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
begin
  if not public.is_admin() then raise exception 'Only admins can create bills.'; end if;

  select * into v_member from public.members where id = p_member_id for update;
  if not found then raise exception 'Member not found.'; end if;
  if p_plan not in ('gym', 'cardio', 'personal') then raise exception 'Choose a plan.'; end if;
  if p_months is null or p_months < 0 or p_months > 12 then raise exception 'Months must be between 0 and 12.'; end if;
  if p_monthly_fee is null or p_monthly_fee < 0 then raise exception 'Enter the monthly fee.'; end if;
  if p_method not in ('upi', 'cash') then raise exception 'Choose cash or UPI.'; end if;
  if v_utr is not null and v_utr !~ '^[A-Z0-9]{10,22}$' then raise exception 'UTR should be 10–22 letters/numbers.'; end if;
  if p_months > 0 and p_period_start is null then raise exception 'Choose the period start date.'; end if;

  -- Monthly fee line
  if p_months > 0 then
    v_period_end := (p_period_start + make_interval(months => p_months))::date;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'name', 'Monthly fee – ' || public.plan_name(p_plan) || ' (' || to_char(p_period_start, 'DD Mon YYYY') || ' to ' || to_char(v_period_end, 'DD Mon YYYY') || ')',
      'qty', p_months, 'unit_price', p_monthly_fee, 'amount', p_monthly_fee * p_months
    ));
    v_subtotal := v_subtotal + p_monthly_fee * p_months;
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

  if jsonb_array_length(v_lines) = 0 then raise exception 'Add at least one month or one product.'; end if;
  if v_count > 0 then v_service := 1; end if;  -- keep in sync with `serviceCharge` in lib/site.ts

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
      v_member.name, v_member.phone, null,
      case
        when p_months > 0 and v_count > 0 then 'Monthly fee + ' || v_count || ' product' || case when v_count > 1 then 's' else '' end
        when p_months > 0 then 'Monthly fee – ' || public.plan_name(p_plan)
        else v_count || ' product' || case when v_count > 1 then 's' else '' end
      end,
      v_subtotal, 1, v_subtotal, v_service, v_subtotal + v_service, p_method, 'paid', v_utr, now(), auth.uid()
    )
    returning o.receipt_no, o.token;
end;
$$;

grant execute on function public.admin_create_bill(bigint, text, integer, integer, date, date, jsonb, text, text) to authenticated;

-- ── Join-form payments also go into Transactions ───────────────────────────────
create or replace function public.admin_confirm_join_payment(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_req public.join_requests%rowtype;
  v_fees record;
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_member_id bigint;
  v_joining integer;
  v_monthly integer;
begin
  if not public.is_admin() then raise exception 'Only admins can confirm payments.'; end if;

  select * into v_req from public.join_requests where id = p_id for update;
  if not found then raise exception 'Join request not found.'; end if;
  if v_req.payment_status = 'paid' then return; end if;

  select * into v_fees from public.plan_fees(v_req.plan);
  v_joining := coalesce(v_req.joining_fee, v_fees.joining_fee);
  v_monthly := coalesce(v_req.monthly_fee, v_fees.monthly_fee);

  update public.join_requests
    set payment_status = 'paid',
        paid_at = now(),
        status = 'joined',
        payment_method = coalesce(payment_method, 'cash'),
        joining_fee = v_joining,
        monthly_fee = v_monthly,
        amount = v_joining + v_monthly
  where id = p_id;

  select id into v_member_id from public.members where join_request_id = p_id;
  if v_member_id is null then
    insert into public.members (name, phone, address, email, age, gender, plan, joined_on, paid_until, join_request_id)
    values (
      v_req.name, v_req.phone, coalesce(nullif(trim(v_req.area), ''), 'Not provided'), v_req.email, v_req.age,
      v_req.gender, v_req.plan, v_today, (v_today + interval '1 month')::date, p_id
    )
    returning id into v_member_id;
  end if;

  insert into public.orders (
    kind, member_id, items, period_start, period_end,
    customer_name, customer_phone, product_id, product_name, unit_price, quantity,
    subtotal, service_charge, total, payment_method, status, utr, paid_at, confirmed_by
  )
  values (
    'membership', v_member_id,
    jsonb_build_array(
      jsonb_build_object('name', 'Joining fee (one-time)', 'qty', 1, 'unit_price', v_joining, 'amount', v_joining),
      jsonb_build_object('name', 'Monthly fee – ' || public.plan_name(v_req.plan) || ' (first month)', 'qty', 1, 'unit_price', v_monthly, 'amount', v_monthly)
    ),
    v_today, (v_today + interval '1 month')::date,
    v_req.name, v_req.phone, null, 'New membership – ' || public.plan_name(v_req.plan), v_joining + v_monthly, 1,
    v_joining + v_monthly, 0, v_joining + v_monthly, coalesce(v_req.payment_method, 'cash'), 'paid', v_req.utr, now(), auth.uid()
  );
end;
$$;

-- ── Cancelling a bill rolls the member's due date back ─────────────────────────
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
    if v_order.status = 'cancelled' then return; end if;
    update public.orders set status = 'cancelled' where id = p_id;
    -- Undo the months this bill added, if it's still the member's latest payment.
    if v_order.member_id is not null and v_order.period_end is not null and v_order.period_start is not null then
      update public.members
        set paid_until = v_order.period_start
      where id = v_order.member_id and paid_until = v_order.period_end;
    end if;

  else
    raise exception 'Invalid status.';
  end if;
end;
$$;

-- ── Receipts can show several lines and the period paid for ────────────────────
drop function if exists public.get_order(uuid);
create function public.get_order(p_token uuid)
returns table (
  receipt_no text, customer_name text, customer_phone text, product_name text,
  unit_price integer, quantity integer, subtotal integer, service_charge integer, total integer,
  payment_method text, status text, utr text, paid_at timestamptz, created_at timestamptz,
  kind text, items jsonb, period_start date, period_end date
)
language sql stable security definer set search_path = public as $$
  select o.receipt_no, o.customer_name, o.customer_phone, o.product_name,
         o.unit_price, o.quantity, o.subtotal, o.service_charge, o.total,
         o.payment_method, o.status, o.utr, o.paid_at, o.created_at,
         o.kind, o.items, o.period_start, o.period_end
  from public.orders o
  where o.token = p_token;
$$;
grant execute on function public.get_order(uuid) to anon, authenticated;
