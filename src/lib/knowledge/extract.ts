// Reads the text out of an uploaded PDF or Word file. No network, so it can be tested.
// Normal files (made on a computer) carry their text inside, so this is close to exact.
// Scanned PDFs carry only pictures of pages: looksScanned() spots them, and the caller
// then asks Gemini to read the pages instead (OCR).

import { extractText, getDocumentProxy } from "unpdf";
import mammoth from "mammoth";

export type FileKind = "pdf" | "docx";
export type Extracted = { text: string; pages: number | null; words: number };

export const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
export const BODY_CAP = 60000; // characters kept per file

export function kindOf(name: string, mime?: string | null): FileKind | null {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf") || mime === "application/pdf") return "pdf";
  if (n.endsWith(".docx") || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  return null;
}

export const mimeFor = (kind: FileKind) =>
  kind === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export const countWords = (text: string) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.-]*/gu) ?? []).length;

// Joins broken lines and squeezes spaces, but keeps paragraph breaks.
export function tidy(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractFile(data: Uint8Array, kind: FileKind): Promise<Extracted> {
  if (kind === "pdf") {
    const pdf = await getDocumentProxy(new Uint8Array(data));
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    const clean = tidy(String(text));
    return { text: clean, pages: totalPages, words: countWords(clean) };
  }
  const { value } = await mammoth.extractRawText({ buffer: Buffer.from(data) });
  const clean = tidy(value);
  return { text: clean, pages: null, words: countWords(clean) };
}

// Fewer than about 40 words a page means the pages are mostly pictures (a scan or a design export).
export function looksScanned(e: Extracted): boolean {
  if (e.pages === null) return e.words < 20;
  return e.words < Math.max(20, e.pages * 40);
}

export function excerptOf(text: string, max = 320): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40)) + "…";
}
