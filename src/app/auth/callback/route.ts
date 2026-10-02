import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// The magic link in the login email points here.
// It swaps the one-time code for a login session, then opens the app.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(`${origin}/app`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=link`);
}
