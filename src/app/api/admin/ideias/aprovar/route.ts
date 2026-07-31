import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";

// Aprovar uma ideia: missão → entra no catálogo (a dar num próximo dia);
// evento → fica anunciado; quizz → entra nas perguntas. Outras: só arquivar.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { idea_id } = await req.json();
  const { data: idea } = await db().from("ideas").select("*").eq("id", idea_id).single();
  if (!idea || idea.done) return NextResponse.json({ error: "ja_tratada" }, { status: 409 });

  if (idea.kind === "missao") {
    const { error } = await db()
      .from("missions")
      .insert({ text: idea.text, points: 15, difficulty: 2, active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (idea.kind === "evento") {
    const { error } = await db().from("events").insert({ name: idea.text });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (idea.kind === "quizz") {
    const { error } = await db().from("prompts").insert({ text: idea.text });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db().from("ideas").update({ done: true }).eq("id", idea_id);
  return NextResponse.json({ ok: true });
}
