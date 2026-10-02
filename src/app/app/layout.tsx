import { Logo } from "@/components/Logo";
import { AppNav } from "@/components/AppNav";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireUser();

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <Logo href="/app" />
            <div className="hidden md:block">
              <AppNav />
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted lg:inline">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button className="rounded-lg border border-line px-3 py-1.5 font-medium hover:border-muted">Log out</button>
            </form>
          </div>
          <div className="w-full md:hidden">
            <AppNav />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
