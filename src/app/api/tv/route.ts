import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { isAdmin } from "@/lib/identity";
import { getFeed, getGameState, getLeaderboard } from "@/lib/queries";
import { serializeRound } from "@/lib/round";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getGameState();
  const [{ individual }, feed, round, { data: moments }, { data: tribunal }] =
    await Promise.all([
    getLeaderboard(),
    getFeed(8),
    serializeRound(null),
    db()
      .from("moments")
      .select("id, text, created_at, player:player_id(name, emoji)")
      .order("created_at", { ascending: false })
      .limit(5),
    db()
      .from("assignments")
      .select("id, player:player_id(name, emoji), mission:mission_id(text, points)")
      .eq("status", "reclamada")
      .order("created_at")
      .limit(4),
  ]);

  return NextResponse.json({
    day: state.current_day,
    top5: individual.slice(0, 5),
    feed,
    moments: moments ?? [],
    tribunal: tribunal ?? [],
    round,
    // o /tv também serve de segundo ecrã nos telemóveis: os botões de
    // avançar a revelação do quizz só aparecem a quem tem sessão de admin
    can_control: await isAdmin(),
  });
}
