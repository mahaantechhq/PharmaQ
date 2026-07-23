-- Adds "Scheme" (e.g. "5+1") and "Discount %" fields to a batch, matching
-- the bulk-upload CSV template's columns. Independent of mrp/selling_price
-- -- this is a separate trade-scheme discount, not derived from them.

alter table product_batches add column scheme text;
alter table product_batches add column discount_percent numeric(5, 2);
