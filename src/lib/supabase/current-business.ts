import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessOwner } from "@/lib/types/database";

export interface CurrentBusinessContext {
  ownerId: string;
  owner: BusinessOwner;
  business: Business;
}

// cache() memoizes this per request, so calling it from both a layout and
// its page (a common pattern here) only hits the network once instead of
// twice — each call was 3 sequential round-trips to Supabase.
//
// Uses getSession() (reads the already-verified JWT from the cookie) rather
// than getUser() (a second network round-trip to re-verify with Supabase
// Auth) — middleware already calls getUser() and refreshes the cookie on
// every request before this ever runs, so the session reaching here has
// already been server-verified. Any forged/stale token still can't read or
// write real data: every table query goes through RLS with this same JWT,
// which is the actual enforcement boundary, not this lookup.
export const getCurrentBusiness = cache(async (): Promise<CurrentBusinessContext | null> => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  const { data: owner } = await supabase
    .from("business_owners")
    .select("*, businesses(*)")
    .eq("id", user.id)
    .single();

  if (!owner || !owner.businesses) return null;

  const { businesses: business, ...ownerFields } = owner as BusinessOwner & { businesses: Business };

  return { ownerId: user.id, owner: ownerFields as BusinessOwner, business };
});
