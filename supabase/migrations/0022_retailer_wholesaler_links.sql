-- Pharma Q is moving from an open marketplace (every retailer sees every
-- approved business's catalog) to a private, admin-linked model: a
-- retailer only sees products from wholesalers a super admin has
-- explicitly linked them to. This table is that link, always created and
-- removed by a super admin from the Controller -- there is no
-- self-service request/approve flow.

create table retailer_wholesaler_links (
  id uuid primary key default gen_random_uuid(),
  wholesaler_business_id uuid not null references businesses (id) on delete cascade,
  retailer_business_id uuid not null references businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wholesaler_business_id, retailer_business_id)
);
create index retailer_wholesaler_links_wholesaler_idx on retailer_wholesaler_links (wholesaler_business_id);
create index retailer_wholesaler_links_retailer_idx on retailer_wholesaler_links (retailer_business_id);

alter table retailer_wholesaler_links enable row level security;

-- Only a super admin creates/removes links.
create policy retailer_wholesaler_links_admin_write on retailer_wholesaler_links
  for all using (is_super_admin()) with check (is_super_admin());

-- Either side of a link can read it -- the marketplace needs this to filter
-- a retailer's own product visibility (RLS-enforced, not just app-level).
create policy retailer_wholesaler_links_select_party on retailer_wholesaler_links
  for select using (
    wholesaler_business_id = current_business_id()
    or retailer_business_id = current_business_id()
    or is_super_admin()
  );

grant select, insert, update, delete on retailer_wholesaler_links to authenticated, service_role;
