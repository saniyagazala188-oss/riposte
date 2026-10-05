import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/access";
import { mockEnabled } from "@/lib/supabase/mock";

// For pages and actions inside /app: returns the Supabase client and the signed-in user,
// or sends the visitor to the login page. During the invite-only beta, people who aren't
// approved yet are added to the waitlist and sent to the "you're on the list" page.
export async function requireUser() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!mockEnabled() && !isAdmin(user.email)) {
    const { data: approved, error } = await supabase.rpc("is_approved");
    // If the approval check isn't set up yet (migration 0014 not run), let people in
    // rather than locking everyone out.
    if (!error && approved === false) {
      if (user.email) await supabase.from("waitlist").insert({ email: user.email.toLowerCase(), source: "signed up" });
      redirect("/waitlist");
    }
  }
  return { supabase, user };
}
