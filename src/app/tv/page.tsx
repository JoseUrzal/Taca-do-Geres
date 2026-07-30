"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Scoreboard from "@/components/Scoreboard";
import FlipNumber from "@/components/FlipNumber";
import { fetcher, post, POLL } from "@/lib/client";
import type { FeedItem, LeaderboardRow, Team } from "@/lib/types";

type TvData = {
  day: number;
  top5: LeaderboardRow[];
  teams: { team: Team; points: number; rank: number }[];
  feed: FeedItem[];
  camera: { name: string; emoji: string } | null;
  round: TvRound;
  draw: TvDraw;
};

type TvDraw = {
  reveal: number;
  total: number;
  players: { name: string; emoji: string; team_id: string }[];
  teams: { id: string; name: string; colour: string }[];
} | null;

type TvRound =
  | ({ id: string; prompt: string; total_players: number } & (
      | { status: "a_responder"; answered: { name: string; emoji: string }[]; answered_count: number }
      | {
          status: "a_adivinhar";
          answers: { id: string; text: string; n: number }[];
          done: { name: string; emoji: string }[];
          done_count: number;
        }
      | {
          status: "revelado";
          reveal_index: number;
          answers: {
            id: string;
            n: number;
            text: string;
            author: { name: string; emoji: string };
            guesses: { guesser: string; guessed: string; correct: boolean }[];
            fooled: number;
          }[];
          mais_enganador: { name: string; fooled: number } | null;
        }
    ))
  | null;

const PANELS = ["top5", "equipas", "feed", "camara"] as const;

export default function TvPage() {
  const { data } = useSWR<TvData>("/api/tv", fetcher, POLL);
  const [panel, setPanel] = useState(0);

  // rotação de 12 em 12 segundos quando não há ronda nem sorteio ativos
  const takeover = !!data?.round || !!data?.draw;
  useEffect(() => {
    if (takeover) return;
    const t = setInterval(() => setPanel((p) => (p + 1) % PANELS.length), 12000);
    return () => clearInterval(t);
  }, [takeover]);

  return (
    <div className="flex min-h-dvh flex-col bg-granito p-10 text-cal">
      <header className="flex items-baseline justify-between border-b-2 border-pinhal-claro pb-4">
        <h1 className="display text-6xl font-bold">
          Taça do <span className="text-rosa">Gerês</span>
        </h1>
        <div className="flex items-baseline gap-8">
          {data?.camera && (
            <p className="display text-2xl text-cal-fraca">
              🎥 Câmara: <span className="font-bold text-cal">{data.camera.name}</span>
            </p>
          )}
          <p className="num text-3xl text-cal-fraca">Dia {data?.day ?? "—"}</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center py-8">
        {!data ? null : data.round ? (
          <TvRoundView round={data.round} />
        ) : data.draw ? (
          <TvDrawView draw={data.draw} />
        ) : PANELS[panel] === "top5" ? (
          <section>
            <h2 className="display mb-6 text-4xl font-bold text-rosa">Classificação</h2>
            <Scoreboard rows={data.top5} big />
          </section>
        ) : PANELS[panel] === "equipas" ? (
          <section>
            <h2 className="display mb-6 text-4xl font-bold text-rosa">Equipas</h2>
            <div className="grid grid-cols-2 gap-8">
              {data.teams.map((t) => (
                <div
                  key={t.team.id}
                  className="rounded-xl border-t-8 bg-pinhal p-10 text-center"
                  style={{ borderTopColor: t.team.colour_hex }}
                >
                  <p className={`display text-5xl font-bold ${t.rank === 1 ? "text-ouro" : ""}`}>
                    {t.team.name}
                  </p>
                  <FlipNumber
                    value={t.points}
                    className={`mt-4 text-9xl font-bold ${t.rank === 1 ? "text-ouro" : ""}`}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : PANELS[panel] === "feed" ? (
          <section>
            <h2 className="display mb-6 text-4xl font-bold text-rosa">Últimas jogadas</h2>
            <ul className="space-y-4">
              {data.feed.slice(0, 6).map((f) => (
                <li key={f.id} className="flex items-baseline gap-6 border-b border-pinhal-claro pb-4">
                  <span
                    className={`num w-24 shrink-0 text-right text-4xl font-bold ${
                      f.points >= 0 ? "text-rosa" : "text-cal-fraca"
                    }`}
                  >
                    {f.points >= 0 ? `+${f.points}` : f.points}
                  </span>
                  <p className="text-3xl leading-snug">
                    <span className="display font-bold">{f.player?.name}</span>{" "}
                    <span className="text-cal-fraca">{f.reason}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="text-center">
            <p className="display text-4xl font-bold text-rosa">Câmara do dia</p>
            <p className="mt-8 text-9xl">{data.camera?.emoji ?? "🎥"}</p>
            <p className="display mt-6 text-8xl font-bold">{data.camera?.name ?? "—"}</p>
            <p className="mt-4 text-4xl text-cal-fraca">— filma tudo.</p>
          </section>
        )}
      </main>

      {!takeover && (
        <footer className="flex justify-center gap-3 pb-2">
          {PANELS.map((p, i) => (
            <span
              key={p}
              className={`h-2 w-10 rounded-full ${i === panel ? "bg-rosa" : "bg-pinhal-claro"}`}
            />
          ))}
        </footer>
      )}
    </div>
  );
}

function TvDrawView({ draw }: { draw: NonNullable<TvDraw> }) {
  const [busy, setBusy] = useState(false);
  const revealed = draw.players.slice(0, draw.reveal);
  const latest = revealed[revealed.length - 1] ?? null;
  const finished = draw.reveal >= draw.total;
  const [teamA, teamB] = draw.teams;

  async function proxima() {
    if (busy) return;
    setBusy(true);
    await post("/api/sorteio/proxima");
    setBusy(false);
  }

  const column = (team: { id: string; name: string; colour: string }) => (
    <div
      className="flex-1 rounded-xl border-t-8 bg-pinhal p-6"
      style={{ borderTopColor: team.colour }}
    >
      <p className="display text-center text-4xl font-bold">{team.name}</p>
      <ul className="mt-5 space-y-3">
        {revealed
          .filter((p) => p.team_id === team.id)
          .map((p, i) => (
            <li key={i} className="display rounded-md bg-granito px-4 py-3 text-center text-3xl font-bold">
              {p.emoji} {p.name}
            </li>
          ))}
      </ul>
    </div>
  );

  return (
    <section>
      <p className="display text-center text-3xl font-bold tracking-widest text-rosa">
        🎲 SORTEIO DAS EQUIPAS
      </p>

      {latest && !finished && (
        <p className="display mt-4 text-center text-6xl font-bold">
          {latest.emoji} {latest.name}
          <span className="text-cal-fraca"> → </span>
          <span
            style={{
              color: draw.teams.find((t) => t.id === latest.team_id)?.colour,
            }}
          >
            {draw.teams.find((t) => t.id === latest.team_id)?.name}
          </span>
        </p>
      )}
      {finished && (
        <p className="display mt-4 text-center text-5xl font-bold text-ouro">
          Equipas fechadas. Que ganhe a melhor.
        </p>
      )}

      <div className="mx-auto mt-6 flex max-w-6xl gap-8">
        {teamA && column(teamA)}
        {teamB && column(teamB)}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={proxima}
          disabled={busy}
          className="display min-h-20 rounded-xl bg-rosa px-16 text-4xl font-bold text-granito disabled:opacity-50"
        >
          {finished ? "Fechar sorteio" : draw.reveal === 0 ? "Começar →" : "Próxima →"}
        </button>
        {!finished && (
          <p className="num mt-3 text-2xl text-cal-fraca">
            {draw.reveal}/{draw.total}
          </p>
        )}
      </div>
    </section>
  );
}

function TvRoundView({ round }: { round: NonNullable<TvRound> }) {
  const [busy, setBusy] = useState(false);

  async function proxima() {
    if (busy) return;
    setBusy(true);
    await post("/api/quem-disse/proxima");
    setBusy(false);
  }

  if (round.status === "a_responder") {
    return (
      <section className="text-center">
        <p className="display text-3xl font-bold tracking-widest text-rosa">
          QUEM DISSE ISTO? · RESPONDAM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-8 max-w-5xl text-7xl font-bold leading-tight">
          {round.prompt}
        </p>
        <p className="num mt-12 text-4xl text-cal-fraca">
          {round.answered_count}/{round.total_players} responderam
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {round.answered.map((p, i) => (
            <span key={i} className="display rounded-md bg-pinhal px-5 py-2 text-3xl font-bold">
              {p.emoji} {p.name}
            </span>
          ))}
        </div>
      </section>
    );
  }

  if (round.status === "a_adivinhar") {
    return (
      <section>
        <p className="display text-center text-3xl font-bold tracking-widest text-rosa">
          QUEM ESCREVEU O QUÊ? · MARQUEM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-2 max-w-4xl text-center text-3xl text-cal-fraca">
          {round.prompt}
        </p>
        <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-5">
          {round.answers.map((a) => (
            <li key={a.id} className="flex items-start gap-4 rounded-lg bg-pinhal p-5">
              <span className="num text-4xl font-bold text-rosa">{a.n}</span>
              <p className="text-3xl leading-snug">«{a.text}»</p>
            </li>
          ))}
        </ul>
        <p className="num mt-8 text-center text-3xl text-cal-fraca">
          {round.done_count}/{round.total_players} já entregaram
        </p>
      </section>
    );
  }

  // revelado
  const current = round.answers[round.reveal_index - 1] ?? null;
  const finished = round.reveal_index >= round.answers.length;

  return (
    <section className="text-center">
      <p className="display text-3xl font-bold tracking-widest text-rosa">A REVELAÇÃO</p>

      {!current ? (
        <p className="display mt-10 text-5xl text-cal-fraca">Toca em «Próxima» para começar…</p>
      ) : (
        <div className="mx-auto mt-8 max-w-5xl">
          <p className="display text-6xl font-bold leading-tight">«{current.text}»</p>
          <p className="display mt-6 text-5xl font-bold text-rosa">
            — {current.author.emoji} {current.author.name}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {current.guesses.map((g, i) => (
              <span
                key={i}
                className={`num rounded-md px-4 py-2 text-2xl ${
                  g.correct ? "bg-rosa text-granito" : "bg-pinhal text-cal-fraca"
                }`}
              >
                {g.guesser} → {g.guessed} {g.correct ? "✓" : "✗"}
              </span>
            ))}
          </div>
          {current.fooled > 0 && (
            <p className="num mt-6 text-3xl text-cal-fraca">
              enganou {current.fooled} {current.fooled === 1 ? "pessoa" : "pessoas"} (+
              {current.fooled * 3})
            </p>
          )}
        </div>
      )}

      {finished && round.mais_enganador && (
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border-4 border-ouro p-8">
          <p className="display text-3xl font-bold tracking-widest text-ouro">
            🏆 MAIS ENGANADOR DA RONDA
          </p>
          <p className="display mt-3 text-7xl font-bold text-ouro">
            {round.mais_enganador.name}
          </p>
        </div>
      )}

      {!finished && (
        <button
          onClick={proxima}
          disabled={busy}
          className="display mt-12 min-h-20 rounded-xl bg-rosa px-16 text-4xl font-bold text-granito disabled:opacity-50"
        >
          Próxima →
        </button>
      )}
    </section>
  );
}
