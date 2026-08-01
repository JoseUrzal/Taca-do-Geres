import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { addScore, getPlayers } from "@/lib/queries";

// Fechar a votação: cada boletim dá 3/2/1 pontos de voto ao 1.º/2.º/3.º
// escolhido; o voto do Cristian (chef convidado) vale o dobro. Os 3 com
// mais pontos de voto levam o pódio 10/6/3. Empates: ordem alfabética.
// O UPDATE guardado por status='previsto' garante que só pontua uma vez.
const SLOT_PTS: Record<number, number> = { 1: 3, 2: 2, 3: 1 };

export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { event_id } = (await req.json()) as { event_id: string };
  if (!event_id) return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });

  const [{ data: votes }, players] = await Promise.all([
    db().from("event_votes").select("voter_id, target_id, slot").eq("event_id", event_id),
    getPlayers(),
  ]);
  if (!votes || votes.length === 0) {
    return NextResponse.json({ error: "sem_votos" }, { status: 409 });
  }

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const chef = players.find((p) => p.name === "Cristian")?.id ?? null;

  const counts = new Map<string, number>();
  for (const v of votes) {
    const base = SLOT_PTS[v.slot] ?? 1;
    const peso = v.voter_id === chef ? base * 2 : base;
    counts.set(v.target_id, (counts.get(v.target_id) ?? 0) + peso);
  }
  const ranked = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || nameOf(a[0]).localeCompare(nameOf(b[0]))
  );
  const [first, second, third] = ranked.map(([id]) => id);

  const { data: updated, error } = await db()
    .from("events")
    .update({
      status: "jogado",
      first_id: first,
      second_id: second ?? null,
      third_id: third ?? null,
      played_at: new Date().toISOString(),
    })
    .eq("id", event_id)
    .eq("status", "previsto")
    .select()
    .single();
  if (error || !updated) {
    return NextResponse.json({ error: "ja_registado" }, { status: 409 });
  }

  const podium: [string | undefined, number, string][] = [
    [first, 10, "1.º lugar"],
    [second, 6, "2.º lugar"],
    [third, 3, "3.º lugar"],
  ];
  for (const [playerId, points, place] of podium) {
    if (playerId) {
      const n = counts.get(playerId) ?? 0;
      await addScore(
        playerId,
        points,
        `${updated.name} — ${place} (${n} pts de voto)`,
        "manual"
      );
    }
  }
  return NextResponse.json({
    ok: true,
    podium: ranked.slice(0, 3).map(([id, n]) => ({ name: nameOf(id), votes: n })),
  });
}
