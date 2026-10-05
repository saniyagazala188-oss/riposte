import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { promptsCsv } from "@/lib/aeo/prompts";

export const dynamic = "force-dynamic";

// Downloads the prompts as topic,prompt CSV (the format Profound imports).
export async function GET(request: Request) {
  const supabase = await createClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!supabase || !user) return NextResponse.redirect(new URL("/login", request.url));
  const { data } = await supabase.from("ai_prompts").select("topic, kind, text").order("position");
  const rows = [...(data ?? [])];
  // Shield topics first, prompts of a topic together.
  const order = new Map<string, number>();
  rows.forEach((r, i) => order.has(r.topic) || order.set(r.topic, (r.kind === "spear" ? 1e6 : 0) + i));
  rows.sort((a, b) => order.get(a.topic)! - order.get(b.topic)!);
  return new NextResponse(promptsCsv(rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="riposte-prompts.csv"',
    },
  });
}
