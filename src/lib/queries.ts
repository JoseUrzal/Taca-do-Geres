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

export type ActivityItem = {
  id: string;
  kind: "pontos" | "tribunal" | "evento";
  points: number | null;
  text: string;
  player: { name: string; emoji: string } | null;
  created_at: string;
};

// Últimas atividades: pontos ganhos, chumbos do Tribunal e eventos
// anunciados, tudo numa linha do tempo só.
export async function getActivity(limit = 20): Promise<ActivityItem[]> {
  const [{ data: scores }, { data: chumbadas }, { data: eventos }] = await Promise.all([
    db()
      .from("score_events")
      .select("id, points, reason, created_at, player:player_id(name, emoji)")
      .order("created_at", { ascending: false })
      .limit(limit),
    db()
      .from("assignments")
      .select("id, mission:mission_id(text), player:player_id(name, emoji), approvals(created_at)")
      .eq("status", "chumbada"),
    db()
      .from("events")
      .select("id, name, when_hint, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  type ScoreRow = {
    id: string;
    points: number;
    reason: string;
    created_at: string;
    player: { name: string; emoji: string } | null;
  };
  type ChumboRow = {
    id: string;
    mission: { text: string } | null;
    player: { name: string; emoji: string } | null;
    approvals: { created_at: string }[];
  };

  const items: ActivityItem[] = [];
  for (const s of (scores ?? []) as unknown as ScoreRow[]) {
    items.push({
      id: s.id,
      kind: "pontos",
      points: s.points,
      text: s.reason,
      player: s.player,
      created_at: s.created_at,
    });
  }
  for (const c of (chumbadas ?? []) as unknown as ChumboRow[]) {
    // o chumbo resolve-se no último voto — é essa a hora que conta
    const at = c.approvals.map((v) => v.created_at).sort().pop();
    if (!at) continue;
    items.push({
      id: `chumbo-${c.id}`,
      kind: "tribunal",
      points: null,
      text: `Tribunal chumbou: «${c.mission?.text ?? "?"}»`,
      player: c.player,
      created_at: at,
    });
  }
  for (const e of eventos ?? []) {
    items.push({
      id: `evento-${e.id}`,
      kind: "evento",
      points: null,
      text: `Novo evento: ${e.name}${e.when_hint ? ` · ${e.when_hint}` : ""}`,
      player: null,
      created_at: e.created_at,
    });
  }
  return items
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

// Relatório do dia para a TV — vergonha e glória em partes iguais.
export async function getStats(): Promise<{ icon: string; label: string; value: string }[]> {
  const players = await getPlayers();
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "?";

  const [{ data: scores }, { data: accusations }, { data: answers }, { data: guesses }, { data: approvals }] =
    await Promise.all([
      db().from("score_events").select("player_id, points, created_at"),
      db().from("accusations").select("accuser_id, target_id, correct"),
      db().from("answers").select("id, player_id, text"),
      db().from("guesses").select("answer_id, guessed_player_id"),
      db().from("approvals").select("player_id, vote"),
    ]);

  const top = (m: Map<string, number>) => {
    let best: string | null = null;
    for (const [id, n] of m) if (n > 0 && (best === null || n > (m.get(best) ?? 0))) best = id;
    return best ? { id: best, n: m.get(best)! } : null;
  };
  const stats: { icon: string; label: string; value: string }[] = [];

  // em alta: quem somou mais na última hora + totais para a luta pelo ouro
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const lastHour = new Map<string, number>();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
  const todayPts = new Map<string, number>(players.map((p) => [p.id, 0]));
  const totals = new Map<string, number>(players.map((p) => [p.id, 0]));
  for (const s of scores ?? []) {
    totals.set(s.player_id, (totals.get(s.player_id) ?? 0) + s.points);
    if (s.created_at >= hourAgo && s.points > 0) {
      lastHour.set(s.player_id, (lastHour.get(s.player_id) ?? 0) + s.points);
    }
    const d = new Date(s.created_at).toLocaleDateString("en-CA", { timeZone: "Europe/Lisbon" });
    if (d === today) todayPts.set(s.player_id, (todayPts.get(s.player_id) ?? 0) + s.points);
  }
  const hot = top(lastHour);
  if (hot) stats.push({ icon: "🔥", label: "Em alta (última hora)", value: `${nameOf(hot.id)} +${hot.n}` });

  // luta pelo ouro: distância do 2.º ao 1.º
  const ranked = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  if (ranked.length >= 2 && ranked[0][1] > 0) {
    const gap = ranked[0][1] - ranked[1][1];
    stats.push({
      icon: "🥊",
      label: "Luta pelo ouro",
      value:
        gap === 0
          ? `${nameOf(ranked[0][0])} e ${nameOf(ranked[1][0])} empatados!`
          : `${nameOf(ranked[1][0])} a ${gap} ${gap === 1 ? "ponto" : "pontos"} de ${nameOf(ranked[0][0])}`,
    });
  }

  // acusações: caçador, vítima preferida, perseguição e falhanços
  const certas = new Map<string, number>();
  const falhadas = new Map<string, number>();
  const sofridas = new Map<string, number>();
  const pares = new Map<string, number>();
  for (const a of accusations ?? []) {
    const m = a.correct ? certas : falhadas;
    m.set(a.accuser_id, (m.get(a.accuser_id) ?? 0) + 1);
    sofridas.set(a.target_id, (sofridas.get(a.target_id) ?? 0) + 1);
    const key = `${a.accuser_id}|${a.target_id}`;
    pares.set(key, (pares.get(key) ?? 0) + 1);
  }
  const cacador = top(certas);
  if (cacador)
    stats.push({ icon: "🎯", label: "Caçador de espiões", value: `${nameOf(cacador.id)} · ${cacador.n} ${cacador.n === 1 ? "acusação certa" : "acusações certas"}` });
  const vitima = top(sofridas);
  if (vitima)
    stats.push({ icon: "🐑", label: "Vítima preferida", value: `${nameOf(vitima.id)} · acusado ${vitima.n}× ` });
  let perseguicao: { key: string; n: number } | null = null;
  for (const [key, n] of pares) {
    if (n >= 2 && (!perseguicao || n > perseguicao.n)) perseguicao = { key, n };
  }
  if (perseguicao) {
    const [acc, alvo] = perseguicao.key.split("|");
    stats.push({
      icon: "👀",
      label: "Perseguição do fim de semana",
      value: `${nameOf(acc)} não larga ${nameOf(alvo)} (${perseguicao.n} acusações)`,
    });
  }
  const trapalhao = top(falhadas);
  if (trapalhao)
    stats.push({ icon: "🙈", label: "Acusações falhadas", value: `${nameOf(trapalhao.id)} · ${trapalhao.n}` });

  // quizz: mais enganador acumulado + o testamento mais longo
  const autorDe = new Map((answers ?? []).map((a) => [a.id, a.player_id]));
  const enganador = new Map<string, number>();
  for (const g of guesses ?? []) {
    const autor = autorDe.get(g.answer_id);
    if (autor && g.guessed_player_id !== autor) enganador.set(autor, (enganador.get(autor) ?? 0) + 1);
  }
  const eng = top(enganador);
  if (eng)
    stats.push({ icon: "🎭", label: "Mais enganador do Quizz", value: `${nameOf(eng.id)} · ${eng.n} ${eng.n === 1 ? "palpite enganado" : "palpites enganados"}` });
  let testamento: { player_id: string; len: number } | null = null;
  for (const a of answers ?? []) {
    const len = (a.text ?? "").length;
    if (len > 120 && (!testamento || len > testamento.len)) testamento = { player_id: a.player_id, len };
  }
  if (testamento)
    stats.push({
      icon: "📜",
      label: "Testamento do Quizz",
      value: `${nameOf(testamento.player_id)} · resposta de ${testamento.len} caracteres`,
    });

  // tribunal: juiz mais duro e juiz mais bonzinho
  const duro = new Map<string, number>();
  const bonzinho = new Map<string, number>();
  for (const v of approvals ?? []) {
    const m = v.vote ? bonzinho : duro;
    m.set(v.player_id, (m.get(v.player_id) ?? 0) + 1);
  }
  const juiz = top(duro);
  if (juiz)
    stats.push({ icon: "⚖️", label: "Juiz mais duro", value: `${nameOf(juiz.id)} · ${juiz.n} ❌` });
  const anjo = top(bonzinho);
  if (anjo)
    stats.push({ icon: "😇", label: "Juiz mais bonzinho", value: `${nameOf(anjo.id)} · ${anjo.n} ✅` });

  // quem ainda não marcou hoje
  const zeros = players.filter((p) => (todayPts.get(p.id) ?? 0) <= 0).map((p) => p.name);
  if (zeros.length > 0 && zeros.length < players.length) {
    stats.push({
      icon: "😴",
      label: "Ainda a zeros hoje",
      value: zeros.length > 4 ? `${zeros.slice(0, 4).join(", ")} +${zeros.length - 4}` : zeros.join(", "),
    });
  }

  return stats;
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
