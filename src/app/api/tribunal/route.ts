import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { data: claims, error } = await db()
    .from("assignments")
    .select(
      "id, status, created_at, player:player_id(id, name, emoji), mission:mission_id(text, points, difficulty), approvals(player_id, vote)"
    )
    .eq("status", "reclamada")
    .order("created_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    me: playerId,
    claims: (claims ?? []).map((c) => {
      const approvals = (c.approvals ?? []) as { player_id: string; vote: boolean }[];
      return {
        id: c.id,
        player: c.player,
        mission: c.mission,
        yes: approvals.filter((a) => a.vote).length,
        no: approvals.filter((a) => !a.vote).length,
        my_vote: approvals.find((a) => a.player_id === playerId)?.vote ?? null,
        is_mine: (c.player as unknown as { id: string })?.id === playerId,
      };
    }),
  });
}
