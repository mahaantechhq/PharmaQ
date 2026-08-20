-- placeOrder() previously called this RPC, then made a second, separate
-- round trip to delete the buyer's cart_items -- an extra sequential
-- network hop on an already-slow path, and a latent correctness gap: if
-- that second call ever failed after the order was successfully created,
-- the order would exist but the cart would stay full, letting the buyer
-- re-submit the same items. Folding the delete into this function makes
-- it part of the same transaction (atomic with the order creation) and
-- removes a whole round trip from every "Place order" click.

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
  v_order_number := 'PQ-' || lpad(nextval('order_number_seq')::text, 3, '0');

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
