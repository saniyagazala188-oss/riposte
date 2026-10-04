"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { discoverSources } from "@/lib/discovery";
import { checkSources, type SourceRow } from "@/lib/fetcher/check";
import { createAdminClient } from "@/lib/supabase/admin";
import { processChanges } from "@/lib/signals/process";
import { generateJson, geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { buildKitPrompt, cleanKit, KIT_SCHEMA } from "@/lib/actions/prompt";
import { SOURCE_LABELS as PAGE_LABELS, type SourceType as PageType } from "@/lib/discovery/parse";
import { sendAlerts, sendDigests } from "@/lib/notify/alerts";
import { emailConfigured, sendEmail, sendSlack } from "@/lib/notify/send";
import { SITE_URL } from "@/lib/notify/templates";
import { loadContent } from "@/lib/content/load";
import { findStories, findTrends } from "@/lib/insights/run";
import { titlesForTopics } from "@/lib/content/stats";
import { buildTopicPrompt, cleanTopics, TOPIC_SCHEMA } from "@/lib/content/topics";
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
  const differentiators = String(formData.get("differentiators") ?? "").trim().slice(0, 600);
  if (!product_name) return { status: "error", message: "Add your product's name." };

  const { error } = await supabase
    .from("profiles")
    .update({ product_name, product_pitch, ideal_customer, differentiators: differentiators || null })
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
  const { supabase, user } = await requireUser();
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

  const results = await checkSources(supabase, sources as SourceRow[], { concurrency: 4, budgetMs: 40000 });
  const ai = await explainAndAlert(user.id, supabase);
  // New signals may connect to earlier ones from this competitor: look for linked moves.
  let linked = 0;
  if (ai.written) {
    try {
      linked = (await findStories(supabase, user.id, competitorId, { timeoutMs: 15000 })).found;
    } catch {
      // linking is a bonus; the check itself succeeded
    }
  }
  revalidatePath("/app", "layout");

  const changed = results.filter((r) => r.status === "changed").length;
  const baseline = results.filter((r) => r.status === "baseline").length;
  const unchanged = results.filter((r) => r.status === "unchanged").length;
  const problems = results.filter((r) => !["changed", "baseline", "unchanged"].includes(r.status)).length;
  const skipped = sources.length - results.length;

  const parts = [
    `Checked ${results.length} ${results.length === 1 ? "page" : "pages"}.`,
    changed ? `${changed} changed.` : "",
    baseline ? `${baseline} saved as a starting point for future comparisons.` : "",
    unchanged ? `${unchanged} unchanged since the last check.` : "",
    problems ? `${problems} couldn't be read; see the notes below.` : "",
    skipped ? `${skipped} will be checked next time.` : "",
    ai.written ? `${ai.written} new ${ai.written === 1 ? "signal" : "signals"} explained.` : "",
    ai.waiting ? `${ai.waiting} ${ai.waiting === 1 ? "change is" : "changes are"} waiting to be explained.` : "",
    linked ? `${linked} connected ${linked === 1 ? "move" : "moves"} found.` : "",
  ];
  return { status: "done", message: parts.filter(Boolean).join(" ") };
}

// Explains this user's new changes with AI, then sends alerts in the background.
async function explainAndAlert(userId: string, userClient: Awaited<ReturnType<typeof requireUser>>["supabase"]) {
  const admin = createAdminClient();
  const ai = await processChanges(admin ?? userClient, { userId, limit: 15, concurrency: 3, budgetMs: 25000 });
  if (admin && ai.written) after(() => sendAlerts(admin, { userId }).then(() => undefined));
  return ai;
}

export async function explainPending(): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const ai = await explainAndAlert(user.id, supabase);
  revalidatePath("/app", "layout");
  if (!ai.written && !ai.failed && !ai.waiting) return { status: "done", message: "Nothing waiting. Every change is explained." };
  const parts = [
    ai.written ? `${ai.written} explained.` : "",
    ai.failed ? `${ai.failed} couldn't be explained this time; Riposte will retry.` : "",
    ai.waiting ? `${ai.waiting} still waiting (the AI is busy); try again in a minute.` : "",
  ];
  return { status: "done", message: parts.filter(Boolean).join(" ") };
}

// ---------- Signals ----------

export async function setSignalStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("signal_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["new", "reviewed", "dismissed"].includes(status)) return;
  await supabase.from("signals").update({ status }).eq("id", id);
  revalidatePath("/app", "layout");
}

// ---------- Alert settings ----------

export async function saveAlertSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, user } = await requireUser();
  const slack = String(formData.get("slack_webhook_url") ?? "").trim();
  if (slack && !/^https:\/\/hooks\.slack\.com\/services\/[\w/-]+$/.test(slack)) {
    return { status: "error", message: "That doesn't look like a Slack webhook. It starts with https://hooks.slack.com/services/" };
  }
  const { error } = await supabase
    .from("profiles")
    .update({
      email_alerts: formData.get("email_alerts") === "on",
      weekly_digest: formData.get("weekly_digest") === "on",
      slack_webhook_url: slack || null,
    })
    .eq("id", user.id);
  if (error) return { status: "error", message: "Couldn't save. Please try again." };
  revalidatePath("/app/settings");
  return { status: "saved" };
}

export async function sendTest(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  const what = String(formData.get("what") ?? "");
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, slack_webhook_url")
    .eq("id", user.id)
    .maybeSingle();

  try {
    if (what === "slack") {
      if (!profile?.slack_webhook_url) return { status: "error", message: "Save a Slack webhook first." };
      await sendSlack(profile.slack_webhook_url, {
        text: `*Riposte is connected.* High-impact competitor changes and the weekly digest will be posted here. <${SITE_URL}/app|Open your feed>`,
      });
      return { status: "done", message: "Sent. Check your Slack channel." };
    }
    if (!emailConfigured()) return { status: "error", message: "Email isn't set up yet: the RESEND_API_KEY setting is missing." };
    if (!profile?.email) return { status: "error", message: "No email address on your account." };
    if (what === "digest") {
      const admin = createAdminClient();
      if (!admin) return { status: "error", message: "The SUPABASE_SERVICE_ROLE_KEY setting is missing." };
      const result = await sendDigests(admin, { userId: user.id, force: true });
      if (result.errors.length) throw new Error(result.errors[0]);
      if (!result.sent) return { status: "error", message: "Turn on the weekly digest and add a competitor first." };
      return { status: "done", message: `This week's digest is on its way to ${profile.email}.` };
    }
    await sendEmail(profile.email, {
      subject: "Riposte email alerts are working",
      html: `<p>This is a test from Riposte. High-impact competitor changes will arrive at this address.</p><p><a href="${SITE_URL}/app">Open your feed</a></p>`,
      text: `This is a test from Riposte. High-impact competitor changes will arrive at this address. ${SITE_URL}/app`,
    });
    return { status: "done", message: `Sent to ${profile.email}. Check your inbox (and spam, the first time).` };
  } catch (e) {
    return { status: "error", message: `Couldn't send: ${(e as Error).message}` };
  }
}

// ---------- Action kit ----------

type KitSignal = {
  id: string;
  competitor_id: string;
  title: string;
  what_changed: string;
  so_what: string;
  action: string;
  impact: string;
  category: string;
  competitors: { name: string } | null;
  changes: { kind: "content" | "new_posts" | "new_pages"; added: unknown[]; removed: unknown[]; sources: { type: PageType; url: string } | null } | null;
};

export async function buildActionKit(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const signalId = String(formData.get("signal_id") ?? "");
  const redo = formData.get("redo") === "1";

  const [{ data: signal }, { data: profile }] = await Promise.all([
    supabase
      .from("signals")
      .select("id, competitor_id, title, what_changed, so_what, action, impact, category, competitors(name), changes(kind, added, removed, sources(type, url))")
      .eq("id", signalId)
      .maybeSingle(),
    supabase.from("profiles").select("product_name, product_pitch, ideal_customer, differentiators").eq("id", user.id).maybeSingle(),
  ]);
  if (!signal) return { status: "error", message: "Signal not found." };
  const s = signal as unknown as KitSignal;

  const prompt = buildKitPrompt(profile ?? { product_name: null, product_pitch: null, ideal_customer: null }, {
    title: s.title,
    what_changed: s.what_changed,
    so_what: s.so_what,
    action: s.action,
    impact: s.impact,
    category: s.category,
    competitorName: s.competitors?.name ?? "the competitor",
    pageType: s.changes?.sources ? PAGE_LABELS[s.changes.sources.type] : "Page",
    pageUrl: s.changes?.sources?.url ?? "",
    change: s.changes ? { kind: s.changes.kind, added: s.changes.added ?? [], removed: s.changes.removed ?? [] } : null,
  });

  let items;
  try {
    items = cleanKit(await generateJson(prompt, KIT_SCHEMA, { timeoutMs: 55000 }));
  } catch (e) {
    if (e instanceof RateLimited || e instanceof Overloaded)
      return { status: "error", message: "Google's AI is overloaded right now (this happens at busy times). Try again in a minute." };
    const detail = (e as Error).name === "AbortError" ? "the AI took longer than 55 seconds" : (e as Error).message.slice(0, 200);
    console.error("buildActionKit failed:", e);
    return { status: "error", message: `Couldn't build the kit this time (${detail}). Please try again.` };
  }
  if (!items.length) return { status: "error", message: "The AI's answer wasn't usable. Please try again." };

  if (redo) await supabase.from("action_items").delete().eq("signal_id", s.id).eq("status", "open");
  const { error } = await supabase.from("action_items").insert(
    items.map((it, i) => ({ ...it, position: i, user_id: user.id, signal_id: s.id, competitor_id: s.competitor_id })),
  );
  if (error) return { status: "error", message: "Couldn't save the kit. Please try again." };

  revalidatePath("/app", "layout");
  return { status: "done", message: `${items.length} actions ready.` };
}

export async function setActionStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("action_id") ?? "");
  const status = formData.get("status") === "done" ? "done" : "open";
  const { data: item } = await supabase
    .from("action_items")
    .update({ status, done_at: status === "done" ? new Date().toISOString() : null })
    .eq("id", id)
    .select("signal_id")
    .maybeSingle();

  // When the last open action of a kit is done, the signal no longer needs review.
  if (item && status === "done") {
    const { count } = await supabase
      .from("action_items")
      .select("id", { count: "exact", head: true })
      .eq("signal_id", item.signal_id)
      .eq("status", "open");
    if (count === 0) await supabase.from("signals").update({ status: "reviewed" }).eq("id", item.signal_id).eq("status", "new");
  }
  revalidatePath("/app", "layout");
}

// ---------- Content intelligence ----------

export async function analyseTopics(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  if (!geminiConfigured()) return { status: "error", message: "AI isn't set up yet: the GEMINI_API_KEY setting is missing." };
  const competitorId = String(formData.get("competitor_id") ?? "");
  const [{ data: competitor }, { data: profile }] = await Promise.all([
    supabase.from("competitors").select("id, name").eq("id", competitorId).maybeSingle(),
    supabase.from("profiles").select("product_name, product_pitch, ideal_customer").eq("id", user.id).maybeSingle(),
  ]);
  if (!competitor) return { status: "error", message: "Competitor not found." };

  const content = (await loadContent(supabase, [competitor.id])).get(competitor.id)!;
  const titles = titlesForTopics(content.feed, content.urls);
  if (titles.length < 5) {
    return {
      status: "error",
      message: "Not enough content to find topics yet. Riposte needs this competitor's blog feed or sitemap, checked at least once.",
    };
  }

  let result;
  try {
    result = cleanTopics(
      await generateJson(
        buildTopicPrompt(competitor.name, titles, profile ?? { product_name: null, product_pitch: null, ideal_customer: null }),
        TOPIC_SCHEMA,
        { timeoutMs: 50000 },
      ),
      titles.length,
    );
  } catch (e) {
    if (e instanceof RateLimited || e instanceof Overloaded)
      return { status: "error", message: "Google's AI is overloaded right now. Try again in a minute." };
    return { status: "error", message: `Couldn't find topics this time (${(e as Error).message.slice(0, 160)}).` };
  }
  if (!result) return { status: "error", message: "The AI's answer wasn't usable. Please try again." };

  const { error } = await supabase.from("content_topics").upsert(
    {
      user_id: user.id,
      competitor_id: competitor.id,
      generated_at: new Date().toISOString(),
      source_count: titles.length,
      summary: result.summary,
      topics: result.topics,
    },
    { onConflict: "competitor_id" },
  );
  if (error) return { status: "error", message: "Couldn't save the topics. Please try again." };
  revalidatePath("/app", "layout");
  return { status: "done", message: `Found ${result.topics.length} topics in ${titles.length} titles.` };
}

// ---------- Linked signals and trends ----------

function aiError(e: unknown): CheckState {
  if (e instanceof RateLimited || e instanceof Overloaded)
    return { status: "error", message: "Google's AI is overloaded right now. Try again in a minute." };
  return { status: "error", message: `Couldn't finish this time (${(e as Error).message.slice(0, 160)}).` };
}

export async function findStoriesAction(_prev: CheckState, formData: FormData): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  try {
    const r = await findStories(supabase, user.id, String(formData.get("competitor_id") ?? ""));
    revalidatePath("/app", "layout");
    return { status: "done", message: r.message };
  } catch (e) {
    return aiError(e);
  }
}

export async function findTrendsAction(): Promise<CheckState> {
  const { supabase, user } = await requireUser();
  try {
    const r = await findTrends(supabase, user.id);
    revalidatePath("/app", "layout");
    return { status: "done", message: r.message };
  } catch (e) {
    return aiError(e);
  }
}

export async function setInsightStatus(formData: FormData) {
  const { supabase } = await requireUser();
  const table = formData.get("kind") === "trend" ? "trends" : "stories";
  const status = String(formData.get("status") ?? "");
  if (!["new", "reviewed", "dismissed"].includes(status)) return;
  await supabase.from(table).update({ status }).eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/app", "layout");
}
