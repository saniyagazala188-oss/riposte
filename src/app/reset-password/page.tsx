import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";
import { NewPasswordForm } from "./NewPasswordForm";

export const metadata = { title: "Choose a new password · Riposte", robots: { index: false } };

// The password reset email signs the person in for this one step, then lands here.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Logo />
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
          <h1 className="font-display text-2xl font-bold">Choose a new password</h1>
          {user ? (
            <>
              <p className="mt-1 mb-5 text-sm text-muted">
                For <span className="font-medium text-ink">{user.email}</span>. You&apos;ll use it to log in from now on.
              </p>
              <NewPasswordForm />
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              This reset link has expired or was already used.{" "}
              <Link href="/login" className="font-semibold text-accent hover:underline">
                Request a new one
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
