-- access_code was a column on `businesses`, a table anyone (even
-- unauthenticated requests) can read the "public" columns of via
-- businesses_select_approved_public (0007_public_business_profiles.sql).
-- Postgres RLS is row-level, not column-level, so that policy exposed
-- every column including access_code to anonymous REST calls -- and every
-- `select("*")` on businesses across the marketplace/business-admin apps
-- shipped it into those apps' page payloads too, even though nothing
-- displayed it.
--
-- Rather than relying on Postgres column-level GRANTs (which can't
-- distinguish a super admin's session from a regular business owner's --
-- both are the same `authenticated` role) or an unmasking view (untested
-- edge cases around how `select=*` behaves against partial column
-- privileges), this moves access_code into its own table with RLS that
-- only ever allows is_super_admin() to read or write it. Since it's a
-- separate table, `businesses.*` structurally can never include it again,
-- in any app, regardless of query shape.

create table business_access_codes (
  business_id uuid primary key references businesses (id) on delete cascade,
  access_code text not null unique,
  created_at timestamptz not null default now()
);

insert into business_access_codes (business_id, access_code)
select id, access_code from businesses where access_code is not null;

drop trigger businesses_set_access_code_trigger on businesses;
alter table businesses drop constraint businesses_access_code_unique;
alter table businesses drop column access_code;

create or replace function generate_business_access_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..10 loop
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    end loop;
    exit when not exists (select 1 from business_access_codes where access_code = code);
  end loop;
  return code;
end;
$$;

-- security definer: this fires for every business creation regardless of
-- who's doing it (provision_business runs as a super admin, but the
-- underlying insert shouldn't depend on the caller also having write
-- access to business_access_codes -- the RLS policy below intentionally
-- restricts direct access to admins only).
create or replace function businesses_set_access_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into business_access_codes (business_id, access_code)
  values (new.id, generate_business_access_code());
  return new;
end;
$$;

create trigger businesses_set_access_code_trigger
  after insert on businesses
  for each row
  execute function businesses_set_access_code();

alter table business_access_codes enable row level security;

create policy business_access_codes_admin_only on business_access_codes
  for all using (is_super_admin()) with check (is_super_admin());

grant select, insert, update, delete on business_access_codes to authenticated, service_role;
