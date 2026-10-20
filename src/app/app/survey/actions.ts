"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { SURVEY, type SurveyKey } from "@/lib/survey";

const pick = (key: SurveyKey, v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return (SURVEY[key].options as readonly (readonly [string, string])[]).some(([o]) => o === s) ? s : null;
};

export async function sendSurvey(formData: FormData) {
  const { supabase, user } = await requireUser();
  const call = String(formData.get("call_ok") ?? "");
  const row = {
    user_id: user.id,
    email: user.email ?? null,
    before_tool: pick("before_tool", formData.get("before_tool")),
    most_useful: pick("most_useful", formData.get("most_useful")),
    disappointment: pick("disappointment", formData.get("disappointment")),
    fair_price: pick("fair_price", formData.get("fair_price")),
    missing: String(formData.get("missing") ?? "").trim().slice(0, 1500) || null,
    call_ok: call === "yes" ? true : call === "no" ? false : null,
    answered_at: new Date().toISOString(),
  };
  if (!row.before_tool && !row.most_useful && !row.disappointment && !row.fair_price && !row.missing) redirect("/app/survey?empty=1");
  const { error } = await supabase.from("beta_survey").upsert(row, { onConflict: "user_id" });
  revalidatePath("/app", "layout");
  redirect(error ? "/app/survey?error=1" : "/app/survey?thanks=1");
}

// "Not now" on the card: hide it. The one reminder email can still go out later.
export async function dismissSurvey() {
  const { supabase, user } = await requireUser();
  await supabase
    .from("beta_survey")
    .upsert({ user_id: user.id, email: user.email ?? null, dismissed_at: new Date().toISOString() }, { onConflict: "user_id" });
  revalidatePath("/app", "layout");
}
