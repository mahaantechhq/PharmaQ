"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/supabase/current-business";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCatalogEntry(table: "categories" | "brands", name: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");
  if (!name.trim()) throw new Error("Name is required");

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({
    name: name.trim(),
    slug: `${slugify(name)}-${Date.now().toString(36)}`,
    is_global: false,
    created_by_business_id: ctx.business.id,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/catalog/categories");
}

export async function updateCatalogEntry(table: "categories" | "brands", id: string, name: string) {
  const ctx = await getCurrentBusiness();
  if (!ctx) throw new Error("Not authenticated");
  if (!name.trim()) throw new Error("Name is required");

  const supabase = await createClient();
  // .eq("created_by_business_id", ...) mirrors the RLS policy so renaming a
  // global/shared entry (or one another business created) fails outright
  // instead of updating 0 rows silently -- the row count check below is
  // what actually surfaces that as an error to the UI.
  const { data, error } = await supabase
    .from(table)
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("created_by_business_id", ctx.business.id)
    .select("id");

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) throw new Error("You can only rename entries your business created");

  revalidatePath("/catalog/categories");
}
