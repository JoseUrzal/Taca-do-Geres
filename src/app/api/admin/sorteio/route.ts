import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";
import { getPlayers, getTeams } from "@/lib/queries";

// Sorteio de equipas: baralha os 10 e divide 5/5. Reset do draw_reveal
// põe a TV em modo sorteio, a revelar um a um com o botão «Próxima».
export async function POST() {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const [players, teams] = await Promise.all([getPlayers(), getTeams()]);
  if (teams.length < 2) return NextResponse.json({ error: "faltam_equipas" }, { status: 500 });

  const pool = [...players];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const half = Math.ceil(pool.length / 2);

  for (let i = 0; i < pool.length; i++) {
    const teamId = i < half ? teams[0].id : teams[1].id;
    const { error } = await db().from("players").update({ team_id: teamId }).eq("id", pool[i].id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db().from("game_state").update({ draw_reveal: 0 }).eq("id", 1);
  return NextResponse.json({ ok: true });
}
