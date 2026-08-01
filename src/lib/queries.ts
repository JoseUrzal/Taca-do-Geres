import { db } from "./supabase";
import type { LeaderboardRow, Player } from "./types";

export async function getGameState() {
  const { data, error } = await db().from("game_state").select("*").eq("id", 1).single();
  if (error) throw new Error(`game_state: ${error.message}`);
  return data as {
    id: number;
    current_day: number;
    active_round_id: string | null;
    camera_player_id: string | null;
    draw_reveal: number;
  };
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await db().from("players").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as Player[];
}

// Leaderboard = sempre SUM(score_events). Nunca totais guardados.
// Campeonato 100% individual — as equipas foram retiradas do jogo.
export async function getLeaderboard(): Promise<{ individual: LeaderboardRow[] }> {
  const [players, events] = await Promise.all([
    getPlayers(),
    db().from("score_events").select("player_id, points").then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return data as { player_id: string; points: number }[];
    }),
  ]);

  const byPlayer = new Map<string, number>();
  for (const e of events) {
    byPlayer.set(e.player_id, (byPlayer.get(e.player_id) ?? 0) + e.points);
  }

  const individual = players
    .map((p) => ({ player: p, points: byPlayer.get(p.id) ?? 0, rank: 0 }))
    .sort((a, b) => b.points - a.points || a.player.name.localeCompare(b.player.name));
  individual.forEach((row, i) => {
    row.rank = i > 0 && row.points === individual[i - 1].points ? individual[i - 1].rank : i + 1;
  });

  return { individual };
}

export async function getFeed(limit = 20) {
  const { data, error } = await db()
    .from("score_events")
    .select("id, points, reason, source, created_at, player:player_id(name, emoji)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data;
}

// Insere um score_event (pontos são sempre individuais).
export async function addScore(
  playerId: string,
  points: number,
  reason: string,
  source: "missao" | "acusacao" | "quem_disse" | "manual"
) {
  const { error } = await db().from("score_events").insert({
    player_id: playerId,
    points,
    reason,
    source,
  });
  if (error) throw new Error(`score_events: ${error.message}`);
}

// Dá 3 missões novas a cada jogador para o dia `day`.
// unique(mission_id) em assignments garante que nunca há repetições no fim de semana.
export async function dealMissions(day: number) {
  const [players, { data: missions }, { data: used }] = await Promise.all([
    getPlayers(),
    db().from("missions").select("id").eq("active", true),
    db().from("assignments").select("mission_id"),
  ]);
  const usedIds = new Set((used ?? []).map((u) => u.mission_id));
  const available = (missions ?? []).filter((m) => !usedIds.has(m.id));
  // shuffle
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  // distribui à vez (como cartas): se o baralho não chega para 3 a todos,
  // cada jogador recebe o mesmo número — nunca uns com 3 e outros com 0
  const deals: { player_id: string; mission_id: string; day: number }[] = [];
  let i = 0;
  for (let ronda = 0; ronda < 3; ronda++) {
    for (const p of players) {
      if (i >= available.length) break;
      deals.push({ player_id: p.id, mission_id: available[i++].id, day });
    }
  }
  if (deals.length > 0) {
    const { error } = await db().from("assignments").insert(deals);
    if (error) throw new Error(`deal: ${error.message}`);
  }
  return deals.length;
}
