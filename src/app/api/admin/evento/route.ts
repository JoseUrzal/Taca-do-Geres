import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/identity";
import { addScore } from "@/lib/queries";

// Evento completo: nome + pódio. 1.º/2.º/3.º = 10/6/3 pontos.
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { name, first, second, third } = (await req.json()) as {
    name: string;
    first?: string;
    second?: string;
    third?: string;
  };
  if (!name?.trim() || !first) {
    return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });
  }

  const podium: [string | undefined, number, string][] = [
    [first, 10, "1.º lugar"],
    [second, 6, "2.º lugar"],
    [third, 3, "3.º lugar"],
  ];
  for (const [playerId, points, place] of podium) {
    if (playerId) {
      await addScore(playerId, points, `${name.trim()} — ${place}`, "manual");
    }
  }
  return NextResponse.json({ ok: true });
}
