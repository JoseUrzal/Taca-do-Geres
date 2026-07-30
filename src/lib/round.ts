import { db } from "./supabase";
import { getGameState, getPlayers, addScore } from "./queries";

type AnswerRow = { id: string; text: string; player_id: string };
type GuessRow = { guesser_id: string; answer_id: string; guessed_player_id: string };

// Payload da ronda ativa, consciente da fase. Durante 'a_adivinhar' o
// player_id das respostas é removido AQUI, no servidor — o cliente nunca o vê.
export async function serializeRound(viewerId: string | null) {
  const state = await getGameState();
  if (!state.active_round_id) return null;

  const { data: round } = await db()
    .from("rounds")
    .select("id, prompt, status, reveal_index")
    .eq("id", state.active_round_id)
    .single();
  if (!round) return null;

  const players = await getPlayers();
  const byId = new Map(players.map((p) => [p.id, p]));

  const { data: answersData } = await db()
    .from("answers")
    .select("id, text, player_id")
    .eq("round_id", round.id);
  const answers = ((answersData ?? []) as AnswerRow[]).sort((a, b) =>
    a.id.localeCompare(b.id)
  ); // ordem estável (uuid aleatório) = baralhada mas igual em todos os ecrãs

  const base = {
    id: round.id,
    prompt: round.prompt,
    status: round.status as "a_responder" | "a_adivinhar" | "revelado",
    reveal_index: round.reveal_index,
    total_players: players.length,
  };

  if (round.status === "a_responder") {
    const answered = answers.map((a) => {
      const p = byId.get(a.player_id);
      return { name: p?.name ?? "?", emoji: p?.emoji ?? "" };
    });
    const mine = viewerId ? answers.find((a) => a.player_id === viewerId) : null;
    return { ...base, answered, answered_count: answers.length, my_answer: mine?.text ?? null };
  }

  const { data: guessesData } = await db()
    .from("guesses")
    .select("guesser_id, answer_id, guessed_player_id")
    .eq("round_id", round.id);
  const guesses = (guessesData ?? []) as GuessRow[];

  if (round.status === "a_adivinhar") {
    // quem já entregou todos os palpites (todas as respostas menos a sua)
    const done = players.filter((p) => {
      const own = answers.find((a) => a.player_id === p.id);
      const needed = answers.length - (own ? 1 : 0);
      return needed > 0 && guesses.filter((g) => g.guesser_id === p.id).length >= needed;
    });
    const myAnswerId = viewerId
      ? answers.find((a) => a.player_id === viewerId)?.id ?? null
      : null;
    const myGuesses = viewerId
      ? Object.fromEntries(
          guesses.filter((g) => g.guesser_id === viewerId).map((g) => [g.answer_id, g.guessed_player_id])
        )
      : {};
    return {
      ...base,
      // SEM player_id — anonimato garantido no servidor
      answers: answers.map((a, i) => ({ id: a.id, text: a.text, n: i + 1 })),
      done: done.map((p) => ({ name: p.name, emoji: p.emoji })),
      done_count: done.length,
      my_answer_id: myAnswerId,
      my_guesses: myGuesses,
    };
  }

  // revelado — tudo em aberto
  const revealed = answers.map((a, i) => {
    const author = byId.get(a.player_id);
    const forThis = guesses.filter((g) => g.answer_id === a.id);
    return {
      id: a.id,
      n: i + 1,
      text: a.text,
      author: { id: a.player_id, name: author?.name ?? "?", emoji: author?.emoji ?? "" },
      guesses: forThis.map((g) => ({
        guesser: byId.get(g.guesser_id)?.name ?? "?",
        guessed: byId.get(g.guessed_player_id)?.name ?? "?",
        correct: g.guessed_player_id === a.player_id,
      })),
      fooled: forThis.filter((g) => g.guessed_player_id !== a.player_id).length,
    };
  });

  // mais enganador: autor com mais palpites errados na sua resposta
  let maisEnganador: { name: string; fooled: number } | null = null;
  for (const r of revealed) {
    if (!maisEnganador || r.fooled > maisEnganador.fooled) {
      maisEnganador = { name: r.author.name, fooled: r.fooled };
    }
  }

  return {
    ...base,
    answers: revealed,
    mais_enganador: maisEnganador && maisEnganador.fooled > 0 ? maisEnganador : null,
  };
}

// Pontua a ronda: +5 por palpite certo, +3 ao autor por cada enganado.
// Chamado UMA vez, na transição a_adivinhar → revelado (o UPDATE guardado
// por WHERE status='a_adivinhar' garante idempotência).
export async function scoreRound(roundId: string) {
  const players = await getPlayers();
  const byId = new Map(players.map((p) => [p.id, p]));

  const [{ data: answersData }, { data: guessesData }] = await Promise.all([
    db().from("answers").select("id, player_id").eq("round_id", roundId),
    db().from("guesses").select("guesser_id, answer_id, guessed_player_id").eq("round_id", roundId),
  ]);
  const answers = (answersData ?? []) as { id: string; player_id: string }[];
  const authorOf = new Map(answers.map((a) => [a.id, a.player_id]));

  const correct = new Map<string, number>(); // guesser → nº certos
  const fooled = new Map<string, number>(); // autor → nº enganados
  for (const g of (guessesData ?? []) as GuessRow[]) {
    const author = authorOf.get(g.answer_id);
    if (!author) continue;
    if (g.guessed_player_id === author) {
      correct.set(g.guesser_id, (correct.get(g.guesser_id) ?? 0) + 1);
    } else {
      fooled.set(author, (fooled.get(author) ?? 0) + 1);
    }
  }

  for (const [playerId, n] of correct) {
    await addScore(playerId, 5 * n, `Quem Disse Isto?: ${n} ${n === 1 ? "palpite certo" : "palpites certos"}`, "quem_disse");
  }
  for (const [playerId, n] of fooled) {
    const name = byId.get(playerId)?.name ?? "?";
    await addScore(playerId, 3 * n, `Quem Disse Isto?: ${name} enganou ${n} ${n === 1 ? "pessoa" : "pessoas"}`, "quem_disse");
  }
}
