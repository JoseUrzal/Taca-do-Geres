import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { addScore } from "@/lib/queries";

// Registar o resultado de um evento anunciado: pódio 10/6/3.
// O UPDATE guardado por status='previsto' garante que só pontua uma vez.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { event_id, first, second, third } = (await req.json()) as {
    event_id: string;
    first?: string;
    second?: string;
    third?: string;
  };
  if (!event_id || !first) {
    return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });
  }

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
    if (playerId) await addScore(playerId, points, `${updated.name} — ${place}`, "manual");
  }
  return NextResponse.json({ ok: true });
}
