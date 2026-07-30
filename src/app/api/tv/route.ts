import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getFeed, getGameState, getLeaderboard } from "@/lib/queries";
import { serializeRound } from "@/lib/round";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getGameState();
  const [{ individual, teams }, feed, round, camera] = await Promise.all([
    getLeaderboard(),
    getFeed(8),
    serializeRound(null),
    state.camera_player_id
      ? db().from("players").select("name, emoji").eq("id", state.camera_player_id).single()
      : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    day: state.current_day,
    top5: individual.slice(0, 5),
    teams,
    feed,
    camera: camera && "data" in camera ? camera.data : null,
    round,
  });
}
