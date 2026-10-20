"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { SURVEY, type SurveyKey } from "@/lib/survey";

const valid = (key: SurveyKey, s: string) => (SURVEY[key].options as readonly (readonly [string, string])[]).some(([o]) => o === s);
const pick = (key: SurveyKey, v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return valid(key, s) ? s : null;
};
// Checkbox questions: every ticked option, plus their own words for "Something else".
const pickMany = (key: SurveyKey, formData: FormData) => {
  const picked = formData.getAll(key).map(String).filter((s) => valid(key, s) && s !== "other");
  const own = String(formData.get(`${key}_other`) ?? "").replace(/\|/g, "/").trim().slice(0, 200);
  if (own) picked.push(`other:${own}`);
  else if (formData.getAll(key).map(String).includes("other")) picked.push("other");
  return picked.length ? picked.join("|") : null;
};

export async function sendSurvey(formData: FormData) {
  const { supabase, user } = await requireUser();
  const call = String(formData.get("call_ok") ?? "");
  const row = {
    user_id: user.id,
    email: user.email ?? null,
    before_tool: pickMany("before_tool", formData),
    most_useful: pickMany("most_useful", formData),
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
