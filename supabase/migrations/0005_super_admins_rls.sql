-- super_admins never had RLS explicitly enabled/policied in 0001_init.sql.
-- Supabase enables RLS by default on new tables, so with zero policies the
-- authenticated role got zero rows back (only service_role could see it),
-- which broke the Controller's own login check (an infinite redirect loop
-- between middleware and the admin-gated layout).

alter table super_admins enable row level security;

create policy super_admins_select_self on super_admins
  for select using (id = auth.uid());
