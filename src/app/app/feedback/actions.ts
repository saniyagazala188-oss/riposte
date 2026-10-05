"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

const clip = (v: FormDataEntryValue | null, n = 1500) => String(v ?? "").trim().slice(0, n) || null;

export async function sendFeedback(formData: FormData) {
  const { supabase, user } = await requireUser();
  const pay = String(formData.get("would_pay") ?? "");
  const row = {
    user_id: user.id,
    email: user.email ?? null,
    uses_for: clip(formData.get("uses_for")),
    miss_most: clip(formData.get("miss_most")),
    missing: clip(formData.get("missing")),
    would_pay: ["yes", "maybe", "no"].includes(pay) ? pay : null,
    pay_amount: clip(formData.get("pay_amount"), 200),
  };
  if (!row.uses_for && !row.miss_most && !row.missing && !row.would_pay) redirect("/app/feedback?empty=1");
  const { error } = await supabase.from("feedback").insert(row);
  redirect(error ? "/app/feedback?error=1" : "/app/feedback?thanks=1");
}
