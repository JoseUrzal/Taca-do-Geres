import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getPlayerId } from "@/lib/identity";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Lista pública de eventos + estado da votação do evento ativo (o primeiro
// anunciado): quem já votou (contagem), o meu voto, e os candidatos.
export async function GET() {
  const [{ data, error }, players, me] = await Promise.all([
    db()
      .from("events")
      .select(
        "id, name, when_hint, status, played_at, created_at, first:first_id(name, emoji), second:second_id(name, emoji), third:third_id(name, emoji)"
      )
      .order("created_at", { ascending: false }),
    getPlayers(),
    getPlayerId(),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // evento ativo = o previsto mais antigo (o primeiro da lista do admin)
  const previstos = (data ?? []).filter((e) => e.status === "previsto");
  const ativo = previstos.length > 0 ? previstos[previstos.length - 1] : null;

  let voting = null;
  if (ativo) {
    const { data: votes } = await db()
      .from("event_votes")
      .select("voter_id, target_id, slot")
      .eq("event_id", ativo.id);
    const all = votes ?? [];
    const mine = me ? all.filter((v) => v.voter_id === me) : [];
    voting = {
      event_id: ativo.id,
      name: ativo.name,
      voted: new Set(all.map((v) => v.voter_id)).size,
      total: players.length,
      my_votes: {
        1: mine.find((v) => v.slot === 1)?.target_id ?? null,
        2: mine.find((v) => v.slot === 2)?.target_id ?? null,
        3: mine.find((v) => v.slot === 3)?.target_id ?? null,
      },
      players: players.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji })),
      me,
    };
  }

  return NextResponse.json({ events: data, voting });
}
