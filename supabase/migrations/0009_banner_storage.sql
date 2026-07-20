-- Storage bucket for banner images uploaded by the super admin in the
-- Controller's Marketing -> Banners page. Public bucket (banners are shown
-- to anonymous marketplace visitors too), but only a super admin can
-- write/delete objects in it.

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

-- No SELECT policy: the bucket itself is public, so GET-by-known-URL
-- already works without one. A SELECT policy on storage.objects would
-- additionally let anyone list/enumerate every file in the bucket, which
-- a public bucket doesn't need (flagged by Supabase's own security lint).

create policy banners_bucket_admin_insert on storage.objects
  for insert with check (bucket_id = 'banners' and is_super_admin());

create policy banners_bucket_admin_update on storage.objects
  for update using (bucket_id = 'banners' and is_super_admin());

create policy banners_bucket_admin_delete on storage.objects
  for delete using (bucket_id = 'banners' and is_super_admin());
