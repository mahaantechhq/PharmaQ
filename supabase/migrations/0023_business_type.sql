-- Businesses are now explicitly tagged as a retailer or a wholesaler at
-- creation time (Controller's "Create business" form), matching the
-- wholesaler-uploads/retailer-orders model behind retailer_wholesaler_links.
-- Nullable because existing businesses predate this field and aren't
-- being auto-classified.

create type business_role as enum ('retailer', 'wholesaler');

alter table businesses add column business_type business_role;
