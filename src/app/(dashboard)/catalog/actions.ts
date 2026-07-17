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

export async function createCatalogEntry(table: "categories" | "brands" | "manufacturers", name: string) {
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
