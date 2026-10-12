// Joins every file's summary into one block that sits next to the four product fields in
// every AI prompt, so judgments use what the marketer's own content actually says.
// Pure functions, no network.

export type KnowledgeDocLite = {
  file_name: string;
  doc_kind: string | null;
  summary: string | null;
  key_points: string[] | null;
  excerpt: string | null;
};

const CAP = 4500; // characters across all files, to keep prompts fast

export function buildKnowledgeSummary(docs: KnowledgeDocLite[]): string | null {
  if (!docs.length) return null;
  const per = Math.max(350, Math.floor(CAP / docs.length));
  const parts = docs.map((d) => {
    const head = `- ${d.file_name}${d.doc_kind ? ` (${d.doc_kind})` : ""}: `;
    const body = d.summary
      ? `${d.summary}${d.key_points?.length ? ` Key points: ${d.key_points.join("; ")}.` : ""}`
      : `Starts: ${d.excerpt ?? ""}`;
    const line = head + body;
    return line.length > per ? line.slice(0, per - 1) + "…" : line;
  });
  return parts.join("\n").slice(0, CAP);
}

// The lines added to a prompt. Empty when the user hasn't uploaded anything.
export function knowledgeBlock(summary: string | null | undefined): string {
  if (!summary?.trim()) return "";
  return `\nFrom their own content (files they uploaded; treat as facts about their product, and use them to spot what they already cover):\n${summary.trim()}`;
}
