import { Logo } from "@/components/Logo";
import { AppSidebar } from "@/components/AppNav";
import { requireUser } from "@/lib/auth";
import { isAdmin, limitsFor } from "@/lib/access";
import { BetaBar } from "@/components/BetaBar";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const admin = isAdmin(user.email);
  const [{ count: toReview }, { count: openActions }, { count: competitors }, { count: prompts }] = await Promise.all([
    supabase.from("signals").select("id", { count: "exact", head: true }).eq("status", "new").eq("noise", false),
    supabase.from("action_items").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("competitors").select("id", { count: "exact", head: true }),
    supabase.from("ai_prompts").select("id", { count: "exact", head: true }).eq("tracked", true),
  ]);

  return (
    <div className="min-h-dvh">
      <AppSidebar logo={<Logo href="/app" />} email={user.email ?? ""} counts={{ toReview: toReview ?? 0, openActions: openActions ?? 0 }} admin={admin} />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {!admin && <BetaBar competitors={competitors ?? 0} prompts={prompts ?? 0} limits={limitsFor(user.email)} />}
          {children}
        </div>
      </main>
    </div>
  );
}
