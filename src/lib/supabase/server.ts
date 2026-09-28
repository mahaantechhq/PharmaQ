import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore because
            // middleware refreshes the session on every request.
          }
        },
      },
      // @supabase/ssr defaults the auth cookie to a 400-day Max-Age, so it
      // survives closing the browser entirely. Omitting maxAge makes it a
      // true session cookie instead -- signed out only when the browser
      // itself is closed, not on any fixed schedule while it stays open.
      cookieOptions: { maxAge: undefined },
    },
  );
}
