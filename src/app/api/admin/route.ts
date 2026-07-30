import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { isAdmin } from "@/lib/identity";
import { getGameState, getPlayers, getTeams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ admin: false }, { status: 200 });

  const state = await getGameState();
  const [players, teams, { data: prompts }, round] = await Promise.all([
    getPlayers(),
    getTeams(),
    db().from("prompts").select("id, text").eq("used", false).order("text"),
    state.active_round_id
      ? db()
          .from("rounds")
          .select("id, prompt, status, reveal_index")
          .eq("id", state.active_round_id)
          .single()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  return NextResponse.json({
    admin: true,
    day: state.current_day,
    camera_player_id: state.camera_player_id,
    draw_reveal: state.draw_reveal,
    players,
    teams,
    prompts: prompts ?? [],
    round,
  });
}
