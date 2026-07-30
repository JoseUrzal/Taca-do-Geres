import { db } from "./supabase";
import type { LeaderboardRow, Player, Team } from "./types";

export async function getGameState() {
  const { data, error } = await db().from("game_state").select("*").eq("id", 1).single();
  if (error) throw new Error(`game_state: ${error.message}`);
  return data as {
    id: number;
    current_day: number;
    active_round_id: string | null;
    camera_player_id: string | null;
  };
}

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await db().from("players").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as Player[];
}

export async function getTeams(): Promise<Team[]> {
  const { data, error } = await db().from("teams").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as Team[];
}

// Leaderboard = sempre SUM(score_events). Nunca totais guardados.
export async function getLeaderboard(): Promise<{
  individual: LeaderboardRow[];
  teams: { team: Team; points: number; rank: number }[];
}> {
  const [players, teams, events] = await Promise.all([
    getPlayers(),
    getTeams(),
    db().from("score_events").select("player_id, team_id, points").then(({ data, error }) => {
      if (error) throw new Error(error.message);
      return data as { player_id: string; team_id: string | null; points: number }[];
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

  const byTeam = new Map<string, number>();
  for (const p of players) {
    if (p.team_id) byTeam.set(p.team_id, (byTeam.get(p.team_id) ?? 0) + (byPlayer.get(p.id) ?? 0));
  }
  const teamRows = teams
    .map((t) => ({ team: t, points: byTeam.get(t.id) ?? 0, rank: 0 }))
    .sort((a, b) => b.points - a.points);
  teamRows.forEach((row, i) => {
    row.rank = i > 0 && row.points === teamRows[i - 1].points ? teamRows[i - 1].rank : i + 1;
  });

  return { individual, teams: teamRows };
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

// Insere um score_event; team_id vai preenchido para contar para a equipa.
export async function addScore(
  playerId: string,
  points: number,
  reason: string,
  source: "missao" | "acusacao" | "quem_disse" | "manual"
) {
  const { data: player } = await db().from("players").select("team_id").eq("id", playerId).single();
  const { error } = await db().from("score_events").insert({
    player_id: playerId,
    team_id: player?.team_id ?? null,
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
  const deals: { player_id: string; mission_id: string; day: number }[] = [];
  let i = 0;
  for (const p of players) {
    for (let k = 0; k < 3 && i < available.length; k++) {
      deals.push({ player_id: p.id, mission_id: available[i++].id, day });
    }
  }
  if (deals.length > 0) {
    const { error } = await db().from("assignments").insert(deals);
    if (error) throw new Error(`deal: ${error.message}`);
  }
  return deals.length;
}
