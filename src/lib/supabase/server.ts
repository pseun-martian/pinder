import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

/**
 * Server-side Supabase client for use inside Server Components, Server
 * Actions, and Route Handlers. MUST be created fresh per request — never
 * cache/reuse this across requests (it closes over the current request's
 * cookie jar).
 *
 * Reads the user's session from cookies via RLS-safe `anon` key; every
 * query made through this client is subject to the Postgres RLS policies
 * defined in supabase/migrations — it does NOT bypass row-level security.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
            // Called from a Server Component (not an Action/Route Handler) —
            // cookies() is read-only there. Safe to ignore: the proxy
            // (src/proxy.ts) refreshes the session cookie on every request,
            // so an expiring session is still handled on the next request.
          }
        },
      },
    },
  );
}
