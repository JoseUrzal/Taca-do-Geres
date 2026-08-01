import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Voter = { vote: boolean; created_at: string; player: { name: string } | null };
type Judged = {
  id: string;
  status: string;
  created_at: string;
  mission: { text: string } | null;
  approvals: Voter[];
};

// Extrato de pontos de um jogador: todos os score_events, do mais recente
// para o mais antigo. Nas missões julgadas em Tribunal vão também os votos
// (com nome), incluindo as chumbadas — que não geram pontos mas fazem parte
// da história. O histórico é público — faz parte do jogo.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const [{ data: player }, { data: events, error }, { data: judgedData }] =
    await Promise.all([
      db().from("players").select("id, name, emoji").eq("id", id).single(),
      db()
        .from("score_events")
        .select("id, points, reason, source, created_at")
        .eq("player_id", id)
        .order("created_at", { ascending: false }),
      db()
        .from("assignments")
        .select(
          "id, status, created_at, mission:mission_id(text), approvals(vote, created_at, player:player_id(name))"
        )
        .eq("player_id", id)
        .in("status", ["confirmada", "chumbada"]),
    ]);
  if (!player) return NextResponse.json({ error: "jogador_invalido" }, { status: 404 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  type Item = {
    id: string;
    points: number;
    reason: string;
    source: string;
    created_at: string;
    votes?: { name: string; vote: boolean }[];
  };
  const items: Item[] = (events ?? []).map((e) => ({ ...e }));

  const judged = (judgedData ?? []) as unknown as Judged[];
  for (const a of judged) {
    const votes = [...a.approvals]
      .sort((x, y) => x.created_at.localeCompare(y.created_at))
      .map((v) => ({ name: v.player?.name ?? "?", vote: v.vote }));
    if (a.status === "confirmada") {
      // liga os votos à linha de pontos da missão (o reason cita o texto dela)
      const line = a.mission
        ? items.find((i) => i.source === "missao" && i.reason.includes(a.mission!.text))
        : undefined;
      if (line) line.votes = votes;
    } else {
      // chumbada: sem pontos, mas entra no extrato com os votos
      const resolvedAt =
        a.approvals.map((v) => v.created_at).sort().pop() ?? a.created_at;
      items.push({
        id: `chumbo-${a.id}`,
        points: 0,
        reason: `Tribunal chumbou: «${a.mission?.text ?? "?"}»`,
        source: "missao",
        created_at: resolvedAt,
        votes,
      });
    }
  }
  items.sort((x, y) => y.created_at.localeCompare(x.created_at));

  const total = (events ?? []).reduce((s, e) => s + e.points, 0);
  return NextResponse.json({ player, total, events: items });
}
