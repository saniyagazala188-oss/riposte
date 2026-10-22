"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { emailConfigured, sendEmail } from "@/lib/notify/send";
import { inviteMessage } from "@/lib/invite";
import { nextBatchMessage, removedMessage } from "@/lib/nextBatch";

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
  // If they were in the next batch, that's done now (fine if the 0021 column isn't there yet).
  await db.from("waitlist").update({ next_batch_at: null }).eq("email", email);
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

// Moves someone to the next batch: they stay on the list and get a polite "your spot is saved" email.
export async function moveToNextBatch(formData: FormData) {
  const db = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const { error } = await db.from("waitlist").update({ next_batch_at: new Date().toISOString() }).eq("email", email);
  if (error) redirect("/app/admin?error=batch");

  let mail = "off";
  if (emailConfigured()) {
    try {
      await sendEmail(email, nextBatchMessage());
      mail = "sent";
    } catch {
      mail = "failed";
    }
  }
  revalidatePath("/app/admin");
  redirect(`/app/admin?batched=${encodeURIComponent(email)}&mail=${mail}`);
}

// Deletes a waitlist row for good. A bot gets no email; a real person can get a short, kind note.
export async function deleteFromWaitlist(formData: FormData) {
  const db = await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const view = String(formData.get("view") ?? "");
  const { error } = await db.from("waitlist").delete().eq("email", email).is("approved_at", null);
  if (error) redirect("/app/admin?error=delete");

  let mail = "none";
  if (formData.get("note") === "1") {
    mail = "off";
    if (emailConfigured()) {
      try {
        await sendEmail(email, removedMessage());
        mail = "sent";
      } catch {
        mail = "failed";
      }
    }
  }
  revalidatePath("/app/admin");
  redirect(`/app/admin?${view === "next" ? "view=next&" : ""}deleted=${encodeURIComponent(email)}&mail=${mail}`);
}
