import "server-only";

// Minimal Gemini client (REST, no SDK). The key stays on the server.
// GEMINI_MODEL can override the model; the default alias always points to the current Flash model.
// When Google's servers are overloaded (503) the call is retried, then tried once on a lighter
// fallback model (GEMINI_FALLBACK_MODEL, default gemini-flash-lite-latest).

export class RateLimited extends Error {}
export class Overloaded extends Error {}

export function geminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callOnce<T>(model: string, prompt: string, schema: object, timeoutMs: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, responseMimeType: "application/json", responseSchema: schema },
      }),
      cache: "no-store",
    });
    if (res.status === 429) throw new RateLimited("Gemini rate limit reached");
    if (res.status === 503 || res.status === 500) throw new Overloaded(`Gemini is overloaded (${res.status})`);
    if (!res.ok) throw new Error(`Gemini answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Gemini returned an empty answer");
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateJson<T>(prompt: string, schema: object, { timeoutMs = 30000 } = {}): Promise<T> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  const main = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
  // Main model twice (with a short pause), then the lighter model once.
  const plan = [
    { model: main, wait: 0 },
    { model: main, wait: 1500 },
    { model: fallback, wait: 1000 },
  ];
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  for (const step of plan) {
    if (step.wait) await sleep(step.wait);
    const left = deadline - Date.now();
    if (left < 3000) break;
    try {
      return await callOnce<T>(step.model, prompt, schema, left);
    } catch (e) {
      lastError = e;
      if (!(e instanceof Overloaded)) throw e; // only retry when Google is overloaded
    }
  }
  throw lastError ?? new Overloaded("Gemini is overloaded");
}

// ---------- Grounded answers (Gemini + Google Search) ----------

// Google's own explanation from an error response, shortened.
async function googleReason(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    return (body.error?.message ?? "").replace(/\s+/g, " ").slice(0, 400);
  } catch {
    return "";
  }
}

export type GroundedAnswer = {
  text: string;
  queries: string[];
  sources: { title: string; uri: string }[];
  searchEntry: string | null;
  grounded: boolean; // false when Google Search wasn't available and the model answered from its own knowledge
};

async function groundedOnce(model: string, prompt: string, timeoutMs: number, search = true): Promise<GroundedAnswer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], ...(search ? { tools: [{ google_search: {} }] } : {}) }),
      cache: "no-store",
    });
    if (res.status === 429 || res.status === 503 || res.status === 500) {
      const reason = await googleReason(res);
      if (res.status === 429) throw new RateLimited(`${model}: limit reached (${reason})`);
      throw new Overloaded(`${model}: overloaded (${res.status}${reason ? `, ${reason}` : ""})`);
    }
    if (!res.ok) throw new Error(`Gemini answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = (await res.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[] };
        groundingMetadata?: {
          webSearchQueries?: string[];
          groundingChunks?: { web?: { uri?: string; title?: string } }[];
          searchEntryPoint?: { renderedContent?: string };
        };
      }[];
    };
    const c = data.candidates?.[0];
    const text = c?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Gemini returned an empty answer");
    const g = c?.groundingMetadata;
    return {
      text,
      queries: (g?.webSearchQueries ?? []).filter(Boolean),
      sources: (g?.groundingChunks ?? [])
        .map((ch) => ({ title: ch.web?.title ?? "", uri: ch.web?.uri ?? "" }))
        .filter((s) => s.title || s.uri),
      searchEntry: g?.searchEntryPoint?.renderedContent ?? null,
      grounded: search,
    };
  } finally {
    clearTimeout(timer);
  }
}

// Asks the prompt the way a buyer would, with Google Search switched on, and returns the answer
// with the searches it ran and the sites it used. If every model's search quota is used up
// (free keys often have none), it answers without search and says so (grounded: false).
export async function groundedAnswer(prompt: string, { timeoutMs = 45000 } = {}): Promise<GroundedAnswer> {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not set");
  const main = process.env.GEMINI_MODEL || "gemini-flash-latest";
  const fallback = process.env.GEMINI_FALLBACK_MODEL || "gemini-flash-lite-latest";
  const plan = [
    { model: main, wait: 0 },
    { model: main, wait: 2000 },
    { model: fallback, wait: 1000 },
  ];
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  for (const step of plan) {
    if (step.wait) await sleep(step.wait);
    const left = deadline - Date.now();
    if (left < 5000) break;
    if (lastError instanceof RateLimited && step.model === main) continue; // a limit won't clear in 2 seconds
    try {
      return await groundedOnce(step.model, prompt, left);
    } catch (e) {
      lastError = e;
      if (!(e instanceof Overloaded) && !(e instanceof RateLimited)) throw e;
    }
  }
  if (lastError instanceof RateLimited && process.env.VISIBILITY_NO_SEARCH_FALLBACK !== "off") {
    const left = deadline - Date.now();
    if (left >= 5000) return groundedOnce(main, prompt, left, false);
  }
  throw lastError ?? new Overloaded("Gemini is overloaded");
}
