-- Remove the coupons feature entirely: no admin UI, no checkout coupon
-- application. Checked before writing this: no other table has a foreign
-- key to coupons (discount is computed at checkout time and folded
-- directly into the stored order/supplier_order totals, never stored as
-- a separate coupon reference), so this is a clean drop with no
-- consequences elsewhere.

drop function if exists increment_coupon_usage(uuid);
drop policy if exists coupons_select_all on coupons;
drop policy if exists coupons_admin_all on coupons;
drop table if exists coupons;
drop type if exists coupon_discount_type;

-- catalog_item_status is intentionally left alone -- banners.status still
-- uses it, and it was never coupon-specific despite living in the same
-- 0004 migration as the coupons table.
