import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Raio-X das cumplicidades: quem vota ✅ nas missões de quem, no Tribunal.
// Tudo público — o objetivo é o grupo ver os padrões (parcerias de
// aprovação mútua) e julgar socialmente. Não bloqueia nada.
export async function GET() {
  const [players, { data: approvals }] = await Promise.all([
    getPlayers(),
    db()
      .from("approvals")
      .select("player_id, vote, assignment:assignment_id(player_id)"),
  ]);

  type Row = { player_id: string; vote: boolean; assignment: { player_id: string } | null };
  const byId = new Map(players.map((p) => [p.id, p]));

  // direção votante→dono da missão: quantos ✅ e ❌
  const yes = new Map<string, number>();
  const no = new Map<string, number>();
  for (const a of (approvals ?? []) as unknown as Row[]) {
    const owner = a.assignment?.player_id;
    if (!owner || owner === a.player_id) continue;
    const key = `${a.player_id}|${owner}`;
    const m = a.vote ? yes : no;
    m.set(key, (m.get(key) ?? 0) + 1);
  }

  // pares não ordenados com os dois sentidos lado a lado
  const seen = new Set<string>();
  const pairs = [];
  for (const key of new Set([...yes.keys(), ...no.keys()])) {
    const [a, b] = key.split("|");
    const pairKey = [a, b].sort().join("|");
    if (seen.has(pairKey)) continue;
    seen.add(pairKey);
    const [x, y] = pairKey.split("|");
    const xToY = yes.get(`${x}|${y}`) ?? 0;
    const yToX = yes.get(`${y}|${x}`) ?? 0;
    const xToYNo = no.get(`${x}|${y}`) ?? 0;
    const yToXNo = no.get(`${y}|${x}`) ?? 0;
    const total = xToY + yToX;
    if (total + xToYNo + yToXNo === 0) continue;
    const px = byId.get(x);
    const py = byId.get(y);
    pairs.push({
      a: { name: px?.name ?? "?", emoji: px?.emoji ?? "" },
      b: { name: py?.name ?? "?", emoji: py?.emoji ?? "" },
      a_yes_b: xToY,
      b_yes_a: yToX,
      a_no_b: xToYNo,
      b_no_a: yToXNo,
      total,
      // parceria: aprovação mútua repetida ou volume alto de ✅ cruzados
      flag: (xToY >= 2 && yToX >= 2) || total >= 4,
    });
  }
  pairs.sort((p, q) => q.total - p.total);

  return NextResponse.json({ pairs });
}
