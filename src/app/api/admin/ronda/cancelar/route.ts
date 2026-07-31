import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { getGameState } from "@/lib/queries";

// Cancela a ronda ativa sem pontuar: apaga palpites e respostas e fecha.
// Útil para limpar testes ou rondas lançadas por engano.
export async function POST() {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const state = await getGameState();
  if (!state.active_round_id) return NextResponse.json({ error: "sem_ronda" }, { status: 409 });
  const roundId = state.active_round_id;

  await db().from("game_state").update({ active_round_id: null }).eq("id", 1);
  await db().from("guesses").delete().eq("round_id", roundId);
  await db().from("answers").delete().eq("round_id", roundId);
  await db().from("rounds").delete().eq("id", roundId);

  return NextResponse.json({ ok: true });
}
