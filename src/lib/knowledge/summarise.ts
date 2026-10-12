import "server-only";
import { generateJson } from "@/lib/ai/gemini";
import { BODY_CAP, countWords, excerptOf, extractFile, looksScanned, mimeFor, tidy, type FileKind } from "./extract";

// Turns an uploaded file into what Riposte stores: the text, a short summary, key points and
// a check-card warning if something looks off. Scanned PDFs are read by Gemini (OCR).

export type ReadResult = {
  pages: number | null;
  words: number;
  method: "text" | "ocr";
  status: "ready" | "warning";
  warning: string | null;
  doc_kind: string | null;
  summary: string | null;
  key_points: string[];
  excerpt: string;
  body: string;
};

type AiSummary = { doc_kind: string; summary: string; key_points: string[]; text?: string };

const SCHEMA = {
  type: "OBJECT",
  properties: {
    doc_kind: { type: "STRING" },
    summary: { type: "STRING" },
    key_points: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["doc_kind", "summary", "key_points"],
};
const OCR_SCHEMA = {
  ...SCHEMA,
  properties: { ...SCHEMA.properties, text: { type: "STRING" } },
  required: ["doc_kind", "summary", "key_points", "text"],
};

const INSTRUCTIONS = `You help a product marketer. They uploaded one of their own documents about their product.
Return:
- doc_kind: what this document is, in 1-3 words (e.g. "One-pager", "Blog post", "Positioning doc", "Case study", "Pitch deck", "Product page").
- summary: 2-3 plain sentences: what it is about and who it is for.
- key_points: up to 8 short points that a competitor analyst would need: features, claims, differentiators, proof (numbers, customers), pricing, target buyers. Use only what the document says. No invented facts.`;

export async function readFile(data: Uint8Array, kind: FileKind, name: string): Promise<ReadResult> {
  let extracted = await extractFile(data, kind).catch(() => ({ text: "", pages: null as number | null, words: 0 }));
  const scanned = looksScanned(extracted);
  const warnings: string[] = [];
  let method: "text" | "ocr" = "text";
  let ai: AiSummary | null = null;

  if (scanned && kind === "pdf") {
    // Pictures of pages: send the PDF to Gemini to read and summarise in one go.
    method = "ocr";
    try {
      ai = await generateJson<AiSummary>(
        `${INSTRUCTIONS}\n- text: the document's full text as you read it from the pages, in reading order (up to about 3000 words).\n\nFile name: ${name}`,
        OCR_SCHEMA,
        { timeoutMs: 75000, file: { mimeType: mimeFor(kind), base64: Buffer.from(data).toString("base64") } },
      );
      const text = tidy(ai.text ?? "");
      extracted = { text, pages: extracted.pages, words: countWords(text) };
      warnings.push("This looks like a scanned file, so Google's AI read the pages. Check the summary and first lines carefully.");
    } catch {
      ai = null;
    }
  } else if (extracted.words > 0) {
    try {
      ai = await generateJson<AiSummary>(
        `${INSTRUCTIONS}\n\nFile name: ${name}\n\nDocument:\n"""\n${extracted.text.slice(0, 30000)}\n"""`,
        SCHEMA,
        { timeoutMs: 60000 },
      );
    } catch {
      ai = null;
    }
  }

  if (extracted.words < 80) {
    warnings.unshift(
      extracted.words === 0
        ? "No text could be read. Is this file mostly images? Try exporting it again as a normal PDF or Word file."
        : `Very little text found (${extracted.words} words). Is this file mostly images or a scanned file?`,
    );
  }
  if (extracted.text.length > BODY_CAP) warnings.push(`Long file: Riposte keeps the first ${countWords(extracted.text.slice(0, BODY_CAP)).toLocaleString("en")} words.`);
  if (!ai && extracted.words > 0) warnings.push("Google's AI was busy, so there's no summary yet. Riposte still uses the text it read.");

  return {
    pages: extracted.pages,
    words: extracted.words,
    method,
    status: warnings.length ? "warning" : "ready",
    warning: warnings.join(" ") || null,
    doc_kind: ai?.doc_kind?.trim().slice(0, 40) || null,
    summary: ai?.summary?.trim().slice(0, 700) || null,
    key_points: (ai?.key_points ?? []).map((k) => String(k).trim()).filter(Boolean).slice(0, 8).map((k) => k.slice(0, 220)),
    excerpt: excerptOf(extracted.text),
    body: extracted.text.slice(0, BODY_CAP),
  };
}
