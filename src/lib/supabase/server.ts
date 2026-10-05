import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

// Supabase client for server components, server actions and route handlers.
// It reads and writes the login session from cookies.
export async function createClient() {
  // Local preview with sample data (development only, see mock.ts).
  if (process.env.RIPOSTE_MOCK === "1" && process.env.NODE_ENV !== "production") {
    const { createMockClient } = await import("./mock");
    return createMockClient() as never;
  }
  const env = getSupabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
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
          // Called from a server component, where cookies are read-only.
          // The middleware refreshes the session instead, so this is safe to ignore.
        }
      },
    },
  });
}
