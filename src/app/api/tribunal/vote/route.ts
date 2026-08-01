import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { addScore } from "@/lib/queries";

// Votar num claim do Tribunal. 2 ✅ → confirmada + pontos. 3 ❌ → chumbada
// (chumbar destrói a missão, por isso custa mais um voto que confirmar).
// unique(assignment_id, player_id) impede voto duplo; o UPDATE ... WHERE
// status='reclamada' garante que só um voto resolve e pontua.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { assignment_id, vote } = await req.json();

  const { data: assignment } = await db()
    .from("assignments")
    .select("id, status, player_id, mission:mission_id(text, points)")
    .eq("id", assignment_id)
    .single();
  if (!assignment || assignment.status !== "reclamada") {
    return NextResponse.json({ error: "ja_resolvida" }, { status: 409 });
  }
  if (assignment.player_id === playerId) {
    return NextResponse.json({ error: "nao_podes_votar_no_teu" }, { status: 403 });
  }

  // limite de cumplicidade: máximo 2 ✅ à mesma pessoa POR DIA. A 3.ª é
  // bloqueada — cada um só tem 3 missões/dia, validar as 3 é demais.
  if (vote) {
    const hoje = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
    const { data: myYes } = await db()
      .from("approvals")
      .select("created_at, assignment:assignment_id(player_id)")
      .eq("player_id", playerId)
      .eq("vote", true);
    const owner = assignment.player_id;
    const hojeCount = (
      (myYes ?? []) as unknown as { created_at: string; assignment: { player_id: string } | null }[]
    ).filter(
      (r) =>
        r.assignment?.player_id === owner &&
        new Date(r.created_at).toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" }) === hoje
    ).length;
    if (hojeCount >= 2) {
      return NextResponse.json({ error: "limite_diario" }, { status: 409 });
    }
  }

  const { error: insErr } = await db()
    .from("approvals")
    .insert({ assignment_id, player_id: playerId, vote: !!vote });
  if (insErr) {
    // 23505 = unique violation → já votou
    return NextResponse.json({ error: "ja_votaste" }, { status: 409 });
  }

  const { data: votes } = await db()
    .from("approvals")
    .select("vote")
    .eq("assignment_id", assignment_id);
  const yes = (votes ?? []).filter((v) => v.vote).length;
  const no = (votes ?? []).filter((v) => !v.vote).length;

  const mission = assignment.mission as unknown as { text: string; points: number };

  if (yes >= 2) {
    const { data: updated } = await db()
      .from("assignments")
      .update({ status: "confirmada" })
      .eq("id", assignment_id)
      .eq("status", "reclamada")
      .select();
    if (updated && updated.length > 0) {
      await addScore(
        assignment.player_id,
        mission.points,
        `Missão cumprida: «${mission.text}»`,
        "missao"
      );
    }
    return NextResponse.json({ ok: true, resolved: "confirmada" });
  }
  if (no >= 3) {
    await db()
      .from("assignments")
      .update({ status: "chumbada" })
      .eq("id", assignment_id)
      .eq("status", "reclamada");
    return NextResponse.json({ ok: true, resolved: "chumbada" });
  }
  return NextResponse.json({ ok: true, resolved: null });
}
