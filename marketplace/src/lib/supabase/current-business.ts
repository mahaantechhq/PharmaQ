import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Business, BusinessOwner } from "@/lib/types/database";

export interface CurrentBusinessContext {
  ownerId: string;
  owner: BusinessOwner;
  business: Business;
}

// cache() memoizes this per request — the (site) layout and most pages
// each call it, so this avoids repeating the round-trips on every render.
//
// Uses getUser() (a network round-trip that re-verifies the token with
// Supabase Auth), not getSession() (which only decodes the local cookie
// without checking it's still valid). This is called from Server Actions
// (checkout, cart, wallet, etc.) that can fire well after the page's
// initial middleware pass refreshed the cookie, once the access token has
// gone stale again — getSession() would then wrongly treat a real,
// logged-in business as unauthenticated instead of re-verifying and
// finding the session is still valid.
export const getCurrentBusiness = cache(async (): Promise<CurrentBusinessContext | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
