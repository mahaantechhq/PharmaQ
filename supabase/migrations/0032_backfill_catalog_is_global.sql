-- resolveCatalogId (bulk-upload auto-create path in products/actions.ts)
-- never set is_global, and the column defaults to true -- so every
-- category/brand auto-created during a bulk upload was mislabeled as
-- shared global taxonomy instead of that business's own custom entry,
-- hiding it from the new edit UI (which only shows the edit button for
-- !is_global). Fixed going forward; this backfills existing rows.
--
-- Caveat: if a super admin ever deliberately promoted a business-created
-- entry to global via the Controller's "is global" toggle, this reverts
-- that -- acceptable since the bulk-upload bug is overwhelmingly the more
-- common cause of this state.

update categories set is_global = false where created_by_business_id is not null and is_global = true;
update brands set is_global = false where created_by_business_id is not null and is_global = true;
