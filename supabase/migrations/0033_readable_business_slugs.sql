-- businesses.slug existed but was never used for anything -- the marketplace
-- always linked to /suppliers/<uuid>. Repurposing it as a readable URL slug
-- ("abc-wholesale-trichy") requires it to actually look like that, so this
-- regenerates every existing slug from name+city, and moves the uniqueness
-- retry (like generate_business_access_code already does for its codes)
-- into provision_business itself so new businesses never race on it.

create or replace function slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'));
$$;

do $$
declare
  r record;
  v_base text;
  v_slug text;
  v_suffix int;
begin
  for r in select id, name, city from businesses order by created_at loop
    v_base := slugify(r.name || case when r.city is not null and r.city <> '' then '-' || r.city else '' end);
    if v_base = '' then v_base := 'business'; end if;
    v_slug := v_base;
    v_suffix := 1;
    while exists (select 1 from businesses where slug = v_slug and id <> r.id) loop
      v_suffix := v_suffix + 1;
      v_slug := v_base || '-' || v_suffix;
    end loop;
    update businesses set slug = v_slug where id = r.id;
  end loop;
end $$;

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

  insert into wallets (business_id, balance, credit_limit)
  values (v_business_id, 0, 0);

  return v_business_id;
end;
$$;
