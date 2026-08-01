import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { isAdmin } from "@/lib/identity";
import { getActivity, getGameState, getLeaderboard, getStats } from "@/lib/queries";
import { serializeRound } from "@/lib/round";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await getGameState();
  const [
    { individual },
    activity,
    stats,
    round,
    { data: moments },
    { data: tribunal },
    { data: nextEvent },
  ] = await Promise.all([
    getLeaderboard(),
    getActivity(8),
    getStats(),
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
    db()
      .from("events")
      .select("name, when_hint")
      .eq("status", "previsto")
      .order("created_at")
      .limit(1)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    day: state.current_day,
    board: individual,
    activity,
    stats,
    moments: moments ?? [],
    tribunal: tribunal ?? [],
    next_event: nextEvent,
    round,
    // o /tv também serve de segundo ecrã nos telemóveis: os botões de
    // avançar a revelação do quizz só aparecem a quem tem sessão de admin
    can_control: await isAdmin(),
  });
}
