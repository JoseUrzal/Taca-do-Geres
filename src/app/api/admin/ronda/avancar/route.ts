import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { getGameState } from "@/lib/queries";
import { scoreRound } from "@/lib/round";

// Avançar a fase da ronda ativa:
//   a_responder → a_adivinhar → revelado (pontua) → fechada (limpa active_round_id)
// Cada UPDATE tem WHERE status=<fase atual>, portanto dois cliques só avançam uma vez.
export async function POST() {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const state = await getGameState();
  if (!state.active_round_id) return NextResponse.json({ error: "sem_ronda" }, { status: 409 });
  const roundId = state.active_round_id;

  const { data: round } = await db().from("rounds").select("status").eq("id", roundId).single();
  if (!round) return NextResponse.json({ error: "sem_ronda" }, { status: 409 });

  if (round.status === "a_responder") {
    await db()
      .from("rounds")
      .update({ status: "a_adivinhar" })
      .eq("id", roundId)
      .eq("status", "a_responder");
    return NextResponse.json({ ok: true, status: "a_adivinhar" });
  }

  if (round.status === "a_adivinhar") {
    const { data: updated } = await db()
      .from("rounds")
      .update({ status: "revelado" })
      .eq("id", roundId)
      .eq("status", "a_adivinhar")
      .select();
    if (updated && updated.length > 0) {
      await scoreRound(roundId); // só quem fez a transição pontua — idempotente
    }
    return NextResponse.json({ ok: true, status: "revelado" });
  }

  // revelado → fechar a ronda
  await db().from("game_state").update({ active_round_id: null }).eq("id", 1);
  return NextResponse.json({ ok: true, status: "fechada" });
}
