"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { discoverSources } from "@/lib/discovery";
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
