-- categories/brands only ever had select/insert policies -- add update so a
-- business can rename an entry it created itself. Global/shared taxonomy
-- entries (created_by_business_id is null, or created by another business)
-- stay read-only to everyone but a super admin.

create policy categories_update_own on categories
  for update using (created_by_business_id = current_business_id() or is_super_admin());

create policy brands_update_own on brands
  for update using (created_by_business_id = current_business_id() or is_super_admin());
