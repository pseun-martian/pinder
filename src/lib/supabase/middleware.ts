import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Session-refresh + route-guard logic, called from src/proxy.ts on every
 * matched request. Runs on the Node.js runtime (Proxy no longer supports
 * Edge as of Next.js 16).
 *
 * `supabase.auth.getUser()` — not `getSession()` — is used deliberately: it
 * revalidates the token against the Supabase Auth server instead of trusting
 * whatever is sitting in the (client-writable) cookie.
 *
 * This is an OPTIMISTIC check only, per Next.js's own guidance: it keeps
 * signed-out users off `/app/*` and refreshes the session cookie so it
 * doesn't expire mid-session. It is NOT the authorization boundary — every
 * Server Action and data query re-verifies `auth.uid()` / RLS independently,
 * because a Proxy matcher exclusion (or a Server Action's own route) can
 * bypass this file entirely.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const requiresAuth = path.startsWith("/app");

  if (!user && requiresAuth) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", path);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
