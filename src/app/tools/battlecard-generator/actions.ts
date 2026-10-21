"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockEnabled } from "@/lib/supabase/mock";
import { normalizeDomain } from "@/lib/discovery/parse";
import { geminiConfigured } from "@/lib/ai/gemini";
import { buildBattlecard, sampleBattlecard, SiteUnreadable, type BattlecardResult } from "@/lib/tools/battlecard";

export type ToolState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "done"; left: number } & BattlecardResult);

const PER_VISITOR = 3; // runs per visitor per day
const PER_DAY = 150; // runs for everyone per day, to cap AI costs
const DAY = 24 * 60 * 60 * 1000;

const fail = (message: string): ToolState => ({ status: "error", message });

export async function makeBattlecard(_prev: ToolState, formData: FormData): Promise<ToolState> {
  // Bot trap, same as the waitlist: a hidden field, and a form sent within 2 seconds.
  const shownAt = Number(formData.get("t") ?? 0);
  if (String(formData.get("website") ?? "").trim() || (shownAt > 0 && Date.now() - shownAt < 2000)) {
    return fail("Something went wrong. Please try again.");
  }

  const product = String(formData.get("product") ?? "").trim().slice(0, 80);
  const about = String(formData.get("about") ?? "").trim().slice(0, 400);
  const yourRaw = String(formData.get("your_site") ?? "").trim();
  const competitorDomain = normalizeDomain(String(formData.get("competitor") ?? ""));
  const yourDomain = yourRaw ? normalizeDomain(yourRaw) : null;

  if (!product) return fail("Add your product's name.");
  if (about.length < 15) return fail("Add a sentence about what your product does, so the card can compare.");
  if (!competitorDomain) return fail("Enter the competitor's website, like competitor.com.");
  if (yourRaw && !yourDomain) return fail("Your website doesn't look right. Use something like yourproduct.com, or leave it empty.");
  if (yourDomain && yourDomain === competitorDomain) return fail("Your website and the competitor's are the same.");

  const input = { product, about, yourDomain, competitorDomain };

  // Local preview without an AI key: show a sample card.
  if (mockEnabled() && !geminiConfigured()) return { status: "done", left: PER_VISITOR - 1, ...sampleBattlecard(input) };

  const db = createAdminClient();
  if (!db || !geminiConfigured()) return fail("The generator is resting right now. Please try again later.");

  // Usage limits. Only a scrambled IP is stored.
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.TOOL_SALT ?? "riposte-tools"}`).digest("hex");
  const since = new Date(Date.now() - DAY).toISOString();

  const [mine, all] = await Promise.all([
    db.from("tool_runs").select("id", { count: "exact", head: true }).eq("tool", "battlecard").eq("ip_hash", ipHash).gte("created_at", since),
    db.from("tool_runs").select("id", { count: "exact", head: true }).eq("tool", "battlecard").gte("created_at", since),
  ]);
  if (mine.error || all.error) return fail("The generator is resting right now. Please try again later.");
  if ((mine.count ?? 0) >= PER_VISITOR) {
    return fail(`You've made ${PER_VISITOR} battlecards today, the daily limit. Come back tomorrow, or join the Riposte beta to keep your cards current automatically.`);
  }
  if ((all.count ?? 0) >= PER_DAY) return fail("The generator is very busy today. Please try again tomorrow.");

  try {
    const result = await buildBattlecard(input);
    await db.from("tool_runs").insert({ tool: "battlecard", ip_hash: ipHash, target: competitorDomain, ok: true });
    return { status: "done", left: Math.max(0, PER_VISITOR - (mine.count ?? 0) - 1), ...result };
  } catch (e) {
    // A failed run still counts, so it can't be used to hammer a site, but it's marked as failed.
    await db.from("tool_runs").insert({ tool: "battlecard", ip_hash: ipHash, target: competitorDomain, ok: false });
    if (e instanceof SiteUnreadable) {
      return fail(`Couldn't read ${competitorDomain}. Check the address, or try their main website. Some sites block automated visits.`);
    }
    return fail("The AI took too long to answer. Please try again in a minute.");
  }
}
