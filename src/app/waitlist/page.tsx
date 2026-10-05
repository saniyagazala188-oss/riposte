import { redirect } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/access";

export const metadata = { title: "You're on the list · Riposte", robots: { index: false } };
export const dynamic = "force-dynamic";

// Where signed-in people land while they wait to be approved for the beta.
export default async function WaitlistPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) redirect("/login");
  if (isAdmin(user.email)) redirect("/app");
  const { data: approved } = await supabase!.rpc("is_approved");
  if (approved) redirect("/app");

  return (
    <div className="min-h-dvh">
      <SiteHeader hideAuth />
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free beta</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">You&apos;re on the list.</h1>
        <p className="mt-4 text-lg text-muted">
          Riposte is invite-only while it&apos;s in beta, so every team gets a good experience. I approve new people
          every few days, and you&apos;ll get an email when you&apos;re in.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>
            Signed in as <span className="font-semibold text-ink">{user.email}</span>
          </span>
          <form action="/auth/signout" method="post" className="inline">
            <button className="font-medium text-accent hover:underline">Not you? Log out</button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
