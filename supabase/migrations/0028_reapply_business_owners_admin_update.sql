-- business_owners_admin_update (added in 0019) was found to be missing from
-- production despite being tracked in git -- a super admin's edit to an
-- owner's name in the Controller app was silently updating 0 rows instead of
-- erroring, since RLS blocks with no error unless you check the affected
-- row count yourself. Re-apply defensively.

drop policy if exists business_owners_admin_update on business_owners;

create policy business_owners_admin_update on business_owners
  for update using (is_super_admin());
