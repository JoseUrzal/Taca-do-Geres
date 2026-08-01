import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";

// Subir um evento na ordem. A ordem dos eventos previstos é o created_at,
// por isso subir = trocar o created_at com o vizinho de cima. O primeiro
// da lista é o «próximo evento» na TV e na Casa de todos.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { event_id } = (await req.json()) as { event_id: string };
  if (!event_id) return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });

  const { data: eventos } = await db()
    .from("events")
    .select("id, created_at")
    .eq("status", "previsto")
    .order("created_at");
  const list = eventos ?? [];
  const i = list.findIndex((e) => e.id === event_id);
  if (i < 0) return NextResponse.json({ error: "ja_jogado" }, { status: 409 });
  if (i === 0) return NextResponse.json({ ok: true }); // já é o primeiro

  const acima = list[i - 1];
  const eu = list[i];
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    db().from("events").update({ created_at: acima.created_at }).eq("id", eu.id),
    db().from("events").update({ created_at: eu.created_at }).eq("id", acima.id),
  ]);
  if (e1 || e2) {
    return NextResponse.json({ error: (e1 ?? e2)?.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
