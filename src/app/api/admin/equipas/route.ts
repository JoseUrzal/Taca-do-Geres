import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";

// Renomear as equipas — os nomes decidem-se ao vivo na abertura.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { teams } = (await req.json()) as { teams: { id: string; name: string }[] };
  if (!teams?.length) return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });

  for (const t of teams) {
    if (!t.id || !t.name?.trim()) continue;
    const { error } = await db().from("teams").update({ name: t.name.trim() }).eq("id", t.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
