import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { getGameState, getPlayers } from "@/lib/queries";

// Re-sortear (ou fixar) a câmara do dia.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const body = await req.json().catch(() => ({}));
  let playerId: string | null = body.player_id ?? null;

  if (!playerId) {
    const [players, state] = await Promise.all([getPlayers(), getGameState()]);
    const others = players.filter((p) => p.id !== state.camera_player_id);
    const pool = others.length > 0 ? others : players;
    playerId = pool[Math.floor(Math.random() * pool.length)].id;
  }

  const { error } = await db()
    .from("game_state")
    .update({ camera_player_id: playerId })
    .eq("id", 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
