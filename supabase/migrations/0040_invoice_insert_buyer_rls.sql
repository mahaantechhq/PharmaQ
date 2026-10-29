-- 0039 moved invoice creation into create_order_with_splits, which runs as
-- the BUYER (security invoker, called from placeOrder()). But the RLS
-- policy on invoices only ever allowed the SUPPLIER to insert one
-- (invoices_insert_supplier, from back when invoicing happened on the
-- supplier's "Accept"/"Invoice" action) -- so every order placement with
-- items was silently failing on the invoice insert with a row-level-security
-- violation, surfaced to the user as a generic Server Components error.
--
-- Allow either party to insert, matching how order_status_history and
-- notifications already permit the buyer for this same placement-time flow.

drop policy invoices_insert_supplier on invoices;
create policy invoices_insert_party on invoices
  for insert with check (
    exists (
      select 1 from supplier_orders so
      where so.id = invoices.supplier_order_id
        and (so.supplier_business_id = current_business_id() or so.buyer_business_id = current_business_id())
    )
  );
