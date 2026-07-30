import { NextResponse } from "next/server";
import { getPlayers, getTeams } from "@/lib/queries";
import { getPlayerId } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const [players, teams, me] = await Promise.all([getPlayers(), getTeams(), getPlayerId()]);
  return NextResponse.json({ players, teams, me });
}
