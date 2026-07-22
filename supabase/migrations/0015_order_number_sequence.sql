-- Replace the app-side "count existing orders, retry on collision" order
-- number generation with a real Postgres sequence: nextval() is a single
-- atomic operation with no read-then-write race window (unlike counting
-- rows), and it doesn't get slower as the orders table grows (unlike
-- select count(*)). The number is now generated inside the same
-- transaction as everything else, instead of being computed by the app
-- and passed in.

create sequence if not exists order_number_seq start 1;

drop function if exists create_order_with_splits(text, uuid, numeric, numeric, numeric, jsonb);

create function create_order_with_splits(
  p_buyer_business_id uuid,
  p_subtotal numeric,
  p_tax_total numeric,
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
  v_order_number := 'PQ-' || lpad(nextval('order_number_seq')::text, 3, '0');

  insert into orders (order_number, buyer_business_id, subtotal, tax_total, grand_total)
  values (v_order_number, p_buyer_business_id, p_subtotal, p_tax_total, p_grand_total)
  returning orders.id into v_order_id;

  for v_supplier_order in select * from jsonb_array_elements(p_supplier_orders)
  loop
    insert into supplier_orders (
      order_id, order_number, supplier_business_id, buyer_business_id,
      status, subtotal, tax_total, grand_total
    )
    values (
      v_order_id,
      v_order_number,
      (v_supplier_order->>'supplierBusinessId')::uuid,
      p_buyer_business_id,
      'placed',
      (v_supplier_order->>'subtotal')::numeric,
      (v_supplier_order->>'taxTotal')::numeric,
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

  return query select v_order_id, v_order_number;
end;
$$;
