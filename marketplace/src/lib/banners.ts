import { createClient } from "@/lib/supabase/server";
import type { Banner } from "@/lib/types/database";

export async function getActiveHeroBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("position", "hero")
    .eq("status", "active")
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
    .order("sort_order", { ascending: true });

  return (data ?? []) as Banner[];
}
