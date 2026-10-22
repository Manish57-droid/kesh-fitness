-- Kesh Fitness · migration 013: delete transactions
-- Run AFTER 012_online_renewal.sql. Paste into Supabase → SQL Editor → New query → Run.
-- Safe to run again.
--
-- • Admin → Transactions → "Delete": removes a transaction for good. If it isn't cancelled
--   yet it is cancelled first, so a paid monthly bill still rolls the member's due date back.
-- • "Delete all cancelled": clears every cancelled transaction in the list you're viewing.
-- Deleted transactions are gone from reports and totals and can't be brought back.

create or replace function public.admin_delete_order(p_id bigint)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'Only admins can delete transactions.'; end if;
  if not exists (select 1 from public.orders where id = p_id) then return; end if;
  perform public.admin_set_order_status(p_id, 'cancelled');
  delete from public.orders where id = p_id;
end;
$$;
grant execute on function public.admin_delete_order(bigint) to authenticated;

-- Only cancelled transactions among p_ids are deleted. Returns how many.
create or replace function public.admin_delete_cancelled_orders(p_ids bigint[])
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  if not public.is_admin() then raise exception 'Only admins can delete transactions.'; end if;
  delete from public.orders where id = any(p_ids) and status = 'cancelled';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;
grant execute on function public.admin_delete_cancelled_orders(bigint[]) to authenticated;
