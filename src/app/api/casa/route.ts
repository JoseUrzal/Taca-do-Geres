import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { getGameState, getLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const state = await getGameState();

  const [
    { individual },
    { data: missions },
    { count: accusationsUsed },
    { count: tribunalPending },
    { data: nextEvent },
  ] = await Promise.all([
    getLeaderboard(),
    db()
      .from("assignments")
      .select("id, status, mission:mission_id(id, text, points, difficulty)")
      .eq("player_id", playerId)
      .eq("day", state.current_day)
      .in("status", ["ativa", "reclamada"])
      .order("created_at"),
    db()
      .from("accusations")
      .select("id", { count: "exact", head: true })
      .eq("accuser_id", playerId)
      .eq("day", state.current_day),
    db()
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("status", "reclamada"),
    db()
      .from("events")
      .select("name, when_hint")
      .eq("status", "previsto")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  const meRow = individual.find((r) => r.player.id === playerId);
  if (!meRow) return NextResponse.json({ error: "sem_identidade" }, { status: 401 });

  return NextResponse.json({
    me: meRow.player,
    points: meRow.points,
    rank: meRow.rank,
    total_players: individual.length,
    day: state.current_day,
    missions: missions ?? [],
    accusations_left: Math.max(0, 2 - (accusationsUsed ?? 0)),
    tribunal_pending: tribunalPending ?? 0,
    active_round: !!state.active_round_id,
    next_event: nextEvent,
  });
}
