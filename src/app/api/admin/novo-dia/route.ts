import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { dealMissions, getGameState, getPlayers } from "@/lib/queries";

// Novo dia: incrementa o dia, expira as missões ativas, dá 3 novas a cada
// jogador, re-sorteia a câmara. As acusações contam-se por dia, por isso
// «resetam» sozinhas.
export async function POST() {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const state = await getGameState();
  const newDay = state.current_day + 1;

  await db().from("assignments").update({ status: "expirada" }).eq("status", "ativa");

  const players = await getPlayers();
  const camera = players[Math.floor(Math.random() * players.length)];

  const { error } = await db()
    .from("game_state")
    .update({ current_day: newDay, camera_player_id: camera?.id ?? null })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dealt = await dealMissions(newDay);
  return NextResponse.json({ ok: true, day: newDay, dealt, camera: camera?.name });
}
