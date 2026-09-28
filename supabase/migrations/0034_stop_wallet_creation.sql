-- The wallet feature has no UI anywhere in the app (the marketplace's
-- /wallet page and its Wallet/WalletTransaction types were already removed
-- as dead code) -- stop provisioning a wallet row for every new business.
-- The wallets/wallet_transactions tables and any existing rows are left in
-- place untouched.

create or replace function provision_business(
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
  p_pincode text default null,
  p_business_type business_role default null,
  p_drug_license_expiry date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
  v_slug text := p_slug;
  v_suffix int := 1;
begin
  if not is_super_admin() then
    raise exception 'Only a super admin can provision a business';
  end if;

  while exists (select 1 from businesses where slug = v_slug) loop
    v_suffix := v_suffix + 1;
    v_slug := p_slug || '-' || v_suffix;
  end loop;

  insert into businesses (
    name, slug, status, approved_at, email, phone, gstin,
    drug_license_no, drug_license_expiry, address_line1, city, state, pincode, business_type
  )
  values (
    p_name, v_slug, 'approved', now(), p_email, p_phone, p_gstin,
    p_drug_license_no, p_drug_license_expiry, p_address_line1, p_city, p_state, p_pincode, p_business_type
  )
  returning id into v_business_id;

  insert into business_owners (id, business_id, full_name, phone)
  values (p_owner_id, v_business_id, p_owner_name, p_phone);

  return v_business_id;
end;
$$;
