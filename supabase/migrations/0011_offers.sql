-- Per-business offers: unlike the platform-wide coupons feature removed in
-- 0010 (admin-managed, code-entry at checkout), these are created by each
-- business for their own products and shown contextually wherever that
-- business's listings appear in the marketplace -- no code entry needed.

create type offer_discount_type as enum ('flat', 'percentage');

create table offers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  display_text text not null,
  discount_type offer_discount_type not null,
  discount_value numeric(10, 2) not null,
  min_order_amount numeric(10, 2) not null default 0,
  max_order_amount numeric(10, 2),
  starts_at date,
  expires_at date not null,
  status catalog_item_status not null default 'active',
  created_at timestamptz not null default now()
);
create index offers_business_id_idx on offers (business_id);
create index offers_active_idx on offers (business_id, status);

alter table offers enable row level security;

-- The owning business manages its own offers regardless of status/date.
create policy offers_select_own on offers
  for select using (business_id = current_business_id());

-- Anyone (including other businesses browsing the marketplace to buy, and
-- anonymous visitors) can see an offer once it's actually live -- this is
-- what lets a product card show "10% off" for a different business's
-- listing.
create policy offers_select_active_public on offers
  for select using (
    status = 'active'
    and (starts_at is null or starts_at <= current_date)
    and expires_at >= current_date
  );

create policy offers_insert_own on offers
  for insert with check (business_id = current_business_id());

create policy offers_update_own on offers
  for update using (business_id = current_business_id())
  with check (business_id = current_business_id());

create policy offers_delete_own on offers
  for delete using (business_id = current_business_id());

grant select, insert, update, delete on offers to authenticated, service_role;
grant select on offers to anon;
