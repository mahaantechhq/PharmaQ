import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only client using the service role key — bypasses RLS entirely.
// Only ever call this from server actions that have already verified the
// caller is a super admin via getCurrentAdmin().
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
