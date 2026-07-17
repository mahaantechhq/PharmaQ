-- Super Admin Controller: marketing tables, platform settings, audit log,
-- and RLS gaps needed for admin-driven mutations.

create type coupon_discount_type as enum ('percentage', 'fixed');
create type catalog_item_status as enum ('active', 'inactive');
create type banner_position as enum ('hero', 'category', 'sidebar');

create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type coupon_discount_type not null,
  discount_value numeric(10, 2) not null,
  min_order_value numeric(10, 2) not null default 0,
  max_discount numeric(10, 2),
  valid_from date,
  valid_until date,
  usage_limit integer,
  used_count integer not null default 0,
  status catalog_item_status not null default 'active',
  created_at timestamptz not null default now()
);

create table banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text not null,
  link_url text,
  position banner_position not null default 'hero',
  sort_order integer not null default 0,
  status catalog_item_status not null default 'active',
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table platform_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_at_idx on audit_logs (created_at desc);
create index audit_logs_entity_idx on audit_logs (entity_type, entity_id);

alter table coupons enable row level security;
alter table banners enable row level security;
alter table platform_settings enable row level security;
alter table audit_logs enable row level security;

create policy coupons_select_all on coupons
  for select using (auth.role() = 'authenticated');
create policy coupons_admin_all on coupons
  for all using (is_super_admin());

create policy banners_select_all on banners
  for select using (auth.role() = 'authenticated');
create policy banners_admin_all on banners
  for all using (is_super_admin());

create policy platform_settings_select_all on platform_settings
  for select using (auth.role() = 'authenticated');
create policy platform_settings_admin_all on platform_settings
  for all using (is_super_admin());

create policy audit_logs_admin_all on audit_logs
  for all using (is_super_admin());

-- Existing tables missing INSERT policies needed for admin-driven writes.
create policy wallet_transactions_insert_admin on wallet_transactions
  for insert with check (is_super_admin());

create policy notifications_insert_admin on notifications
  for insert with check (is_super_admin());

grant select, insert, update, delete on coupons, banners, platform_settings, audit_logs
  to authenticated, service_role;
grant select on coupons, banners, platform_settings to anon;

alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant select on tables to anon;
