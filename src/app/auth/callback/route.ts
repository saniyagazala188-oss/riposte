import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Login links, sign-up confirmations and Google sign-in all come back here.
// It swaps the one-time code for a login session, then opens the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  // Some email templates send a token instead of a code.
  if (tokenHash && type) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "magiclink" | "email" });
      if (!error) return NextResponse.redirect(`${origin}/app`);
    }
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
