import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getGameState } from "@/lib/queries";

// «Próxima» na TV durante a revelação. Sem PIN de propósito: a TV não tem
// teclado e quem está com o comando é de confiança.
// TODO: se houver abuso, mover para /api/admin.
export async function POST() {
  const state = await getGameState();
  if (!state.active_round_id) return NextResponse.json({ error: "sem_ronda" }, { status: 409 });

  const { data: round } = await db()
    .from("rounds")
    .select("id, status, reveal_index")
    .eq("id", state.active_round_id)
    .single();
  if (round?.status !== "revelado") {
    return NextResponse.json({ error: "fase_errada" }, { status: 409 });
  }

  const { error } = await db()
    .from("rounds")
    .update({ reveal_index: round.reveal_index + 1 })
    .eq("id", round.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
