-- Every business gets an automatic 10-character alphanumeric access code,
-- generated once and shown on its Controller detail page. A trigger (not
-- app code) generates it so it's set no matter which path creates the row
-- (provision_business RPC, a future direct insert, etc).
--
-- Excludes visually ambiguous characters (0/O, 1/I) since this is meant to
-- be read and typed by humans.

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
    exit when not exists (select 1 from businesses where access_code = code);
  end loop;
  return code;
end;
$$;

alter table businesses add column access_code text;

update businesses set access_code = generate_business_access_code() where access_code is null;

alter table businesses alter column access_code set not null;
alter table businesses add constraint businesses_access_code_unique unique (access_code);

create function businesses_set_access_code()
returns trigger
language plpgsql
as $$
begin
  if new.access_code is null then
    new.access_code := generate_business_access_code();
  end if;
  return new;
end;
$$;

create trigger businesses_set_access_code_trigger
  before insert on businesses
  for each row
  execute function businesses_set_access_code();
