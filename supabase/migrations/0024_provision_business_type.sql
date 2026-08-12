-- Extend provision_business (0008_security_and_atomicity_fixes.sql) to
-- accept the business_type added in 0023.

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
  p_business_type business_role default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_business_id uuid;
begin
  if not is_super_admin() then
    raise exception 'Only a super admin can provision a business';
  end if;

  insert into businesses (
    name, slug, status, approved_at, email, phone, gstin,
    drug_license_no, address_line1, city, state, pincode, business_type
  )
  values (
    p_name, p_slug, 'approved', now(), p_email, p_phone, p_gstin,
    p_drug_license_no, p_address_line1, p_city, p_state, p_pincode, p_business_type
  )
  returning id into v_business_id;

  insert into business_owners (id, business_id, full_name, phone)
  values (p_owner_id, v_business_id, p_owner_name, p_phone);

  insert into wallets (business_id, balance, credit_limit)
  values (v_business_id, 0, 0);

  return v_business_id;
end;
$$;
