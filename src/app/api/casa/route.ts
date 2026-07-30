import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";
import { getFeed, getGameState, getLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const state = await getGameState();

  const [
    { individual },
    { data: missions },
    { count: accusationsUsed },
    feed,
    camera,
    { count: tribunalPending },
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
    getFeed(15),
    state.camera_player_id
      ? db().from("players").select("name, emoji").eq("id", state.camera_player_id).single()
      : Promise.resolve({ data: null }),
    db()
      .from("assignments")
      .select("id", { count: "exact", head: true })
      .eq("status", "reclamada"),
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
    camera: camera && "data" in camera ? camera.data : null,
    feed,
    tribunal_pending: tribunalPending ?? 0,
    active_round: !!state.active_round_id,
  });
}
