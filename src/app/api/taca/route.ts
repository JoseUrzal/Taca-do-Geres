import { NextResponse } from "next/server";
import { getLeaderboard, getTeams } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ individual, teams }, allTeams] = await Promise.all([getLeaderboard(), getTeams()]);
  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  return NextResponse.json({
    individual: individual.map((r) => ({
      ...r,
      team_colour: r.player.team_id ? teamById.get(r.player.team_id)?.colour_hex : null,
    })),
    teams,
  });
}
