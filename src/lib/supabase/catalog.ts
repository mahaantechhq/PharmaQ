import { createClient } from "@/lib/supabase/server";
import type { Category, Brand } from "@/lib/types/database";

export async function getCatalogMasters() {
  const supabase = await createClient();

  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("brands").select("*").order("name"),
  ]);

  return {
    categories: (categories ?? []) as Category[],
    brands: (brands ?? []) as Brand[],
  };
}
