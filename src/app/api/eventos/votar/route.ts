import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

// Votar no melhor do evento ativo (o primeiro anunciado). Upsert: podes
// mudar o voto até o admin fechar a votação.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { target_id } = (await req.json()) as { target_id: string };
  if (!target_id) return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });
  if (target_id === playerId) {
    return NextResponse.json({ error: "nao_votas_em_ti" }, { status: 400 });
  }

  const { data: evento } = await db()
    .from("events")
    .select("id")
    .eq("status", "previsto")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!evento) return NextResponse.json({ error: "sem_evento" }, { status: 409 });

  const { error } = await db()
    .from("event_votes")
    .upsert(
      { event_id: evento.id, voter_id: playerId, target_id },
      { onConflict: "event_id,voter_id" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
