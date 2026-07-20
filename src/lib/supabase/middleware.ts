import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // This call's real job is refreshing the access token and writing the
  // rotated cookies onto `response` above -- every page under (dashboard)
  // already enforces its own auth redirect server-side via
  // getCurrentBusiness() in layout.tsx, so that's the actual security
  // boundary, not this. Middleware used to *also* redirect unauthenticated
  // requests to /login, but that duplicate check raced against this same
  // refresh under concurrent requests (a reload, or multiple tabs): one
  // request's rotated refresh token would invalidate the other's, `user`
  // would come back null for the loser, and it would redirect to /login
  // even though the browser already had a valid session from the winner --
  // bouncing forever between /login and /dashboard (ERR_TOO_MANY_REDIRECTS).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}
