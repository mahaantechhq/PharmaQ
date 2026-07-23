-- Offers were previously display-only: the "X% OFF" badge shown on the
-- marketplace never actually reduced what a buyer was charged. This adds
-- columns to record the discount actually applied at checkout (per supplier
-- order and on the master order) and updates create_order_with_splits to
-- accept and persist it.

alter table orders add column discount_total numeric(12, 2) not null default 0;
alter table supplier_orders add column discount_total numeric(12, 2) not null default 0;
alter table supplier_orders add column offer_id uuid references offers (id) on delete set null;

drop function if exists create_order_with_splits(uuid, numeric, numeric, numeric, jsonb);

create function create_order_with_splits(
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

  return query select v_order_id, v_order_number;
end;
$$;
