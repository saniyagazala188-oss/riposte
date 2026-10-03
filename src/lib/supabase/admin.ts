import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client with full access, for the automatic daily check.
// It uses the secret key, which must never reach the browser or the code on GitHub.
// Returns null when the key isn't set, so the rest of the app still works.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
