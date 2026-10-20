"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { notifyProblem } from "@/lib/notify/admin";

const clip = (v: FormDataEntryValue | null, n = 1500) => String(v ?? "").trim().slice(0, n) || null;

// "Report a problem": what went wrong, what they expected, where, their browser and up to 3 screenshots
// (already uploaded from the browser into their own folder in the private "reports" bucket).
export async function sendFeedback(formData: FormData) {
  const { supabase, user } = await requireUser();
  const shots = formData
    .getAll("shot")
    .map(String)
    .filter((p) => p.startsWith(`${user.id}/`))
    .slice(0, 3);
  const row = {
    user_id: user.id,
    email: user.email ?? null,
    missing: clip(formData.get("missing"), 3000),
    expected: clip(formData.get("expected")),
    uses_for: clip(formData.get("uses_for"), 300),
    page_url: clip(formData.get("page_url"), 500),
    browser: clip(formData.get("browser"), 300),
    screenshot_paths: shots.length ? shots : null,
  };
  if (!row.missing) redirect("/app/feedback?empty=1");
  let { error } = await supabase.from("feedback").insert(row);
  if (error && /column|schema cache/i.test(error.message)) {
    // migration 0019 not run yet: save the basics so the report isn't lost
    ({ error } = await supabase.from("feedback").insert({ user_id: row.user_id, email: row.email, missing: row.missing, uses_for: row.uses_for }));
  }
  if (!error) await notifyProblem(user.email ?? "A beta user", row.missing, row.uses_for, shots.length);
  redirect(error ? "/app/feedback?error=1" : "/app/feedback?thanks=1");
}
