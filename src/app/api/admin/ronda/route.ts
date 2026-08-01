import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { getGameState } from "@/lib/queries";

// Criar uma ronda de Quem Disse Isto? a partir de um prompt (do catálogo ou
// escrito à mão). Fica logo ativa e a TV muda para ela.
// Máximo 4 rondas por dia: o quizz paga bem (+5/acerto) e sem travão
// esmagava as missões e os eventos na economia de pontos.
const MAX_RONDAS_DIA = 4;

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
  const { data: rondas } = await db().from("rounds").select("created_at");
  const hojeCount = (rondas ?? []).filter(
    (r) =>
      new Date(r.created_at).toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" }) === hoje
  ).length;
  if (hojeCount >= MAX_RONDAS_DIA) {
    return NextResponse.json({ error: "limite_rondas" }, { status: 409 });
  }

  const { prompt, prompt_id } = (await req.json()) as { prompt?: string; prompt_id?: string };

  let text = prompt?.trim();
  if (prompt_id) {
    const { data } = await db().from("prompts").select("id, text").eq("id", prompt_id).single();
    if (data) {
      text = data.text;
      await db().from("prompts").update({ used: true }).eq("id", data.id);
    }
  }
  if (!text) return NextResponse.json({ error: "sem_prompt" }, { status: 400 });

  const state = await getGameState();
  if (state.active_round_id) {
    return NextResponse.json({ error: "ronda_ja_ativa" }, { status: 409 });
  }

  const { data: round, error } = await db()
    .from("rounds")
    .insert({ prompt: text, status: "a_responder" })
    .select()
    .single();
  if (error || !round) return NextResponse.json({ error: error?.message }, { status: 500 });

  await db().from("game_state").update({ active_round_id: round.id }).eq("id", 1);
  return NextResponse.json({ ok: true, round_id: round.id });
}
