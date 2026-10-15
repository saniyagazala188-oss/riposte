import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Login links, sign-up confirmations, password resets and Google sign-in all come back here.
// It swaps the one-time code for a login session, then opens the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  // Where to go after signing in. Only pages on this site (a password reset goes to /reset-password).
  const nextParam = searchParams.get("next") ?? "";
  const next = /^\/(?!\/)[\w\-/]*$/.test(nextParam) ? nextParam : type === "recovery" ? "/reset-password" : "/app";

  // Some email templates send a token instead of a code.
  if (tokenHash && type) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "magiclink" | "email" | "recovery" });
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
