-- Same bug family as 0037: invoice generation only ever fired on the old
-- 'invoiced' status step (part of the placed -> accepted -> invoiced ->
-- ... chain) or inside accept_supplier_order() -- both unreachable now that
-- those buttons are gone. The only transition business-admin can still
-- trigger is "Complete", so generate the invoice there instead.

create or replace function transition_supplier_order_status(
  p_supplier_order_id uuid,
  p_expected_status supplier_order_status,
  p_next_status supplier_order_status,
  p_note text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_order record;
begin
  select * into v_order
  from supplier_orders
  where id = p_supplier_order_id
    and (supplier_business_id = current_business_id() or buyer_business_id = current_business_id())
    and status = p_expected_status
  for update;

  if not found then
    raise exception 'Order not found or status changed since you loaded this page';
  end if;

  update supplier_orders
  set status = p_next_status, updated_at = now()
  where id = p_supplier_order_id;

  insert into order_status_history (supplier_order_id, status, note, changed_by)
  values (p_supplier_order_id, p_next_status, p_note, auth.uid());

  if p_next_status = 'invoiced' or p_next_status = 'completed' then
    insert into invoices (supplier_order_id, invoice_number, subtotal, tax_total, grand_total)
    values (p_supplier_order_id, 'INV-' || v_order.order_number, v_order.subtotal, v_order.tax_total, v_order.grand_total)
    on conflict (supplier_order_id) do nothing;
  end if;
end;
$$;
