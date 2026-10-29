-- Stock was only ever deducted inside accept_supplier_order() -- but the
-- "Accept" button (and the whole placed -> accepted -> ... -> delivered
-- chain) has no UI left anywhere in business-admin, so that function is now
-- unreachable and stock has silently stopped decreasing on every order,
-- in both the marketplace's stock display and business-admin's product
-- edit page (they read the same product_batches.stock_qty this deducts).
--
-- Move the deduction to order placement itself, where it now actually
-- belongs given there's no separate acceptance step left in the workflow.
-- Also strip the now-redundant deduction out of accept_supplier_order so
-- it can't double-deduct if an Accept button is ever reintroduced later.

create or replace function create_order_with_splits(
  p_buyer_business_id uuid,
  p_subtotal numeric,
  p_tax_total numeric,
  p_discount_total numeric,
  p_grand_total numeric,
  p_supplier_orders jsonb
)
returns table (id uuid, order_number text)
language plpgsql
security invoker
as $$
declare
  v_order_id uuid;
  v_order_number text;
  v_supplier_order jsonb;
  v_supplier_order_id uuid;
  v_item jsonb;
begin
  v_order_number := 'PQ-' || nextval('order_number_seq')::text;

  insert into orders (order_number, buyer_business_id, subtotal, tax_total, discount_total, grand_total)
  values (v_order_number, p_buyer_business_id, p_subtotal, p_tax_total, p_discount_total, p_grand_total)
  returning orders.id into v_order_id;

  for v_supplier_order in select * from jsonb_array_elements(p_supplier_orders)
  loop
    insert into supplier_orders (
      order_id, order_number, supplier_business_id, buyer_business_id,
      status, subtotal, tax_total, discount_total, offer_id, grand_total
    )
    values (
      v_order_id,
      v_order_number,
      (v_supplier_order->>'supplierBusinessId')::uuid,
      p_buyer_business_id,
      'placed',
      (v_supplier_order->>'subtotal')::numeric,
      (v_supplier_order->>'taxTotal')::numeric,
      coalesce((v_supplier_order->>'discountTotal')::numeric, 0),
      nullif(v_supplier_order->>'offerId', '')::uuid,
      (v_supplier_order->>'grandTotal')::numeric
    )
    returning supplier_orders.id into v_supplier_order_id;

    for v_item in select * from jsonb_array_elements(v_supplier_order->'items')
    loop
      insert into supplier_order_items (
        supplier_order_id, product_id, batch_id, product_name, batch_number,
        quantity, unit_price, gst_rate, line_total
      )
      values (
        v_supplier_order_id,
        (v_item->>'productId')::uuid,
        nullif(v_item->>'batchId', '')::uuid,
        v_item->>'productName',
        v_item->>'batchNumber',
        (v_item->>'quantity')::int,
        (v_item->>'unitPrice')::numeric,
        (v_item->>'gstRate')::numeric,
        (v_item->>'lineTotal')::numeric
      );

      perform deduct_stock_fifo((v_item->>'productId')::uuid, (v_item->>'quantity')::int);
    end loop;

    insert into order_status_history (supplier_order_id, status)
    values (v_supplier_order_id, 'placed');

    insert into notifications (business_id, title, message, type)
    values (
      (v_supplier_order->>'supplierBusinessId')::uuid,
      'New order received',
      v_supplier_order->>'notificationMessage',
      'order'
    );
  end loop;

  delete from cart_items where buyer_business_id = p_buyer_business_id;

  return query select v_order_id, v_order_number;
end;
$$;

create or replace function accept_supplier_order(p_supplier_order_id uuid)
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
    and supplier_business_id = current_business_id()
    and status = 'placed'
  for update;

  if not found then
    raise exception 'Order not found or already processed';
  end if;

  -- Stock is now deducted at order placement (create_order_with_splits),
  -- not here -- deducting it again on accept would double-count it.

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
