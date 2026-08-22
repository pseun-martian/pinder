import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Service-role Supabase client. BYPASSES ROW LEVEL SECURITY — never import
 * this into a Client Component and never expose `SUPABASE_SERVICE_ROLE_KEY`
 * outside server code.
 *
 * Used only by the read-only share page to mint short-lived signed URLs for
 * images living in the private `place-images` Storage bucket (the anonymous
 * viewer has no Storage permissions of their own — see
 * src/app/share/tours/[token]/page.tsx).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
