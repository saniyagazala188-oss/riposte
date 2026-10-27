"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { mockEnabled } from "@/lib/supabase/mock";
import { normalizeDomain } from "@/lib/discovery/parse";
import { geminiConfigured, Overloaded, RateLimited } from "@/lib/ai/gemini";
import { runAiCheck, sampleCheck, type CheckResult } from "@/lib/tools/aiCheck";

export type CheckState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | ({ status: "done"; left: number; product: string } & CheckResult);

const PER_VISITOR = 2; // checks per visitor per day (each one runs 3 web searches)
const PER_DAY = 60; // checks for everyone per day, to cap search costs
const DAY = 24 * 60 * 60 * 1000;
const TOOL = "ai-check";

const fail = (message: string): CheckState => ({ status: "error", message });

export async function checkAi(_prev: CheckState, formData: FormData): Promise<CheckState> {
  // Bot trap, same as the waitlist: a hidden field, and a form sent within 2 seconds.
  const shownAt = Number(formData.get("t") ?? 0);
  if (String(formData.get("website") ?? "").trim() || (shownAt > 0 && Date.now() - shownAt < 2000)) {
    return fail("Something went wrong. Please try again.");
  }

  const product = String(formData.get("product") ?? "").trim().slice(0, 60);
  const domain = normalizeDomain(String(formData.get("site") ?? ""));
  const about = String(formData.get("about") ?? "").trim().slice(0, 300);
  if (!product) return fail("Add your product's name.");
  if (!domain) return fail("Enter your website, like yourproduct.com.");
  if (about.length < 15) return fail("Add a sentence about what your product does and who it's for, so the questions match your buyers.");

  const input = { product, domain, about };
  if (mockEnabled() && !geminiConfigured()) return { status: "done", left: PER_VISITOR - 1, product, ...sampleCheck(input) };

  const db = createAdminClient();
  if (!db || !geminiConfigured()) return fail("The checker is resting right now. Please try again later.");

  // Usage limits. Only a scrambled IP is stored.
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${ip}|${process.env.TOOL_SALT ?? "riposte-tools"}`).digest("hex");
  const since = new Date(Date.now() - DAY).toISOString();
  const [mine, all] = await Promise.all([
    db.from("tool_runs").select("id", { count: "exact", head: true }).eq("tool", TOOL).eq("ip_hash", ipHash).gte("created_at", since),
    db.from("tool_runs").select("id", { count: "exact", head: true }).eq("tool", TOOL).gte("created_at", since),
  ]);
  if (mine.error || all.error) return fail("The checker is resting right now. Please try again later.");
  if ((mine.count ?? 0) >= PER_VISITOR) {
    return fail(`You've run ${PER_VISITOR} checks today, the daily limit. Come back tomorrow, or join the Riposte beta to track your AI answers every week.`);
  }
  if ((all.count ?? 0) >= PER_DAY) return fail("The checker is very busy today. Please try again tomorrow.");

  try {
    const result = await runAiCheck(input);
    await db.from("tool_runs").insert({ tool: TOOL, ip_hash: ipHash, target: domain, ok: true });
    return { status: "done", left: Math.max(0, PER_VISITOR - (mine.count ?? 0) - 1), product, ...result };
  } catch (e) {
    await db.from("tool_runs").insert({ tool: TOOL, ip_hash: ipHash, target: domain, ok: false });
    if (e instanceof RateLimited || e instanceof Overloaded) return fail("Google's AI is busy right now. Please try again in a few minutes.");
    return fail("The AI took too long to answer. Please try again in a minute.");
  }
}
