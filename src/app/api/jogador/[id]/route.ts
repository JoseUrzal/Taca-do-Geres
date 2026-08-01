import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Extrato de pontos de um jogador: todos os score_events, do mais recente
// para o mais antigo. O histórico é público — faz parte do jogo.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [{ data: player }, { data: events, error }] = await Promise.all([
    db().from("players").select("id, name, emoji").eq("id", id).single(),
    db()
      .from("score_events")
      .select("id, points, reason, source, created_at")
      .eq("player_id", id)
      .order("created_at", { ascending: false }),
  ]);
  if (!player) return NextResponse.json({ error: "jogador_invalido" }, { status: 404 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = (events ?? []).reduce((s, e) => s + e.points, 0);
  return NextResponse.json({ player, total, events: events ?? [] });
}
