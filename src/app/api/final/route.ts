import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getLeaderboard, getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Dados da cerimónia de encerramento: pódio + medalhas honoríficas
// calculadas a partir do histórico completo do fim de semana.
export async function GET() {
  // o desempate oficial (pontos → missões confirmadas) já vem aplicado
  // do getLeaderboard — a final usa a mesma ordem que toda a gente vê
  const [players, { individual }] = await Promise.all([
    getPlayers(),
    getLeaderboard(),
  ]);
  const byId = new Map(players.map((p) => [p.id, p]));
  const name = (id: string | null) => (id ? byId.get(id)?.name ?? "?" : "?");
  const emoji = (id: string | null) => (id ? byId.get(id)?.emoji ?? "" : "");

  const [
    { data: accusations },
    { data: chumbos },
    { data: moments },
    { data: answers },
    { data: guesses },
  ] = await Promise.all([
    db().from("accusations").select("accuser_id, target_id, correct"),
    db()
      .from("approvals")
      .select("player_id, vote, assignment:assignment_id(status)")
      .eq("vote", false),
    db().from("moments").select("player_id"),
    db().from("answers").select("id, player_id"),
    db().from("guesses").select("answer_id, guessed_player_id"),
  ]);

  const top = (m: Map<string, number>) => {
    let best: string | null = null;
    for (const [id, n] of m) if (best === null || n > (m.get(best) ?? 0)) best = id;
    return best && (m.get(best) ?? 0) > 0 ? { id: best, n: m.get(best)! } : null;
  };

  // Caçador: mais acusações certas
  const cacador = new Map<string, number>();
  // Fantasma: menos acusações sofridas
  const sofridas = new Map<string, number>(players.map((p) => [p.id, 0]));
  for (const a of accusations ?? []) {
    if (a.correct) cacador.set(a.accuser_id, (cacador.get(a.accuser_id) ?? 0) + 1);
    sofridas.set(a.target_id, (sofridas.get(a.target_id) ?? 0) + 1);
  }
  let fantasma: { id: string; n: number } | null = null;
  for (const [id, n] of sofridas) {
    if (fantasma === null || n < fantasma.n) fantasma = { id, n };
  }

  // Advogado do Diabo: mais votos ❌ em claims que acabaram chumbados
  const advogado = new Map<string, number>();
  for (const c of chumbos ?? []) {
    const st = (c.assignment as unknown as { status: string })?.status;
    if (st === "chumbada") advogado.set(c.player_id, (advogado.get(c.player_id) ?? 0) + 1);
  }

  // Máquina de Momentos
  const maquina = new Map<string, number>();
  for (const m of moments ?? []) maquina.set(m.player_id, (maquina.get(m.player_id) ?? 0) + 1);

  // Mais Enganador do fim de semana: palpites errados nas respostas dele
  const autorDe = new Map((answers ?? []).map((a) => [a.id, a.player_id]));
  const enganador = new Map<string, number>();
  for (const g of guesses ?? []) {
    const autor = autorDe.get(g.answer_id);
    if (autor && g.guessed_player_id !== autor) {
      enganador.set(autor, (enganador.get(autor) ?? 0) + 1);
    }
  }

  const medal = (
    titulo: string,
    icone: string,
    winner: { id: string; n: number } | null,
    detalhe: (n: number) => string
  ) =>
    winner
      ? { titulo, icone, nome: name(winner.id), emoji: emoji(winner.id), detalhe: detalhe(winner.n) }
      : null;

  const medals = [
    medal("Caçador de Espiões", "🎯", top(cacador), (n) => `${n} ${n === 1 ? "acusação certa" : "acusações certas"}`),
    fantasma
      ? { titulo: "Fantasma", icone: "👻", nome: name(fantasma.id), emoji: emoji(fantasma.id), detalhe: `só ${fantasma.n} ${fantasma.n === 1 ? "acusação sofrida" : "acusações sofridas"}` }
      : null,
    medal("Advogado do Diabo", "⚖️", top(advogado), (n) => `${n} ${n === 1 ? "chumbo certeiro" : "chumbos certeiros"}`),
    medal("Mais Enganador", "🎭", top(enganador), (n) => `enganou ${n} ${n === 1 ? "palpite" : "palpites"} no Quizz`),
    medal("Máquina de Momentos", "🎥", top(maquina), (n) => `${n} momentos guardados`),
  ].filter(Boolean);

  return NextResponse.json({
    podium: individual.slice(0, 3).map((r) => ({
      name: r.player.name,
      emoji: r.player.emoji,
      points: r.points,
      rank: r.rank,
    })),
    medals,
  });
}
