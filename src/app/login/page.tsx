import { Suspense } from "react";
import { Logo } from "@/components/Logo";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · Riposte" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h1 className="font-display text-2xl font-bold">Log in to Riposte</h1>
          <p className="mt-1 mb-5 text-sm text-muted">New here? Logging in creates your workspace.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
