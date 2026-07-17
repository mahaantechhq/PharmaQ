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
// Uses getSession() rather than getUser() — middleware already verifies the
// token with Supabase Auth and refreshes the cookie on every request, so
// re-verifying again here is a redundant network round-trip. Every actual
// table query still goes through RLS with this session's JWT, which is the
// real enforcement boundary.
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
