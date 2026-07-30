import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getGameState, getPlayers } from "@/lib/queries";

// «Próxima» do sorteio na TV. Sem PIN, tal como a revelação do Quem Disse.
// Quando reveal passa o nº de jogadores, a TV volta à rotação normal.
export async function POST() {
  const [state, players] = await Promise.all([getGameState(), getPlayers()]);
  const next = Math.min(state.draw_reveal + 1, players.length + 1);
  const { error } = await db().from("game_state").update({ draw_reveal: next }).eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, reveal: next });
}
