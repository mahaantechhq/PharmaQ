-- business_owners only ever had a SELECT policy (own row or super admin).
-- The Controller needs to let a super admin edit an owner's name after the
-- business has been created, which requires an UPDATE policy too.

create policy business_owners_admin_update on business_owners
  for update using (is_super_admin());
