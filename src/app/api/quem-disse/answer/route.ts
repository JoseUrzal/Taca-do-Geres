import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { getGameState } from "@/lib/queries";

// Responder ao prompt. Upsert: podes corrigir a resposta enquanto a fase
// for 'a_responder'. unique(round_id, player_id) garante uma por jogador.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "vazio" }, { status: 400 });

  const state = await getGameState();
  if (!state.active_round_id) return NextResponse.json({ error: "sem_ronda" }, { status: 409 });

  const { data: round } = await db()
    .from("rounds")
    .select("status")
    .eq("id", state.active_round_id)
    .single();
  if (round?.status !== "a_responder") {
    return NextResponse.json({ error: "fase_errada" }, { status: 409 });
  }

  const { error } = await db()
    .from("answers")
    .upsert(
      { round_id: state.active_round_id, player_id: playerId, text: text.trim() },
      { onConflict: "round_id,player_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
