-- Payment status is tracked separately from fulfillment status
-- (supplier_orders.status) -- a business can mark an order paid/partial/
-- unpaid independently of where it is in the placed->accepted->...->
-- completed pipeline, since payment collection and physical fulfillment
-- don't always happen in lockstep.

create type payment_status as enum ('paid', 'partial', 'unpaid');

alter table supplier_orders
  add column payment_status payment_status not null default 'unpaid',
  add column amount_paid numeric(12, 2) not null default 0;
