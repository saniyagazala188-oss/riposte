import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Feed · Riposte" };
export const dynamic = "force-dynamic";

// Phase 1: the signed-in home. Later phases fill it with the signal feed.
export default async function AppHome() {
  const supabase = await createClient();
  if (!supabase) redirect("/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("product_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Logo href="/app" />
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted sm:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-line px-3 py-1.5 font-medium hover:border-muted">Log out</button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">Your workspace</p>
        <h1 className="mt-1 font-display text-3xl font-bold">
          {profile?.product_name ? `Welcome back to ${profile.product_name}'s feed` : "Welcome to Riposte"}
        </h1>
        <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-8 text-center">
          <p className="font-semibold">Your signal feed will appear here.</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Next step: tell Riposte about your product and add your first competitors. That arrives in phase 2.
          </p>
        </div>
      </main>
    </div>
  );
}
