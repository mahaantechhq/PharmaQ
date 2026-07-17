import { redirect } from "next/navigation";
import { getCurrentBusiness, type CurrentBusinessContext } from "@/lib/supabase/current-business";

export async function requireCurrentBusiness(nextPath: string): Promise<CurrentBusinessContext> {
  const ctx = await getCurrentBusiness();
  if (!ctx) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return ctx;
}
