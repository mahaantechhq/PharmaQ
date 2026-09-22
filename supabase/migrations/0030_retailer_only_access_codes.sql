-- Access codes exist so a wholesaler's admin-generated code lets a super
-- admin identify and link a *retailer* to them -- a wholesaler linking to
-- another wholesaler was never a real flow, so wholesalers shouldn't have
-- one at all.

delete from business_access_codes
using businesses
where business_access_codes.business_id = businesses.id
  and businesses.business_type = 'wholesaler';

create or replace function businesses_set_access_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.business_type = 'retailer' then
    insert into business_access_codes (business_id, access_code)
    values (new.id, generate_business_access_code());
  end if;
  return new;
end;
$$;
