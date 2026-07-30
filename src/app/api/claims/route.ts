import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

// Reclamar uma missão: ativa → reclamada (vai para o Tribunal).
// O WHERE status='ativa' garante que dois toques não reclamam duas vezes.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { assignment_id } = await req.json();
  const { data, error } = await db()
    .from("assignments")
    .update({ status: "reclamada" })
    .eq("id", assignment_id)
    .eq("player_id", playerId)
    .eq("status", "ativa")
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "ja_reclamada" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
