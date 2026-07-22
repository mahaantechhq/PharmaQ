-- Previously an invoice was only created when an order moved all the way
-- to the separate "invoiced" status (a manual step after acceptance). Now
-- accepting an order creates its invoice immediately, in the same
-- transaction as the stock deduction and status update -- the order's
-- fulfillment status still becomes "accepted" (not "invoiced"), since that
-- remains its own later step in the pipeline; this just means the invoice
-- itself exists and is visible in Invoices as soon as an order is accepted,
-- rather than waiting on that separate step.
--
-- The later transition_supplier_order_status("invoiced") case still has its
-- own "on conflict (supplier_order_id) do nothing" insert, so it's a safe
-- no-op once the invoice already exists from acceptance.
create or replace function accept_supplier_order(p_supplier_order_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_order record;
  v_item record;
begin
  select * into v_order
  from supplier_orders
  where id = p_supplier_order_id
    and supplier_business_id = current_business_id()
    and status = 'placed'
  for update;

  if not found then
    raise exception 'Order not found or already processed';
  end if;

  for v_item in
    select product_id, quantity from supplier_order_items
    where supplier_order_id = p_supplier_order_id
  loop
    perform deduct_stock_fifo(v_item.product_id, v_item.quantity);
  end loop;

  update supplier_orders
  set status = 'accepted', updated_at = now()
  where id = p_supplier_order_id;

  insert into order_status_history (supplier_order_id, status, changed_by)
  values (p_supplier_order_id, 'accepted', auth.uid());

  insert into invoices (supplier_order_id, invoice_number, subtotal, tax_total, grand_total)
  values (p_supplier_order_id, 'INV-' || v_order.order_number, v_order.subtotal, v_order.tax_total, v_order.grand_total)
  on conflict (supplier_order_id) do nothing;
end;
$$;
