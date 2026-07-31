-- Replaces the admin-managed wallet/credit-limit workflow with a flat
-- monthly platform subscription: every business pays the same fee each
-- month, tracked per business per calendar month so status naturally
-- resets when a new month starts. A missing row for the current period
-- just means "not yet paid" -- there's no cron pre-creating rows.
--
-- Marking paid is manual for now (the super admin clicks a button), but
-- status/paid_at/marked_by are kept generic enough that a future payment
-- gateway webhook can write the same row shape instead.

create type subscription_payment_status as enum ('paid', 'unpaid');

create table business_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  period date not null,
  amount numeric(12, 2) not null,
  status subscription_payment_status not null default 'unpaid',
  paid_at timestamptz,
  marked_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, period)
);
create index business_subscription_payments_business_id_idx on business_subscription_payments (business_id);
create index business_subscription_payments_period_idx on business_subscription_payments (period);

alter table business_subscription_payments enable row level security;

create policy business_subscription_payments_admin_all on business_subscription_payments
  for all using (is_super_admin());

create policy business_subscription_payments_select_own on business_subscription_payments
  for select using (business_id = current_business_id());

grant select, insert, update, delete on business_subscription_payments to authenticated, service_role;

-- Global flat fee (in rupees), editable from the Controller's Payments page.
insert into platform_settings (key, value)
values ('subscription_fee', '{"amount": 0}'::jsonb)
on conflict (key) do nothing;
