-- product_batches_select_own (0001_init.sql) only ever let the owning
-- business read its own batches -- there was no way for a buyer (a
-- different business) to see stock/price for another business's product,
-- since RLS silently returns zero rows rather than an error. This is why
-- every product across the marketplace has shown "Price on request" /
-- "Out of stock" regardless of actual stock: searchProducts(), the product
-- detail page, and the supplier profile page all query product_batches
-- directly and got nothing back for any business other than the querying
-- business's own (which never happens, since a business's own products are
-- deliberately excluded from its own search results).
--
-- Mirrors products_select_active_or_own: anyone can see batch stock/price
-- for a product that's actually live (active status), same as they can
-- already see the product row itself.
create policy product_batches_select_active_public on product_batches
  for select using (
    exists (
      select 1 from products p
      where p.id = product_batches.product_id
        and p.status = 'active'
    )
  );
