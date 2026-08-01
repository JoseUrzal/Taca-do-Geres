import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";

// Editar nome/quando de um evento ainda por jogar.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { event_id, name, when_hint } = (await req.json()) as {
    event_id: string;
    name?: string;
    when_hint?: string | null;
  };
  if (!event_id || !name?.trim()) {
    return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });
  }

  const { data, error } = await db()
    .from("events")
    .update({ name: name.trim(), when_hint: when_hint?.trim() || null })
    .eq("id", event_id)
    .eq("status", "previsto")
    .select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    return NextResponse.json({ error: "ja_jogado" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
