-- Kesh Fitness · migration 005: unlimited stock
-- Run AFTER 004_orders_gallery.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- The gym never runs out of stock, so orders no longer check or reduce stock, and no
-- product is ever shown as out of stock. To take a product off the website, hide it.
-- (The old products.quantity / in_stock columns are kept but no longer used.)

update public.products set in_stock = true where not in_stock;

-- Same as in 004, minus the stock check and stock update.
create or replace function public.place_order(
  p_product_id bigint, p_quantity integer, p_method text, p_name text, p_phone text
)
returns table (receipt_no text, token uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_product public.products%rowtype;
  v_service integer := 1;  -- ₹1 per order; keep in sync with `serviceCharge` in lib/site.ts
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

  select * into v_product from public.products where id = p_product_id and is_active;
  if not found then
    raise exception 'This product is no longer available.';
  end if;

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

-- Same as in 004, but cancelling no longer returns stock.
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
    update public.orders set status = 'cancelled' where id = p_id and status <> 'cancelled';

  else
    raise exception 'Invalid status.';
  end if;
end;
$$;
