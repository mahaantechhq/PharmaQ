import { createClient } from "@/lib/supabase/server";
import type { Banner } from "@/lib/types/database";

export async function getActiveHeroBanners(): Promise<Banner[]> {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  // ends_at is a date-only value stored at midnight UTC of that day -- an
  // "Ends Aug 5" banner is meant to run through all of Aug 5, so it should
  // only drop out once we're past that whole day, not the instant it turns
  // Aug 5. Comparing against the start of today (not the exact time now)
  // keeps it showing for its entire last day.
  const startOfTodayIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();

  const { data } = await supabase
    .from("banners")
    .select("*")
    .eq("position", "hero")
    .eq("status", "active")
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gte.${startOfTodayIso}`)
    .order("sort_order", { ascending: true });

  return (data ?? []) as Banner[];
}
