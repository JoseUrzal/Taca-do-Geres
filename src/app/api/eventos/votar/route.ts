import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

// Votar nos 3 melhores do evento ativo, por ordem (1.º, 2.º, 3.º).
// Substitui o voto anterior por inteiro — podes mudar até o admin fechar.
export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { first, second, third } = (await req.json()) as {
    first: string;
    second: string;
    third: string;
  };
  const picks = [first, second, third];
  if (picks.some((p) => !p)) {
    return NextResponse.json({ error: "faltam_escolhas" }, { status: 400 });
  }
  if (new Set(picks).size !== 3) {
    return NextResponse.json({ error: "repetidos" }, { status: 400 });
  }
  if (picks.includes(playerId)) {
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

  // substitui o boletim inteiro (apagar + inserir os 3 slots)
  await db().from("event_votes").delete().eq("event_id", evento.id).eq("voter_id", playerId);
  const { error } = await db()
    .from("event_votes")
    .insert(picks.map((target_id, i) => ({
      event_id: evento.id,
      voter_id: playerId,
      target_id,
      slot: i + 1,
    })));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
