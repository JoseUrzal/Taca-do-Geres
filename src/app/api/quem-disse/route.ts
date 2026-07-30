import { NextResponse } from "next/server";
import { getPlayerId } from "@/lib/identity";
import { serializeRound } from "@/lib/round";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const viewerId = await getPlayerId();
  const [round, players] = await Promise.all([serializeRound(viewerId), getPlayers()]);
  return NextResponse.json({
    round,
    me: viewerId,
    players: players.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji })),
  });
}
