import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · Riposte" };

export default async function LoginPage() {
  // Already signed in: go straight to the dashboard.
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (user) redirect("/app");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h1 className="font-display text-2xl font-bold">Welcome to Riposte</h1>
          <p className="mt-1 mb-5 text-sm text-muted">Log in, or sign up to create your workspace.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
