"use server";

import { createClient } from "@/lib/supabase/server";

export type WaitlistState = { status: "idle" | "joined" | "error"; message?: string };

// Saves an email to the waitlist table.
export async function joinWaitlist(_prev: WaitlistState, formData: FormData): Promise<WaitlistState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error", message: "The waitlist isn't connected yet. Please try again soon." };
  }

  const { error } = await supabase.from("waitlist").insert({ email, source: "landing" });
  // 23505 = this email is already on the list, which is fine.
  if (error && error.code !== "23505") {
    return { status: "error", message: "Something went wrong saving your email. Please try again." };
  }
  return { status: "joined" };
}
