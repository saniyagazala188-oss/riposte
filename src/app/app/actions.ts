"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { discoverSources } from "@/lib/discovery";
import { checkSources, type SourceRow } from "@/lib/fetcher/check";
import { createAdminClient } from "@/lib/supabase/admin";
import { nameFromDomain, normalizeDomain, type SourceType } from "@/lib/discovery/parse";

export type FormState = { status: "idle" | "saved" | "error"; message?: string };

const MAX_COMPETITORS = 10;
const SOURCE_TYPES: SourceType[] = ["changelog", "blog", "feed", "pricing", "sitemap", "other"];

// ---------- Your product ----------

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const product_name = String(formData.get("product_name") ?? "").trim().slice(0, 80);
  const product_pitch = String(formData.get("product_pitch") ?? "").trim().slice(0, 200);
  const ideal_customer = String(formData.get("ideal_customer") ?? "").trim().slice(0, 200);
  if (!product_name) return { status: "error", message: "Add your product's name." };

  const { error } = await supabase
    .from("profiles")
    .update({ product_name, product_pitch, ideal_customer })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Couldn't save. Please try again." };

  revalidatePath("/app", "layout");
  return { status: "saved" };
}

// ---------- Competitors ----------

export async function addCompetitor(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const domain = normalizeDomain(String(formData.get("domain") ?? ""));
  if (!domain) return { status: "error", message: "Enter a website like acme.com." };
  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || nameFromDomain(domain);

  const { count } = await supabase.from("competitors").select("id", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_COMPETITORS) {
    return { status: "error", message: `You can track up to ${MAX_COMPETITORS} competitors for now. Remove one to add another.` };
  }

  const { data: competitor, error } = await supabase
    .from("competitors")
    .insert({ name, domain })
    .select("id")
    .single();
  if (error || !competitor) {
    if (error?.code === "23505") return { status: "error", message: `You're already tracking ${domain}.` };
    return { status: "error", message: "Couldn't add this competitor. Please try again." };
  }

  const { found, note } = await discoverSources(domain);
  if (found.length) {
    await supabase
      .from("sources")
      .insert(found.map((f) => ({ competitor_id: competitor.id, type: f.type, url: f.url, discovered: true })));
  }
  if (note) await supabase.from("competitors").update({ discovery_note: note }).eq("id", competitor.id);

  // Run the first check in the background, so the feed isn't empty after setup.
  const competitorId = competitor.id;
  after(async () => {
    const admin = createAdminClient();
    if (!admin) return;
    const { data } = await admin
      .from("sources")
      .select("id, user_id, competitor_id, type, url")
      .eq("competitor_id", competitorId);
    if (data?.length) await checkSources(admin, data as SourceRow[], { concurrency: 4, budgetMs: 50000 });
  });

  revalidatePath("/app", "layout");
  redirect(`/app/competitors/${competitor.id}?added=1`);
}

export async function rediscover(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("competitor_id") ?? "");
  const { data: competitor } = await supabase.from("competitors").select("id, domain").eq("id", id).maybeSingle();
  if (!competitor) return;

  const { found, note } = await discoverSources(competitor.domain);
  if (found.length) {
    await supabase
      .from("sources")
      .upsert(
        found.map((f) => ({ competitor_id: competitor.id, type: f.type, url: f.url, discovered: true })),
        { onConflict: "competitor_id,url", ignoreDuplicates: true },
      );
  }
  await supabase.from("competitors").update({ discovery_note: note }).eq("id", competitor.id);
  revalidatePath(`/app/competitors/${competitor.id}`);
}

export async function updateFrequency(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("competitor_id") ?? "");
  const freq = formData.get("check_frequency") === "weekly" ? "weekly" : "daily";
  await supabase.from("competitors").update({ check_frequency: freq }).eq("id", id);
  revalidatePath(`/app/competitors/${id}`);
}

export async function deleteCompetitor(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("competitor_id") ?? "");
  await supabase.from("competitors").delete().eq("id", id);
  revalidatePath("/app", "layout");
  redirect("/app/competitors");
}

// ---------- Sources ----------

export async function addSource(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const competitor_id = String(formData.get("competitor_id") ?? "");
  const type = String(formData.get("type") ?? "") as SourceType;
  let url = String(formData.get("url") ?? "").trim();
  if (!SOURCE_TYPES.includes(type)) return { status: "error", message: "Choose what kind of page this is." };
  if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname.includes(".")) throw new Error();
    url = parsed.toString().replace(/\/$/, "");
  } catch {
    return { status: "error", message: "Enter a full web address, like https://acme.com/pricing." };
  }

  const { error } = await supabase.from("sources").insert({ competitor_id, type, url, discovered: false });
  if (error) {
    if (error.code === "23505") return { status: "error", message: "This page is already in the list." };
    return { status: "error", message: "Couldn't add this page. Please try again." };
  }
  revalidatePath(`/app/competitors/${competitor_id}`);
  return { status: "saved" };
}

export async function removeSource(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("source_id") ?? "");
  const competitor_id = String(formData.get("competitor_id") ?? "");
  await supabase.from("sources").delete().eq("id", id);
  revalidatePath(`/app/competitors/${competitor_id}`);
}

// ---------- Checks ----------

export type CheckState = { status: "idle" | "done" | "error"; message?: string };

const CHECK_COOLDOWN_MS = 5 * 60 * 1000;

export async function checkNow(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase } = await requireUser();
  const competitorId = String(formData.get("competitor_id") ?? "");
  const { data } = await supabase
    .from("sources")
    .select("id, user_id, competitor_id, type, url, last_checked_at")
    .eq("competitor_id", competitorId);
  const sources = data ?? [];
  if (!sources.length) return { status: "error", message: "Add a page to watch first." };

  const fresh = sources.every(
    (s) => s.last_checked_at && Date.now() - new Date(s.last_checked_at).getTime() < CHECK_COOLDOWN_MS,
  );
  if (fresh) return { status: "error", message: "These pages were checked a few minutes ago. Try again in 5 minutes." };

  const results = await checkSources(supabase, sources as SourceRow[], { concurrency: 4, budgetMs: 50000 });
  revalidatePath("/app", "layout");

  const changed = results.filter((r) => r.status === "changed").length;
  const baseline = results.filter((r) => r.status === "baseline").length;
  const problems = results.filter((r) => !["changed", "baseline", "unchanged"].includes(r.status)).length;
  const skipped = sources.length - results.length;

  const parts = [
    `Checked ${results.length} ${results.length === 1 ? "page" : "pages"}.`,
    changed ? `${changed} changed.` : "",
    baseline ? `${baseline} saved as a starting point for future comparisons.` : "",
    !changed && !baseline && !problems ? "No changes since the last check." : "",
    problems ? `${problems} couldn't be read; see the notes below.` : "",
    skipped ? `${skipped} will be checked next time.` : "",
  ];
  return { status: "done", message: parts.filter(Boolean).join(" ") };
}
