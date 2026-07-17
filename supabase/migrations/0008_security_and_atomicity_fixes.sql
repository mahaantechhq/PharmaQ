-- Fixes from a full-codebase senior-engineer audit:
--
-- 1. RLS UPDATE policies without `with check` reuse `using` for the new row
--    too, so only the row-selection predicate (e.g. "it's my own row") was
--    ever enforced — any column, including status/balance/totals, could be
--    rewritten by a client talking to PostgREST directly, bypassing every
--    app-level guard (STATUS_FLOW, wallet math, approval workflow).
-- 2. categories/brands/manufacturers never had UPDATE/DELETE policies at
--    all, so the Controller's rename/promote/delete actions were silently
--    matching zero rows — no error, but nothing happened, and the action
--    still logged an audit entry and reported success.
-- 3. Order accept, wallet adjustment, coupon redemption, and marketplace
--    checkout were each a sequence of independent awaited Supabase calls
--    with no transaction — concurrent requests could double-process, and a
--    failure partway through left orphaned/inconsistent rows with no way
--    to retry cleanly. Moving each into a single plpgsql function makes it
--    atomic for free (a function body is one transaction), and lets us add
--    row locking (`for update`) where two concurrent callers must be
--    serialized (wallet balance, order acceptance).

-- =========================================================================
-- 1. WITH CHECK gaps
-- =========================================================================

drop policy businesses_update_own on businesses;
create policy businesses_update_own on businesses
  for update using (id = current_business_id() or is_super_admin())
  with check (id = current_business_id() or is_super_admin());

-- The WITH CHECK above only stops a business from reassigning the row to
-- someone else's id — it can't express "and these specific columns didn't
-- change". Businesses do legitimately self-edit their profile (name,
-- phone, gstin, address — see settings/actions.ts's updateBusinessProfile),
-- so this can't just be locked to admin-only like wallets was. A trigger
-- is what can actually compare OLD vs NEW and block only the approval
-- workflow columns from a non-admin, while leaving profile self-edit
-- intact.
create function businesses_prevent_self_approval()
returns trigger
language plpgsql
as $$
begin
  if not is_super_admin() and (
    new.status is distinct from old.status
    or new.approved_at is distinct from old.approved_at
  ) then
    raise exception 'Only a super admin can change business approval status';
  end if;
  return new;
end;
$$;

create trigger businesses_prevent_self_approval_trigger
  before update on businesses
  for each row
  execute function businesses_prevent_self_approval();

-- Businesses have no legitimate reason to write to their own wallet at
-- all — the dashboard's wallet page is read-only, balance/credit_limit
-- only ever change via adjust_wallet_balance()/updateCreditLimit() (admin
-- actions). A `with check (business_id = current_business_id() ...)` would
-- only stop a business from reassigning the row to someone else — it does
-- nothing to stop them rewriting their OWN balance directly via the anon
-- key. So this drops business self-update entirely instead of trying to
-- patch it with a check that can't constrain individual columns.
drop policy wallets_update_own on wallets;
create policy wallets_update_admin_only on wallets
  for update using (is_super_admin())
  with check (is_super_admin());

-- Buyers never legitimately write to supplier_orders — the Marketplace's
-- order views are read-only by design (status changes are the supplier's
-- call). The old policy granted UPDATE to the buyer too "to be safe", but
-- that's exactly the gap: a buyer could rewrite their own order's status/
-- totals directly via the anon key. Only the supplier (and admin) should
-- ever be able to write here, enforced by both USING and WITH CHECK now.
drop policy supplier_orders_update_party on supplier_orders;
create policy supplier_orders_update_supplier_only on supplier_orders
  for update using (supplier_business_id = current_business_id() or is_super_admin())
  with check (supplier_business_id = current_business_id() or is_super_admin());

-- =========================================================================
-- 2. Missing catalog UPDATE/DELETE policies (admin-only — no UI lets a
--    business edit/delete a catalog entry today, only create one)
-- =========================================================================

create policy categories_admin_update on categories for update using (is_super_admin());
create policy categories_admin_delete on categories for delete using (is_super_admin());
create policy brands_admin_update on brands for update using (is_super_admin());
create policy brands_admin_delete on brands for delete using (is_super_admin());
create policy manufacturers_admin_update on manufacturers for update using (is_super_admin());
create policy manufacturers_admin_delete on manufacturers for delete using (is_super_admin());

-- =========================================================================
-- 3. Restrict what a buyer can put in a notification for another business
--    via notifications_insert_order_party (0006_marketplace.sql) — a real
--    order relationship was required, but title/message/type were
--    unrestricted, letting a buyer send arbitrary content to a supplier.
-- =========================================================================

drop policy notifications_insert_order_party on notifications;
create policy notifications_insert_order_party on notifications
  for insert with check (
    type = 'order'
    and char_length(title) <= 200
    and char_length(message) <= 500
    and exists (
      select 1 from supplier_orders so
      where so.buyer_business_id = current_business_id()
        and so.supplier_business_id = notifications.business_id
    )
  );

-- =========================================================================
-- 4. Atomic order acceptance — replaces the read-check / FIFO-loop /
--    status-update / history-insert sequence in application code. Locks
--    the order row so two concurrent "Accept" calls can't both pass the
--    status check and double-deduct stock; if FIFO fails partway through,
--    the whole thing rolls back instead of leaving stock deducted with the
--    order still "placed".
-- =========================================================================

create function accept_supplier_order(p_supplier_order_id uuid)
returns void
language plpgsql
security invoker
as $$
declare
  v_order record;
  v_item record;
begin
  select * into v_order
  from supplier_orders
  where id = p_supplier_order_id
    and supplier_business_id = current_business_id()
    and status = 'placed'
  for update;

  if not found then
    raise exception 'Order not found or already processed';
  end if;

  for v_item in
    select product_id, quantity from supplier_order_items
    where supplier_order_id = p_supplier_order_id
  loop
    perform deduct_stock_fifo(v_item.product_id, v_item.quantity);
  end loop;

  update supplier_orders
  set status = 'accepted', updated_at = now()
  where id = p_supplier_order_id;

  insert into order_status_history (supplier_order_id, status, changed_by)
  values (p_supplier_order_id, 'accepted', auth.uid());
end;
$$;

-- =========================================================================
-- 5. Atomic status transition for every other step (invoiced, packed,
--    shipped, delivered, completed, rejected, cancelled, returned) —
--    same locking pattern, plus the invoice upsert when moving to
--    "invoiced" so that step can't silently fail independently of the
--    status change (both previously used unchecked `await`s).
-- =========================================================================

create function transition_supplier_order_status(
  p_supplier_order_id uuid,
  p_expected_status supplier_order_status,
  p_next_status supplier_order_status,
  p_note text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_order record;
begin
  select * into v_order
  from supplier_orders
  where id = p_supplier_order_id
    and (supplier_business_id = current_business_id() or buyer_business_id = current_business_id())
    and status = p_expected_status
  for update;

  if not found then
    raise exception 'Order not found or status changed since you loaded this page';
  end if;

  update supplier_orders
  set status = p_next_status, updated_at = now()
  where id = p_supplier_order_id;

  insert into order_status_history (supplier_order_id, status, note, changed_by)
  values (p_supplier_order_id, p_next_status, p_note, auth.uid());

  if p_next_status = 'invoiced' then
    insert into invoices (supplier_order_id, invoice_number, subtotal, tax_total, grand_total)
    values (p_supplier_order_id, 'INV-' || v_order.order_number, v_order.subtotal, v_order.tax_total, v_order.grand_total)
    on conflict (supplier_order_id) do nothing;
  end if;
end;
$$;

-- =========================================================================
-- 6. Atomic coupon redemption — a plain `update ... set used_count =
--    used_count + 1` is a single statement and therefore safe under
--    concurrency on its own; the bug was capturing `used_count` from an
--    earlier read and writing that literal value back. This wraps it as
--    an RPC so app code can't reintroduce the read-then-write pattern.
--
--    security definer: buyers (who call this from checkout) have no
--    general UPDATE grant on `coupons` — only `is_super_admin()` does —
--    and shouldn't get one just to bump a usage counter. This function's
--    body is fixed (it only ever touches `used_count`), so bypassing RLS
--    here doesn't let a caller edit discount value/dates/limits.
-- =========================================================================

create function increment_coupon_usage(p_coupon_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update coupons set used_count = used_count + 1 where id = p_coupon_id;
$$;

revoke all on function increment_coupon_usage from public;
grant execute on function increment_coupon_usage to authenticated;

-- =========================================================================
-- 7. Atomic wallet adjustment — locks the wallet row so two concurrent
--    admin adjustments can't clobber each other, and the balance check +
--    write + transaction log happen in one transaction.
-- =========================================================================

create function adjust_wallet_balance(
  p_business_id uuid,
  p_type wallet_txn_type,
  p_amount numeric,
  p_description text default null
)
returns void
language plpgsql
security invoker
as $$
declare
  v_wallet record;
  v_new_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;

  select * into v_wallet from wallets where business_id = p_business_id for update;
  if not found then
    raise exception 'Wallet not found';
  end if;

  v_new_balance := v_wallet.balance + (case when p_type = 'credit' then p_amount else -p_amount end);
  if v_new_balance < 0 then
    raise exception 'Insufficient balance for this debit';
  end if;

  update wallets set balance = v_new_balance, updated_at = now() where id = v_wallet.id;

  insert into wallet_transactions (wallet_id, type, amount, reference_type, description)
  values (v_wallet.id, p_type, p_amount, 'admin_adjustment', coalesce(p_description, 'Manual ' || p_type || ' by super admin'));
end;
$$;

-- =========================================================================
-- 8. Atomic multi-supplier order creation for Marketplace checkout — the
--    master order, every supplier_order, every line item, every status
--    history row, and every notification are created in one transaction.
--    A failure partway through (constraint violation, transient error)
--    now rolls back everything instead of leaving orphaned rows with an
--    uncleared cart that would duplicate on retry.
-- =========================================================================

create function create_order_with_splits(
  p_order_number text,
  p_buyer_business_id uuid,
  p_subtotal numeric,
  p_tax_total numeric,
  p_grand_total numeric,
  p_supplier_orders jsonb
)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_order_id uuid;
  v_supplier_order jsonb;
  v_supplier_order_id uuid;
  v_item jsonb;
begin
  insert into orders (order_number, buyer_business_id, subtotal, tax_total, grand_total)
  values (p_order_number, p_buyer_business_id, p_subtotal, p_tax_total, p_grand_total)
  returning id into v_order_id;

  for v_supplier_order in select * from jsonb_array_elements(p_supplier_orders)
  loop
    insert into supplier_orders (
      order_id, order_number, supplier_business_id, buyer_business_id,
      status, subtotal, tax_total, grand_total
    )
    values (
      v_order_id,
      p_order_number,
      (v_supplier_order->>'supplierBusinessId')::uuid,
      p_buyer_business_id,
      'placed',
      (v_supplier_order->>'subtotal')::numeric,
      (v_supplier_order->>'taxTotal')::numeric,
      (v_supplier_order->>'grandTotal')::numeric
    )
    returning id into v_supplier_order_id;

    for v_item in select * from jsonb_array_elements(v_supplier_order->'items')
    loop
      insert into supplier_order_items (
        supplier_order_id, product_id, batch_id, product_name, batch_number,
        quantity, unit_price, gst_rate, line_total
      )
      values (
        v_supplier_order_id,
        (v_item->>'productId')::uuid,
        nullif(v_item->>'batchId', '')::uuid,
        v_item->>'productName',
        v_item->>'batchNumber',
        (v_item->>'quantity')::int,
        (v_item->>'unitPrice')::numeric,
        (v_item->>'gstRate')::numeric,
        (v_item->>'lineTotal')::numeric
      );
    end loop;

    insert into order_status_history (supplier_order_id, status)
    values (v_supplier_order_id, 'placed');

    insert into notifications (business_id, title, message, type)
    values (
      (v_supplier_order->>'supplierBusinessId')::uuid,
      'New order received',
      v_supplier_order->>'notificationMessage',
      'order'
    );
  end loop;

  return v_order_id;
end;
$$;

-- =========================================================================
-- 9. Atomic business provisioning for the Controller's "Create business"
--    flow. The auth user itself is created via the Supabase Auth API
--    (a separate service, not this database) before this function runs, so
--    it can never be inside the same transaction as these three inserts —
--    but business + business_owner + wallet are now one transaction
--    instead of three independent inserts, so a mid-sequence failure can't
--    leave a business with no owner or no wallet. The app still needs to
--    delete the auth user if this call fails, since that step is outside
--    the database entirely.
-- =========================================================================

create function provision_business(
  p_owner_id uuid,
  p_name text,
  p_slug text,
  p_owner_name text,
  p_email text,
  p_phone text default null,
  p_gstin text default null,
  p_drug_license_no text default null,
  p_address_line1 text default null,
  p_city text default null,
  p_state text default null,
  p_pincode text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  -- security definer bypasses RLS on the tables below, so this function
  -- must enforce its own authorization instead of relying on policies.
  if not is_super_admin() then
    raise exception 'Only a super admin can provision a business';
  end if;

  insert into businesses (
    name, slug, status, approved_at, email, phone, gstin,
    drug_license_no, address_line1, city, state, pincode
  )
  values (
    p_name, p_slug, 'approved', now(), p_email, p_phone, p_gstin,
    p_drug_license_no, p_address_line1, p_city, p_state, p_pincode
  )
  returning id into v_business_id;

  insert into business_owners (id, business_id, full_name, phone)
  values (p_owner_id, v_business_id, p_owner_name, p_phone);

  insert into wallets (business_id, balance, credit_limit)
  values (v_business_id, 0, 0);

  return v_business_id;
end;
$$;

-- security definer because this is only ever called right after
-- getCurrentAdmin() succeeds in the Controller app (verified in
-- src/app/(dashboard)/businesses/actions.ts), and the caller isn't a
-- business_owner yet at insert time so the normal RLS insert policies
-- wouldn't apply anyway.
revoke all on function provision_business from public;
grant execute on function provision_business to authenticated;
