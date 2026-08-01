import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const [{ data: claims, error }, { data: myYesRows }] = await Promise.all([
    db()
      .from("assignments")
      .select(
        "id, status, created_at, player:player_id(id, name, emoji), mission:mission_id(text, points, difficulty), approvals(player_id, vote, voter:player_id(name))"
      )
      .eq("status", "reclamada")
      .order("created_at"),
    // quantos ✅ já dei a cada pessoa — para avisar do limite de cumplicidade
    db()
      .from("approvals")
      .select("assignment:assignment_id(player_id)")
      .eq("player_id", playerId)
      .eq("vote", true),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const myYesTo = new Map<string, number>();
  for (const r of (myYesRows ?? []) as unknown as { assignment: { player_id: string } | null }[]) {
    const owner = r.assignment?.player_id;
    if (owner) myYesTo.set(owner, (myYesTo.get(owner) ?? 0) + 1);
  }

  return NextResponse.json({
    me: playerId,
    claims: (claims ?? []).map((c) => {
      const approvals = (c.approvals ?? []) as unknown as {
        player_id: string;
        vote: boolean;
        voter: { name: string } | null;
      }[];
      return {
        id: c.id,
        player: c.player,
        mission: c.mission,
        yes: approvals.filter((a) => a.vote).length,
        no: approvals.filter((a) => !a.vote).length,
        // votos são públicos: chumbar tem nome
        yes_names: approvals.filter((a) => a.vote).map((a) => a.voter?.name ?? "?"),
        no_names: approvals.filter((a) => !a.vote).map((a) => a.voter?.name ?? "?"),
        my_vote: approvals.find((a) => a.player_id === playerId)?.vote ?? null,
        is_mine: (c.player as unknown as { id: string })?.id === playerId,
        my_yes_to_owner: myYesTo.get((c.player as unknown as { id: string })?.id) ?? 0,
      };
    }),
  });
}
