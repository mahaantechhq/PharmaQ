-- The "Deliver" action was removed from business-admin and the marketplace
-- no longer displays a distinct "Delivered" badge (it now reads as
-- "Accepted") -- bring any existing data in line with that: revert orders
-- still marked delivered back to accepted, and drop the now-stale
-- "delivered" history entries instead of renaming them (renaming would
-- create a duplicate "Accepted" entry alongside the real one from when the
-- order was first accepted).

update supplier_orders set status = 'accepted' where status = 'delivered';
delete from order_status_history where status = 'delivered';
