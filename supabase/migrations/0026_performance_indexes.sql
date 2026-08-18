-- Three columns that are filtered on in real, frequently-hit query paths
-- but had no index -- fine at today's data volume, but each would force a
-- full table scan as these tables grow:
--
-- - product_batches.business_id: business-admin's Products/Inventory
--   pages filter batches by the wholesaler's own business_id on every load.
-- - supplier_orders.order_id: the marketplace order detail page
--   (/orders/[id]) looks up every supplier_orders row for a given order_id
--   on every view.
-- - supplier_order_items.product_id: business-admin's bulkDeleteProducts
--   checks order history by product_id before allowing a delete.

create index product_batches_business_id_idx on product_batches (business_id);
create index supplier_orders_order_id_idx on supplier_orders (order_id);
create index supplier_order_items_product_id_idx on supplier_order_items (product_id);
