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
// Uses getUser() (a network round-trip that re-verifies the token with
// Supabase Auth), not getSession() (which only decodes the local cookie
// without checking it's still valid). This is called from Server Actions
// that can fire well after the page's initial middleware pass refreshed
// the cookie, once the access token has gone stale again — getSession()
// would then wrongly treat a real, logged-in business as unauthenticated
// instead of re-verifying and finding the session is still valid.
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
