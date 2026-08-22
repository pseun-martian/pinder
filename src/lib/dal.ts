import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Data Access Layer entry point. Every Server Component/Server Action that
 * needs the current user calls this instead of trusting src/proxy.ts alone
 * (a Proxy matcher exclusion, or a Server Action invoked on an unmatched
 * route, would otherwise slip through with no auth check at all).
 *
 * Wrapped in React's `cache()` so multiple calls within one request/render
 * pass reuse the same Supabase round trip.
 */
export const verifySession = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return { user, supabase };
});
