import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Raio-X das cumplicidades: quem vota ✅ nas missões de quem, no Tribunal.
// Nível de parceria = o máximo de ✅ que alguém do par deu ao outro num só
// dia: 2 (o limite diário) → «parceria? 🤔», 1 → «suspeito 🧐», 0 → «tranqui».
// Tudo público — o grupo vê os padrões e julga socialmente.
export async function GET() {
  const [players, { data: approvals }] = await Promise.all([
    getPlayers(),
    db()
      .from("approvals")
      .select("player_id, vote, created_at, assignment:assignment_id(player_id)"),
  ]);

  type Row = {
    player_id: string;
    vote: boolean;
    created_at: string;
    assignment: { player_id: string } | null;
  };
  const byId = new Map(players.map((p) => [p.id, p]));

  // direção votante→dono da missão: totais ✅/❌ e ✅ por dia (Lisboa)
  const yes = new Map<string, number>();
  const no = new Map<string, number>();
  const yesByDay = new Map<string, number>(); // `${votante}|${dono}|${dia}`
  for (const a of (approvals ?? []) as unknown as Row[]) {
    const owner = a.assignment?.player_id;
    if (!owner || owner === a.player_id) continue;
    const key = `${a.player_id}|${owner}`;
    if (a.vote) {
      yes.set(key, (yes.get(key) ?? 0) + 1);
      const dia = new Date(a.created_at).toLocaleDateString("en-CA", {
        timeZone: "Europe/Lisbon",
      });
      const dayKey = `${key}|${dia}`;
      yesByDay.set(dayKey, (yesByDay.get(dayKey) ?? 0) + 1);
    } else {
      no.set(key, (no.get(key) ?? 0) + 1);
    }
  }

  // máximo de ✅ num só dia, por direção
  const dailyMax = new Map<string, number>();
  for (const [dayKey, n] of yesByDay) {
    const dir = dayKey.slice(0, dayKey.lastIndexOf("|"));
    dailyMax.set(dir, Math.max(dailyMax.get(dir) ?? 0, n));
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
    const level = Math.min(
      2,
      Math.max(dailyMax.get(`${x}|${y}`) ?? 0, dailyMax.get(`${y}|${x}`) ?? 0)
    );
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
      level,
    });
  }
  pairs.sort((p, q) => q.level - p.level || q.total - p.total);

  return NextResponse.json({ pairs });
}
