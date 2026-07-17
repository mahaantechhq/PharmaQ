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
// Uses getSession() rather than getUser() — middleware already verifies
// the token with Supabase Auth and refreshes the cookie on every request,
// so re-verifying again here is a redundant network round-trip. Every
// actual table query still goes through RLS with this session's JWT, which
// is the real enforcement boundary.
export const getCurrentAdmin = cache(async (): Promise<CurrentAdminContext | null> => {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) return null;

  const { data: admin } = await supabase.from("super_admins").select("id").eq("id", user.id).maybeSingle();

  if (!admin) return null;

  return { adminId: user.id, email: user.email ?? "" };
});
