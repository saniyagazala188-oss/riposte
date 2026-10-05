import Link from "next/link";
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
      <SiteHeader />
      <main className="mx-auto max-w-xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free beta</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">You&apos;re on the list.</h1>
        <p className="mt-4 text-lg text-muted">
          Riposte is invite-only while it&apos;s in beta, so every team gets a good experience. I approve new people
          every few days, and you&apos;ll get an email when you&apos;re in.
        </p>
        <p className="mt-4 text-muted">
          Signed in as <span className="font-semibold text-ink">{user.email}</span>.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href="/blog" className="font-medium text-accent hover:underline">
            Read the blog
          </Link>
          <Link href="/changelog" className="font-medium text-accent hover:underline">
            See what&apos;s new
          </Link>
          <form action="/auth/signout" method="post">
            <button className="text-sm font-medium text-muted hover:text-ink">Log out</button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
