import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { addScore, getPlayers } from "@/lib/queries";

// Fechar a votação de um evento: conta os votos, apura os 3 mais votados
// e dá o pódio 10/6/3. Empates decidem-se por ordem alfabética (determinístico).
// O UPDATE guardado por status='previsto' garante que só pontua uma vez.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { event_id } = (await req.json()) as { event_id: string };
  if (!event_id) return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });

  const [{ data: votes }, players] = await Promise.all([
    db().from("event_votes").select("target_id").eq("event_id", event_id),
    getPlayers(),
  ]);
  if (!votes || votes.length === 0) {
    return NextResponse.json({ error: "sem_votos" }, { status: 409 });
  }

  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";
  const counts = new Map<string, number>();
  for (const v of votes) counts.set(v.target_id, (counts.get(v.target_id) ?? 0) + 1);
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
        `${updated.name} — ${place} (${n} ${n === 1 ? "voto" : "votos"})`,
        "manual"
      );
    }
  }
  return NextResponse.json({
    ok: true,
    podium: ranked.slice(0, 3).map(([id, n]) => ({ name: nameOf(id), votes: n })),
  });
}
