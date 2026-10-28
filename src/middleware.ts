import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { detectBot } from "@/lib/aiBots";

// Runs before every page load:
// 1. keeps the login session fresh
// 2. sends signed-out visitors away from the app area to the login page
// 3. logs visits from AI crawlers and search bots (bot name, page, time), without slowing the page
export async function middleware(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });
  if (process.env.RIPOSTE_MOCK === "1" && process.env.NODE_ENV !== "production") return response;

  const bot = detectBot(request.headers.get("user-agent"));
  if (bot) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      event.waitUntil(
        fetch(`${url}/rest/v1/bot_visits`, {
          method: "POST",
          headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer: "return=minimal" },
          body: JSON.stringify({ bot: bot.name, company: bot.company, purpose: bot.purpose, path: request.nextUrl.pathname.slice(0, 300) }),
        }).catch(() => undefined),
      );
    }
    return response; // bots never have a login session to refresh
  }

  const env = getSupabaseEnv();
  if (!env) return response;

  const supabase = createServerClient(env.url, env.anonKey, {
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
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Signed-in visitors skip the login page.
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
