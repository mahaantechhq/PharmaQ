import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface CurrentAdminContext {
  adminId: string;
  email: string;
}

// cache() memoizes this per request — it's called from both the dashboard
// layout and most pages, so this avoids repeating the auth + admin-lookup
// round-trips on every render.
//
// Uses getUser() (a network round-trip that re-verifies the token with
// Supabase Auth), not getSession() (which only decodes the local cookie
// without checking it's still valid). This is called from Server Actions
// like createBusiness -- those can fire well after the page's initial
// middleware pass refreshed the cookie, once the access token has gone
// stale again, and getSession() would then wrongly treat a real admin as
// unauthenticated ("Not authenticated as super admin") instead of
// re-verifying and finding they're still valid.
export const getCurrentAdmin = cache(async (): Promise<CurrentAdminContext | null> => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase.from("super_admins").select("id").eq("id", user.id).maybeSingle();

  if (!admin) return null;

  return { adminId: user.id, email: user.email ?? "" };
});
