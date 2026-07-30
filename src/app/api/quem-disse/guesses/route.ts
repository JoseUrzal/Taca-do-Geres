import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { getGameState } from "@/lib/queries";

// Entregar todos os palpites de uma vez: { guesses: { [answer_id]: player_id } }
// Regras validadas no servidor: não podes palpitar na tua resposta, não te
// podes escolher a ti próprio, não podes repetir nomes.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { guesses } = (await req.json()) as { guesses: Record<string, string> };

  const state = await getGameState();
  if (!state.active_round_id) return NextResponse.json({ error: "sem_ronda" }, { status: 409 });
  const roundId = state.active_round_id;

  const { data: round } = await db().from("rounds").select("status").eq("id", roundId).single();
  if (round?.status !== "a_adivinhar") {
    return NextResponse.json({ error: "fase_errada" }, { status: 409 });
  }

  const { data: answers } = await db()
    .from("answers")
    .select("id, player_id")
    .eq("round_id", roundId);
  const answerAuthor = new Map((answers ?? []).map((a) => [a.id, a.player_id]));

  const entries = Object.entries(guesses ?? {});
  const usedNames = new Set<string>();
  for (const [answerId, guessedId] of entries) {
    if (!answerAuthor.has(answerId)) {
      return NextResponse.json({ error: "resposta_invalida" }, { status: 400 });
    }
    if (answerAuthor.get(answerId) === playerId) {
      return NextResponse.json({ error: "nao_palpitas_na_tua" }, { status: 400 });
    }
    if (guessedId === playerId) {
      return NextResponse.json({ error: "nao_te_podes_escolher" }, { status: 400 });
    }
    if (usedNames.has(guessedId)) {
      return NextResponse.json({ error: "nome_repetido" }, { status: 400 });
    }
    usedNames.add(guessedId);
  }

  const rows = entries.map(([answer_id, guessed_player_id]) => ({
    round_id: roundId,
    guesser_id: playerId,
    answer_id,
    guessed_player_id,
  }));
  const { error } = await db()
    .from("guesses")
    .upsert(rows, { onConflict: "round_id,guesser_id,answer_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
