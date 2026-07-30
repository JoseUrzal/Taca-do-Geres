import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/identity";
import { addScore } from "@/lib/queries";

// Pontos manuais: { entries: [{ player_id, points }], reason }
// Correções fazem-se com pontos negativos — nunca se apaga histórico.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { entries, reason } = (await req.json()) as {
    entries: { player_id: string; points: number }[];
    reason: string;
  };
  if (!entries?.length || !reason?.trim()) {
    return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });
  }

  for (const e of entries) {
    if (!e.player_id || !Number.isFinite(e.points)) continue;
    await addScore(e.player_id, Math.trunc(e.points), reason.trim(), "manual");
  }
  return NextResponse.json({ ok: true });
}
