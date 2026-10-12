"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { limitsFor } from "@/lib/access";
import { mockEnabled } from "@/lib/supabase/mock";
import { kindOf, MAX_BYTES } from "@/lib/knowledge/extract";
import { readFile } from "@/lib/knowledge/summarise";
import { buildKnowledgeSummary, type KnowledgeDocLite } from "@/lib/knowledge/context";

export type KnowledgeState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; id: string; name: string };

type Supa = Awaited<ReturnType<typeof requireUser>>["supabase"];

// Rebuilds the combined summary that every AI step reads.
async function refreshSummary(supabase: Supa, userId: string) {
  const { data } = await supabase
    .from("knowledge_docs")
    .select("file_name, doc_kind, summary, key_points, excerpt")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  const summary = buildKnowledgeSummary((data ?? []) as KnowledgeDocLite[]);
  await supabase.from("profiles").update({ knowledge_summary: summary }).eq("id", userId);
}

// Called after the browser has put the file in storage (path), or, in local preview, with the file itself.
export async function addKnowledgeFile(_prev: KnowledgeState, formData: FormData): Promise<KnowledgeState> {
  const { supabase, user } = await requireUser();
  const path = String(formData.get("path") ?? "");
  const direct = formData.get("file");
  const name = String(formData.get("name") ?? (direct instanceof File ? direct.name : "")).slice(0, 160) || "Untitled";
  const kind = kindOf(name);
  if (!kind) return { status: "error", message: "Only PDF and Word (.docx) files can be added." };

  const { count } = await supabase.from("knowledge_docs").select("id", { count: "exact", head: true }).eq("user_id", user.id);
  const limit = limitsFor(user.email).knowledgeFiles;
  if ((count ?? 0) >= limit) {
    if (path) await supabase.storage.from("knowledge").remove([path]);
    return { status: "error", message: `The beta allows ${limit} files. Delete one to add another.` };
  }

  // Get the file's bytes.
  let bytes: Uint8Array;
  if (path) {
    if (!path.startsWith(`${user.id}/`)) return { status: "error", message: "That file doesn't belong to you." };
    const { data, error } = await supabase.storage.from("knowledge").download(path);
    if (error || !data) return { status: "error", message: "Couldn't open the uploaded file. Please try again." };
    bytes = new Uint8Array(await data.arrayBuffer());
  } else if (direct instanceof File && mockEnabled()) {
    bytes = new Uint8Array(await direct.arrayBuffer());
  } else {
    return { status: "error", message: "No file was received. Please try again." };
  }
  if (bytes.byteLength > MAX_BYTES) {
    if (path) await supabase.storage.from("knowledge").remove([path]);
    return { status: "error", message: "Files can be up to 10 MB." };
  }

  const read = await readFile(bytes, kind, name);
  const { data: row, error } = await supabase
    .from("knowledge_docs")
    .insert({
      user_id: user.id,
      file_name: name,
      file_type: kind,
      size_bytes: bytes.byteLength,
      storage_path: path || null,
      ...read,
    })
    .select("id")
    .single();
  if (error) {
    if (path) await supabase.storage.from("knowledge").remove([path]);
    return {
      status: "error",
      message: /knowledge_docs|schema cache/i.test(error.message)
        ? "The knowledge base isn't set up yet (migration 0015)."
        : "Couldn't save the file. Please try again.",
    };
  }

  await refreshSummary(supabase, user.id);
  revalidatePath("/app/product");
  return { status: "done", id: String((row as { id?: string } | null)?.id ?? ""), name };
}

export async function deleteKnowledgeFile(formData: FormData): Promise<void> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { data: doc } = await supabase
    .from("knowledge_docs")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  await supabase.from("knowledge_docs").delete().eq("id", id).eq("user_id", user.id);
  const p = (doc as { storage_path?: string | null } | null)?.storage_path;
  if (p) await supabase.storage.from("knowledge").remove([p]);
  await refreshSummary(supabase, user.id);
  revalidatePath("/app/product");
}
