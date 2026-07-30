import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { addScore, getGameState } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Acusar: escolher alvo + missão do catálogo. Certo → +15 e o alvo perde a
// missão (apanhada). Errado → −5. Máximo 2 por dia, garantido pela BD com
// unique(accuser_id, day, slot) e slot ∈ {1,2}.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { target_id, mission_id } = await req.json();
  if (target_id === playerId) {
    return NextResponse.json({ error: "nao_te_podes_acusar" }, { status: 400 });
  }

  const state = await getGameState();
  const day = state.current_day;

  const { count } = await db()
    .from("accusations")
    .select("id", { count: "exact", head: true })
    .eq("accuser_id", playerId)
    .eq("day", day);
  const slot = (count ?? 0) + 1;
  if (slot > 2) {
    return NextResponse.json({ error: "sem_acusacoes" }, { status: 409 });
  }

  // O alvo tem esta missão ativa hoje?
  const { data: hit } = await db()
    .from("assignments")
    .select("id")
    .eq("player_id", target_id)
    .eq("mission_id", mission_id)
    .eq("status", "ativa")
    .maybeSingle();

  const correct = !!hit;

  const { error: insErr } = await db().from("accusations").insert({
    accuser_id: playerId,
    target_id,
    mission_id,
    day,
    slot,
    correct,
  });
  if (insErr) {
    // colisão de slot = duas acusações em simultâneo → uma perde
    return NextResponse.json({ error: "sem_acusacoes" }, { status: 409 });
  }

  const [{ data: target }, { data: mission }] = await Promise.all([
    db().from("players").select("name").eq("id", target_id).single(),
    db().from("missions").select("text").eq("id", mission_id).single(),
  ]);

  if (correct && hit) {
    // só pontua se a missão ainda estava ativa neste instante
    const { data: caught } = await db()
      .from("assignments")
      .update({ status: "apanhada" })
      .eq("id", hit.id)
      .eq("status", "ativa")
      .select();
    if (caught && caught.length > 0) {
      await addScore(
        playerId,
        15,
        `Apanhou ${target?.name} a tentar «${mission?.text}»`,
        "acusacao"
      );
    }
    return NextResponse.json({ ok: true, correct: true });
  }

  await addScore(playerId, -5, `Acusação falhada contra ${target?.name}`, "acusacao");
  return NextResponse.json({ ok: true, correct: false });
}
