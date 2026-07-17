-- Pharma Q — Business Dashboard Phase 1 schema
-- Multi-tenant B2B pharma marketplace. Every business is both buyer and seller.

create extension if not exists "pgcrypto";

-- =========================================================================
-- ENUMS
-- =========================================================================

create type business_status as enum ('pending', 'approved', 'suspended');
create type product_status as enum ('draft', 'active', 'inactive');
create type supplier_order_status as enum (
  'placed', 'accepted', 'rejected', 'invoiced', 'packed',
  'shipped', 'delivered', 'completed', 'cancelled', 'returned'
);
create type wallet_txn_type as enum ('credit', 'debit');
create type notification_type as enum ('order', 'system', 'wallet', 'inventory');

-- =========================================================================
-- CORE TENANCY
-- =========================================================================

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  gstin text,
  drug_license_no text,
  status business_status not null default 'pending',
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  pincode text,
  logo_url text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

-- Links an auth.users row to the single business it owns.
create table business_owners (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);
create index business_owners_business_id_idx on business_owners (business_id);

-- Allowlist for the future Super Admin Controller app; bypasses RLS scoping.
create table super_admins (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- RLS HELPER FUNCTIONS
-- =========================================================================

create function current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from business_owners where id = auth.uid();
$$;

create function is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from super_admins where id = auth.uid());
$$;

-- =========================================================================
-- CATALOG (global master tables, with business-scoped custom entries)
-- =========================================================================

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_global boolean not null default true,
  created_by_business_id uuid references businesses (id) on delete set null,
  created_at timestamptz not null default now()
);

create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_global boolean not null default true,
  created_by_business_id uuid references businesses (id) on delete set null,
  created_at timestamptz not null default now()
);

create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  is_global boolean not null default true,
  created_by_business_id uuid references businesses (id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- PRODUCTS & BATCH INVENTORY
-- =========================================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  category_id uuid references categories (id) on delete set null,
  brand_id uuid references brands (id) on delete set null,
  manufacturer_id uuid references manufacturers (id) on delete set null,
  name text not null,
  slug text not null,
  composition text,
  pack_size text,
  hsn_code text,
  gst_rate numeric(5, 2) not null default 0,
  description text,
  images text[] not null default '{}',
  status product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, slug)
);
create index products_business_id_idx on products (business_id);
create index products_status_idx on products (status);
create index products_name_idx on products using gin (to_tsvector('english', name));

create table product_batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products (id) on delete cascade,
  business_id uuid not null references businesses (id) on delete cascade,
  batch_number text not null,
  mfg_date date,
  expiry_date date not null,
  mrp numeric(10, 2) not null,
  selling_price numeric(10, 2) not null,
  stock_qty integer not null default 0 check (stock_qty >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, batch_number)
);
create index product_batches_product_id_idx on product_batches (product_id);
create index product_batches_expiry_idx on product_batches (expiry_date);

-- FIFO stock deduction: consumes from the soonest-expiring, non-expired,
-- in-stock batches first. Raises if total available stock is insufficient.
create function deduct_stock_fifo(p_product_id uuid, p_qty integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  remaining integer := p_qty;
  batch record;
  take integer;
begin
  if p_qty <= 0 then
    raise exception 'Quantity must be positive';
  end if;

  for batch in
    select id, stock_qty
    from product_batches
    where product_id = p_product_id
      and expiry_date >= current_date
      and stock_qty > 0
    order by expiry_date asc
    for update
  loop
    exit when remaining <= 0;
    take := least(batch.stock_qty, remaining);
    update product_batches set stock_qty = stock_qty - take where id = batch.id;
    remaining := remaining - take;
  end loop;

  if remaining > 0 then
    raise exception 'Insufficient non-expired stock for product %', p_product_id;
  end if;
end;
$$;

-- =========================================================================
-- ORDERS — master order splits into one supplier_order per supplier
-- =========================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  buyer_business_id uuid not null references businesses (id) on delete cascade,
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);
create index orders_buyer_business_id_idx on orders (buyer_business_id);

create table supplier_orders (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  order_number text not null,
  supplier_business_id uuid not null references businesses (id) on delete cascade,
  buyer_business_id uuid not null references businesses (id) on delete cascade,
  status supplier_order_status not null default 'placed',
  subtotal numeric(12, 2) not null default 0,
  tax_total numeric(12, 2) not null default 0,
  grand_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index supplier_orders_supplier_business_id_idx on supplier_orders (supplier_business_id);
create index supplier_orders_buyer_business_id_idx on supplier_orders (buyer_business_id);
create index supplier_orders_status_idx on supplier_orders (status);

create table supplier_order_items (
  id uuid primary key default gen_random_uuid(),
  supplier_order_id uuid not null references supplier_orders (id) on delete cascade,
  product_id uuid not null references products (id) on delete restrict,
  batch_id uuid references product_batches (id) on delete set null,
  product_name text not null,
  batch_number text,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null,
  gst_rate numeric(5, 2) not null default 0,
  line_total numeric(12, 2) not null
);
create index supplier_order_items_supplier_order_id_idx on supplier_order_items (supplier_order_id);

create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  supplier_order_id uuid not null references supplier_orders (id) on delete cascade,
  status supplier_order_status not null,
  note text,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now()
);
create index order_status_history_supplier_order_id_idx on order_status_history (supplier_order_id);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_order_id uuid not null references supplier_orders (id) on delete cascade unique,
  invoice_number text not null unique,
  invoice_date date not null default current_date,
  subtotal numeric(12, 2) not null,
  tax_total numeric(12, 2) not null,
  grand_total numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- WALLET & NOTIFICATIONS
-- =========================================================================

create table wallets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade unique,
  balance numeric(12, 2) not null default 0,
  credit_limit numeric(12, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references wallets (id) on delete cascade,
  type wallet_txn_type not null,
  amount numeric(12, 2) not null check (amount > 0),
  reference_type text,
  reference_id uuid,
  description text,
  created_at timestamptz not null default now()
);
create index wallet_transactions_wallet_id_idx on wallet_transactions (wallet_id);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  title text not null,
  message text not null,
  type notification_type not null default 'system',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_business_id_idx on notifications (business_id);
create index notifications_unread_idx on notifications (business_id, is_read);

-- =========================================================================
-- VIEW — buyer businesses derived from supplier_orders, for Customers page
-- =========================================================================

create view business_customers
  with (security_invoker = true)
as
select
  so.supplier_business_id,
  so.buyer_business_id,
  b.name as buyer_name,
  count(*)::int as total_orders,
  sum(so.grand_total) as total_spent,
  max(so.created_at) as last_order_at
from supplier_orders so
join businesses b on b.id = so.buyer_business_id
group by so.supplier_business_id, so.buyer_business_id, b.name;

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================

alter table businesses enable row level security;
alter table business_owners enable row level security;
alter table categories enable row level security;
alter table brands enable row level security;
alter table manufacturers enable row level security;
alter table products enable row level security;
alter table product_batches enable row level security;
alter table orders enable row level security;
alter table supplier_orders enable row level security;
alter table supplier_order_items enable row level security;
alter table order_status_history enable row level security;
alter table invoices enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table notifications enable row level security;

-- businesses: a business can read/update its own row; super admin sees all
create policy businesses_select_own on businesses
  for select using (id = current_business_id() or is_super_admin());
create policy businesses_update_own on businesses
  for update using (id = current_business_id() or is_super_admin());
create policy businesses_super_admin_all on businesses
  for all using (is_super_admin());

-- business_owners: an owner can read their own row
create policy business_owners_select_own on business_owners
  for select using (id = auth.uid() or is_super_admin());

-- categories / brands / manufacturers: readable by any authenticated user
-- (global taxonomy); a business may insert its own scoped entries.
create policy categories_select_all on categories
  for select using (auth.role() = 'authenticated');
create policy categories_insert_own on categories
  for insert with check (created_by_business_id = current_business_id() or is_super_admin());
create policy brands_select_all on brands
  for select using (auth.role() = 'authenticated');
create policy brands_insert_own on brands
  for insert with check (created_by_business_id = current_business_id() or is_super_admin());
create policy manufacturers_select_all on manufacturers
  for select using (auth.role() = 'authenticated');
create policy manufacturers_insert_own on manufacturers
  for insert with check (created_by_business_id = current_business_id() or is_super_admin());

-- products: full CRUD for the owning business; any authenticated user may
-- read active listings (future marketplace search across all suppliers)
create policy products_select_active_or_own on products
  for select using (
    status = 'active' or business_id = current_business_id() or is_super_admin()
  );
create policy products_insert_own on products
  for insert with check (business_id = current_business_id());
create policy products_update_own on products
  for update using (business_id = current_business_id() or is_super_admin());
create policy products_delete_own on products
  for delete using (business_id = current_business_id() or is_super_admin());

-- product_batches: fully scoped to the owning business
create policy product_batches_select_own on product_batches
  for select using (business_id = current_business_id() or is_super_admin());
create policy product_batches_insert_own on product_batches
  for insert with check (business_id = current_business_id());
create policy product_batches_update_own on product_batches
  for update using (business_id = current_business_id() or is_super_admin());
create policy product_batches_delete_own on product_batches
  for delete using (business_id = current_business_id() or is_super_admin());

-- orders (master): visible to the buyer who placed it
create policy orders_select_buyer on orders
  for select using (buyer_business_id = current_business_id() or is_super_admin());
create policy orders_insert_buyer on orders
  for insert with check (buyer_business_id = current_business_id());

-- supplier_orders: visible/updatable by either party
create policy supplier_orders_select_party on supplier_orders
  for select using (
    supplier_business_id = current_business_id()
    or buyer_business_id = current_business_id()
    or is_super_admin()
  );
create policy supplier_orders_insert_buyer on supplier_orders
  for insert with check (buyer_business_id = current_business_id());
create policy supplier_orders_update_party on supplier_orders
  for update using (
    supplier_business_id = current_business_id()
    or buyer_business_id = current_business_id()
    or is_super_admin()
  );

create policy supplier_order_items_select_party on supplier_order_items
  for select using (
    exists (
      select 1 from supplier_orders so
      where so.id = supplier_order_items.supplier_order_id
        and (so.supplier_business_id = current_business_id() or so.buyer_business_id = current_business_id())
    ) or is_super_admin()
  );
create policy supplier_order_items_insert_buyer on supplier_order_items
  for insert with check (
    exists (
      select 1 from supplier_orders so
      where so.id = supplier_order_items.supplier_order_id
        and so.buyer_business_id = current_business_id()
    )
  );

create policy order_status_history_select_party on order_status_history
  for select using (
    exists (
      select 1 from supplier_orders so
      where so.id = order_status_history.supplier_order_id
        and (so.supplier_business_id = current_business_id() or so.buyer_business_id = current_business_id())
    ) or is_super_admin()
  );
create policy order_status_history_insert_party on order_status_history
  for insert with check (
    exists (
      select 1 from supplier_orders so
      where so.id = order_status_history.supplier_order_id
        and (so.supplier_business_id = current_business_id() or so.buyer_business_id = current_business_id())
    )
  );

create policy invoices_select_party on invoices
  for select using (
    exists (
      select 1 from supplier_orders so
      where so.id = invoices.supplier_order_id
        and (so.supplier_business_id = current_business_id() or so.buyer_business_id = current_business_id())
    ) or is_super_admin()
  );
create policy invoices_insert_supplier on invoices
  for insert with check (
    exists (
      select 1 from supplier_orders so
      where so.id = invoices.supplier_order_id
        and so.supplier_business_id = current_business_id()
    )
  );

-- wallets / wallet_transactions / notifications: owning business only
create policy wallets_select_own on wallets
  for select using (business_id = current_business_id() or is_super_admin());
create policy wallets_update_own on wallets
  for update using (business_id = current_business_id() or is_super_admin());

create policy wallet_transactions_select_own on wallet_transactions
  for select using (
    exists (
      select 1 from wallets w
      where w.id = wallet_transactions.wallet_id and w.business_id = current_business_id()
    ) or is_super_admin()
  );

create policy notifications_select_own on notifications
  for select using (business_id = current_business_id() or is_super_admin());
create policy notifications_update_own on notifications
  for update using (business_id = current_business_id() or is_super_admin());
