import { Logo } from "@/components/Logo";
import { AppSidebar } from "@/components/AppNav";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser();
  const [{ count: toReview }, { count: openActions }] = await Promise.all([
    supabase.from("signals").select("id", { count: "exact", head: true }).eq("status", "new").eq("noise", false),
    supabase.from("action_items").select("id", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return (
    <div className="min-h-dvh">
      <AppSidebar logo={<Logo href="/app" />} email={user.email ?? ""} counts={{ toReview: toReview ?? 0, openActions: openActions ?? 0 }} admin={isAdmin(user.email)} />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
