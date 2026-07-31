"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, post, POLL } from "@/lib/client";

type PlayerLite = { id: string; name: string; emoji: string };

type Round =
  | ({ id: string; prompt: string; total_players: number } & (
      | {
          status: "a_responder";
          answered: { name: string; emoji: string }[];
          answered_count: number;
          my_answer: string | null;
        }
      | {
          status: "a_adivinhar";
          answers: { id: string; text: string; n: number }[];
          done_count: number;
          my_answer_id: string | null;
          my_guesses: Record<string, string>;
        }
      | {
          status: "revelado";
          reveal_index: number;
          answers: {
            id: string;
            n: number;
            text: string;
            author: { name: string; emoji: string };
            fooled: number;
          }[];
          mais_enganador: { name: string; fooled: number } | null;
        }
    ))
  | null;

export default function QuemDissePage() {
  const { data, mutate } = useSWR<{ round: Round; me: string; players: PlayerLite[] }>(
    "/api/quem-disse",
    fetcher,
    POLL
  );

  return (
    <Shell title="Quem Disse Isto?">
      {!data ? (
        <div className="h-64 rounded-lg bg-surface" />
      ) : !data.round ? (
        <p className="rounded-lg bg-surface p-6 text-center text-muted">
          Sem ronda ativa. Olha para a TV — quando começar, aparece aqui.
        </p>
      ) : data.round.status === "a_responder" ? (
        <Responder round={data.round} onSent={() => mutate()} />
      ) : data.round.status === "a_adivinhar" ? (
        <Adivinhar
          round={data.round}
          me={data.me}
          players={data.players}
          onSent={() => mutate()}
        />
      ) : (
        <Revelado round={data.round} />
      )}
    </Shell>
  );
}

function Responder({
  round,
  onSent,
}: {
  round: Extract<NonNullable<Round>, { status: "a_responder" }>;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);
  const already = round.my_answer !== null;

  async function enviar() {
    if (!text.trim()) return;
    await post("/api/quem-disse/answer", { text });
    setSent(true);
    onSent();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-indigo bg-surface p-4">
        <p className="display text-sm font-bold tracking-widest text-indigo">A PERGUNTA</p>
        <p className="display mt-1 text-2xl font-bold leading-tight">{round.prompt}</p>
      </div>

      {already || sent ? (
        <div className="rounded-lg bg-surface p-4">
          <p className="display font-bold">Resposta entregue ✓</p>
          {round.my_answer && (
            <p className="mt-1 text-muted">«{round.my_answer}»</p>
          )}
          <p className="mt-2 text-sm text-muted">
            Podes reescrever abaixo enquanto os outros acabam.
          </p>
        </div>
      ) : null}

      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-line bg-surface p-4 text-lg text-ink"
          placeholder="A tua resposta…"
        />
        <button
          onClick={enviar}
          disabled={!text.trim()}
          className="display mt-2 min-h-14 w-full rounded-md bg-coral text-lg font-bold text-white disabled:opacity-40"
        >
          {already || sent ? "Substituir resposta" : "Enviar resposta"}
        </button>
      </div>

      <p className="num text-center text-muted">
        {round.answered_count}/{round.total_players} já responderam
      </p>
    </div>
  );
}

function Adivinhar({
  round,
  me,
  players,
  onSent,
}: {
  round: Extract<NonNullable<Round>, { status: "a_adivinhar" }>;
  me: string;
  players: PlayerLite[];
  onSent: () => void;
}) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  // pré-carrega palpites já entregues (recarregar a página não perde nada)
  useEffect(() => {
    if (Object.keys(round.my_guesses).length > 0 && Object.keys(picks).length === 0) {
      setPicks(round.my_guesses);
      setSent(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round.my_guesses]);

  const toGuess = round.answers.filter((a) => a.id !== round.my_answer_id);
  const used = new Set(Object.values(picks));
  const complete = toGuess.every((a) => picks[a.id]);

  function pick(answerId: string, playerId: string) {
    setPicks((p) => {
      const next = { ...p };
      // desmarca este nome de outra resposta (não podes repetir nomes)
      for (const [aid, pid] of Object.entries(next)) {
        if (pid === playerId && aid !== answerId) delete next[aid];
      }
      next[answerId] = playerId;
      return next;
    });
    setSent(false);
  }

  async function enviar() {
    if (!complete || busy) return;
    setBusy(true);
    const res = await post("/api/quem-disse/guesses", { guesses: picks });
    setBusy(false);
    if (res.ok) {
      setSent(true);
      onSent();
    }
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="rounded-lg bg-surface p-4">
        <p className="display text-sm font-bold tracking-widest text-indigo">
          QUEM DISSE O QUÊ?
        </p>
        <p className="mt-1 text-sm text-muted">
          Um nome para cada resposta. Não podes repetir nomes nem escolher-te a ti.
        </p>
      </div>

      {toGuess.map((a) => (
        <div key={a.id} className="rounded-lg bg-surface p-4">
          <p className="leading-snug">
            <span className="num font-bold text-indigo">{a.n}.</span> «{a.text}»
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {players
              .filter((p) => p.id !== me)
              .map((p) => {
                const chosen = picks[a.id] === p.id;
                const taken = used.has(p.id) && !chosen;
                return (
                  <button
                    key={p.id}
                    onClick={() => pick(a.id, p.id)}
                    disabled={taken}
                    className={`display min-h-11 rounded-md px-3 text-sm font-bold ${
                      chosen
                        ? "bg-coral text-white"
                        : taken
                          ? "bg-page text-muted/50"
                          : "bg-page text-ink active:bg-surface-2"
                    }`}
                  >
                    {p.emoji} {p.name}
                  </button>
                );
              })}
          </div>
        </div>
      ))}

      <div className="fixed inset-x-0 bottom-20 z-10 mx-auto max-w-lg px-4 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={enviar}
          disabled={!complete || busy}
          className="display min-h-14 w-full rounded-md bg-coral text-lg font-bold text-white shadow-lg disabled:opacity-40"
        >
          {sent
            ? "Palpites entregues ✓"
            : complete
              ? busy
                ? "…"
                : "Entregar palpites"
              : `Faltam ${toGuess.filter((a) => !picks[a.id]).length}`}
        </button>
      </div>

      <p className="num text-center text-sm text-muted">
        {round.done_count}/{round.total_players} já entregaram
      </p>
    </div>
  );
}

function Revelado({
  round,
}: {
  round: Extract<NonNullable<Round>, { status: "revelado" }>;
}) {
  const shown = round.answers.slice(0, round.reveal_index);
  return (
    <div className="space-y-3">
      <p className="rounded-lg bg-surface p-4 text-center text-muted">
        👀 Olha para a TV — revelação em curso.
      </p>
      {shown.map((a) => (
        <div key={a.id} className="rounded-lg bg-surface p-4">
          <p className="leading-snug">«{a.text}»</p>
          <p className="display mt-1 font-bold text-indigo">
            — {a.author.emoji} {a.author.name}
            {a.fooled > 0 && (
              <span className="num ml-2 text-sm text-muted">
                enganou {a.fooled}
              </span>
            )}
          </p>
        </div>
      ))}
      {round.reveal_index >= round.answers.length && round.mais_enganador && (
        <div className="rounded-lg border-2 border-gold bg-surface p-4 text-center">
          <p className="display text-sm font-bold tracking-widest text-gold">
            MAIS ENGANADOR DA RONDA
          </p>
          <p className="display mt-1 text-3xl font-bold text-gold">
            {round.mais_enganador.name}
          </p>
          <p className="num text-muted">{round.mais_enganador.fooled} enganados</p>
        </div>
      )}
    </div>
  );
}
