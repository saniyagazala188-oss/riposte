"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured, sendEmail } from "@/lib/notify/send";
import { inviteMessage } from "@/lib/invite";

async function requireAdmin() {
  const { user } = await requireUser();
  if (!isAdmin(user.email)) redirect("/app");
  const db = createAdminClient();
  if (!db) redirect("/app/admin?error=key");
  return db;
}

// Approves an email (adding it to the list if it isn't there yet) and emails the invite.
export async function approveEmail(formData: FormData) {
  const db = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) redirect("/app/admin?error=email");

  const now = new Date().toISOString();
  const { error } = await db
    .from("waitlist")
    .upsert({ email, source: String(formData.get("source") ?? "") || "added by admin", approved_at: now }, { onConflict: "email" });
  if (error) redirect(`/app/admin?error=save`);

  let mail = "off";
  if (emailConfigured()) {
    try {
      await sendEmail(email, inviteMessage(email));
      await db.from("waitlist").update({ invited_at: now }).eq("email", email);
      mail = "sent";
    } catch {
      mail = "failed";
    }
  }
  revalidatePath("/app/admin");
  redirect(`/app/admin?approved=${encodeURIComponent(email)}&mail=${mail}`);
}

// Takes access away again (their data stays).
export async function unapproveEmail(formData: FormData) {
  const db = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  await db.from("waitlist").update({ approved_at: null }).eq("email", email);
  revalidatePath("/app/admin");
  redirect("/app/admin");
}
