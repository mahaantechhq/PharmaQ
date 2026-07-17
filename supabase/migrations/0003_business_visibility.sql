-- A business must also be visible to any other business it has a
-- supplier_orders relationship with (as either buyer or supplier), so
-- order/invoice/customer views can show the counterparty's name.

create policy businesses_select_order_party on businesses
  for select using (
    exists (
      select 1 from supplier_orders so
      where (so.supplier_business_id = businesses.id and so.buyer_business_id = current_business_id())
         or (so.buyer_business_id = businesses.id and so.supplier_business_id = current_business_id())
    )
  );
