import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // See server.ts -- makes the auth cookie a session cookie (cleared on
    // browser close) instead of surviving 400 days by default.
    { cookieOptions: { maxAge: undefined } },
  );
}
