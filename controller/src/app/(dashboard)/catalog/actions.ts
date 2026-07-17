"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/supabase/current-admin";
import { logAudit } from "@/lib/audit";

type CatalogTable = "categories" | "brands" | "manufacturers";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCatalogItem(table: CatalogTable, name: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (!name.trim()) throw new Error("Name is required");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from(table)
    .insert({ name: name.trim(), slug: `${slugify(name)}-${Date.now().toString(36)}`, is_global: true })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: `${table}.create`, entityType: table, entityId: data.id, metadata: { name } });
  revalidatePath("/catalog/categories");
}

export async function renameCatalogItem(table: CatalogTable, id: string, name: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");
  if (!name.trim()) throw new Error("Name is required");

  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ name: name.trim() }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: `${table}.rename`, entityType: table, entityId: id, metadata: { name } });
  revalidatePath("/catalog/categories");
}

export async function toggleCatalogItemGlobal(table: CatalogTable, id: string, isGlobal: boolean) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ is_global: isGlobal }).eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: `${table}.toggle_global`, entityType: table, entityId: id, metadata: { isGlobal } });
  revalidatePath("/catalog/categories");
}

export async function deleteCatalogItem(table: CatalogTable, id: string) {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error("Not authenticated as super admin");

  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);

  await logAudit({ actorId: admin.adminId, action: `${table}.delete`, entityType: table, entityId: id });
  revalidatePath("/catalog/categories");
}
