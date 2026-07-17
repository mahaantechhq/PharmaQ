-- Marketplace: buyer cart, wishlist, and the notification-insert gap
-- needed for checkout to alert suppliers of a new order.

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  buyer_business_id uuid not null references businesses (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (buyer_business_id, product_id)
);
create index cart_items_buyer_business_id_idx on cart_items (buyer_business_id);

create table wishlist_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  product_id uuid not null references products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (business_id, product_id)
);
create index wishlist_items_business_id_idx on wishlist_items (business_id);

alter table cart_items enable row level security;
alter table wishlist_items enable row level security;

create policy cart_items_all_own on cart_items
  for all using (buyer_business_id = current_business_id())
  with check (buyer_business_id = current_business_id());

create policy wishlist_items_all_own on wishlist_items
  for all using (business_id = current_business_id())
  with check (business_id = current_business_id());

-- Checkout inserts a notification for the supplier's business (not the
-- buyer's own business), so the general "own business only" insert rule
-- doesn't cover it. Allow it only when a genuine order relationship exists
-- (the supplier_orders row is inserted before this notification).
create policy notifications_insert_order_party on notifications
  for insert with check (
    exists (
      select 1 from supplier_orders so
      where so.buyer_business_id = current_business_id()
        and so.supplier_business_id = notifications.business_id
    )
  );

grant select, insert, update, delete on cart_items, wishlist_items to authenticated, service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant select on tables to anon;
