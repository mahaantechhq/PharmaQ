import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // @supabase/ssr defaults the auth cookie to a 400-day Max-Age, so it
    // survives closing the browser entirely. Omitting maxAge here makes it
    // a true session cookie instead -- signed out only when the browser
    // itself is closed, not on any fixed schedule while it stays open.
    { cookieOptions: { maxAge: undefined } },
  );
}
