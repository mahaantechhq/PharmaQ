import { createClient } from "@/lib/supabase/server";
import type { Category, Brand, Manufacturer } from "@/lib/types/database";

export async function getCatalogMasters() {
  const supabase = await createClient();

  const [{ data: categories }, { data: brands }, { data: manufacturers }] = await Promise.all([
    supabase.from("categories").select("*").order("name"),
    supabase.from("brands").select("*").order("name"),
    supabase.from("manufacturers").select("*").order("name"),
  ]);

  return {
    categories: (categories ?? []) as Category[],
    brands: (brands ?? []) as Brand[],
    manufacturers: (manufacturers ?? []) as Manufacturer[],
  };
}
