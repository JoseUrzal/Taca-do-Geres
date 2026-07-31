import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getFeed, getGameState, getLeaderboard } from "@/lib/queries";
import { serializeRound } from "@/lib/round";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getGameState();
  const [{ individual, teams }, feed, round, { data: moments }] = await Promise.all([
    getLeaderboard(),
    getFeed(8),
    serializeRound(null),
    db()
      .from("moments")
      .select("id, text, created_at, player:player_id(name, emoji)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // sorteio de equipas em curso: todos têm equipa mas a revelação na TV
  // ainda não acabou (reveal ≤ nº de jogadores)
  const players = individual.map((r) => r.player);
  const allAssigned = players.length > 0 && players.every((p) => p.team_id);
  const draw =
    allAssigned && state.draw_reveal <= players.length
      ? {
          reveal: state.draw_reveal,
          total: players.length,
          players: [...players]
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((p) => ({ name: p.name, emoji: p.emoji, team_id: p.team_id })),
          teams: teams.map((t) => ({
            id: t.team.id,
            name: t.team.name,
            colour: t.team.colour_hex,
          })),
        }
      : null;

  return NextResponse.json({
    day: state.current_day,
    top5: individual.slice(0, 5),
    teams,
    feed,
    moments: moments ?? [],
    round,
    draw,
  });
}
