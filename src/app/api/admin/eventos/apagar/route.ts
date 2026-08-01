import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";

// Apagar um evento anunciado. Só enquanto está 'previsto' — um evento
// jogado já deu pontos e faz parte da história.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { event_id } = (await req.json()) as { event_id: string };
  if (!event_id) return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });

  const { data, error } = await db()
    .from("events")
    .delete()
    .eq("id", event_id)
    .eq("status", "previsto")
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "ja_jogado" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
