-- The Marketplace needs to show supplier names/locations on product cards,
-- product detail pages, and supplier profile pages — including for
-- anonymous browsers. The existing businesses_select_own policy only let a
-- business see itself (or a genuine order counterparty), so every product
-- card was rendering "Unknown supplier". Approved businesses are public
-- storefronts by design, so make their basic profile readable by anyone.

create policy businesses_select_approved_public on businesses
  for select using (status = 'approved');
