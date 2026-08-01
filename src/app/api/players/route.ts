import { NextResponse } from "next/server";
import { getPlayers } from "@/lib/queries";
import { getPlayerId } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const [players, me] = await Promise.all([getPlayers(), getPlayerId()]);
  return NextResponse.json({ players, me });
}
