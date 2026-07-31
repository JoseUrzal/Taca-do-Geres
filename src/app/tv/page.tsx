"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Scoreboard from "@/components/Scoreboard";
import FlipNumber from "@/components/FlipNumber";
import Avatar from "@/components/Avatar";
import { fetcher, post, POLL } from "@/lib/client";
import type { FeedItem, LeaderboardRow, Team } from "@/lib/types";

type TvData = {
  day: number;
  top5: LeaderboardRow[];
  teams: { team: Team; points: number; rank: number }[];
  feed: FeedItem[];
  moments: { id: string; text: string; player: { name: string; emoji: string } }[];
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

const PANELS = ["top5", "equipas", "feed", "momentos"] as const;

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
    <div className="dark flex min-h-dvh flex-col bg-page p-4 md:p-10 text-ink">
      <header className="flex items-baseline justify-between border-b-2 border-line pb-4">
        <h1 className="display text-3xl md:text-6xl font-bold">
          Taça do <span className="text-indigo">Gerês</span>
        </h1>
        <p className="num text-xl md:text-3xl text-muted">Dia {data?.day ?? "—"}</p>
      </header>

      <main className="flex flex-1 flex-col justify-center py-8">
        {!data ? null : data.round ? (
          <TvRoundView round={data.round} />
        ) : data.draw ? (
          <TvDrawView draw={data.draw} />
        ) : PANELS[panel] === "top5" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-indigo">Classificação</h2>
            <Scoreboard rows={data.top5} big />
          </section>
        ) : PANELS[panel] === "equipas" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-indigo">Equipas</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-8">
              {data.teams.map((t) => (
                <div
                  key={t.team.id}
                  className="rounded-xl border-t-8 bg-surface p-5 md:p-10 text-center"
                  style={{ borderTopColor: t.team.colour_hex }}
                >
                  <p className={`display text-2xl md:text-5xl font-bold ${t.rank === 1 ? "text-gold" : ""}`}>
                    {t.team.name}
                  </p>
                  <FlipNumber
                    value={t.points}
                    className={`mt-4 text-5xl md:text-9xl font-bold ${t.rank === 1 ? "text-gold" : ""}`}
                  />
                </div>
              ))}
            </div>
          </section>
        ) : PANELS[panel] === "feed" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-indigo">Últimas jogadas</h2>
            <ul className="space-y-4">
              {data.feed.slice(0, 6).map((f) => (
                <li key={f.id} className="flex items-baseline gap-6 border-b border-line pb-4">
                  <span
                    className={`num w-24 shrink-0 text-right text-2xl md:text-4xl font-bold ${
                      f.points >= 0 ? "text-indigo" : "text-muted"
                    }`}
                  >
                    {f.points >= 0 ? `+${f.points}` : f.points}
                  </span>
                  <p className="text-xl md:text-3xl leading-snug">
                    <span className="display font-bold">{f.player?.name}</span>{" "}
                    <span className="text-muted">{f.reason}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-indigo">
              🎥 Momentos — quem vê, filma
            </h2>
            {data.moments.length === 0 ? (
              <p className="text-lg md:text-3xl text-muted">
                Ainda nada guardado. Viste algo digno do vídeo? Filma 10 segundos e
                toca em «Guardar momento» na app.
              </p>
            ) : (
              <ul className="space-y-4">
                {data.moments.map((m) => (
                  <li key={m.id} className="rounded-xl bg-surface p-4 md:p-6">
                    <p className="text-lg md:text-3xl leading-snug">«{m.text}»</p>
                    <p className="display mt-1 flex items-center gap-2 text-base md:text-xl text-muted">
                      <Avatar name={m.player?.name ?? ""} emoji={m.player?.emoji ?? ""} size={24} />
                      {m.player?.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {!takeover && (
        <footer className="flex items-center justify-between pb-2">
          <span className="w-28" aria-hidden />
          <div className="flex gap-3">
            {PANELS.map((p, i) => (
              <span
                key={p}
                className={`h-2 w-10 rounded-full ${i === panel ? "bg-coral" : "bg-surface-2"}`}
              />
            ))}
          </div>
          <a href="/tv/abertura" className="display w-28 text-right text-xl text-muted/70">
            ▶ Abertura
          </a>
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
      className="flex-1 rounded-xl border-t-8 bg-surface p-6"
      style={{ borderTopColor: team.colour }}
    >
      <p className="display text-center text-2xl md:text-4xl font-bold">{team.name}</p>
      <ul className="mt-5 space-y-3">
        {revealed
          .filter((p) => p.team_id === team.id)
          .map((p, i) => (
            <li
              key={i}
              className="display flex items-center justify-center gap-3 rounded-md bg-page px-4 py-3 text-center text-xl md:text-3xl font-bold"
            >
              <Avatar name={p.name} emoji={p.emoji} size={48} /> {p.name}
            </li>
          ))}
      </ul>
    </div>
  );

  return (
    <section>
      <p className="display text-center text-xl md:text-3xl font-bold tracking-widest text-indigo">
        🎲 SORTEIO DAS EQUIPAS
      </p>

      {latest && !finished && (
        <p className="display mt-4 flex items-center justify-center gap-4 text-center text-3xl md:text-6xl font-bold">
          <Avatar name={latest.name} emoji={latest.emoji} size={72} />
          {latest.name}
          <span className="text-muted"> → </span>
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
        <p className="display mt-4 text-center text-2xl md:text-5xl font-bold text-gold">
          Equipas fechadas. Que ganhe a melhor.
        </p>
      )}

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-3 md:flex-row md:gap-8">
        {teamA && column(teamA)}
        {teamB && column(teamB)}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={proxima}
          disabled={busy}
          className="display min-h-14 md:min-h-20 rounded-xl bg-coral px-8 md:px-16 text-2xl md:text-4xl font-bold text-white disabled:opacity-50"
        >
          {finished ? "Fechar sorteio" : draw.reveal === 0 ? "Começar →" : "Próxima →"}
        </button>
        {!finished && (
          <p className="num mt-3 text-lg md:text-2xl text-muted">
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
        <p className="display text-xl md:text-3xl font-bold tracking-widest text-indigo">
          QUEM DISSE ISTO? · RESPONDAM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-8 max-w-5xl text-4xl md:text-7xl font-bold leading-tight">
          {round.prompt}
        </p>
        <p className="num mt-12 text-2xl md:text-4xl text-muted">
          {round.answered_count}/{round.total_players} responderam
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {round.answered.map((p, i) => (
            <span
              key={i}
              className="display flex items-center gap-3 rounded-md bg-surface px-5 py-2 text-xl md:text-3xl font-bold"
            >
              <Avatar name={p.name} emoji={p.emoji} size={40} /> {p.name}
            </span>
          ))}
        </div>
      </section>
    );
  }

  if (round.status === "a_adivinhar") {
    return (
      <section>
        <p className="display text-center text-xl md:text-3xl font-bold tracking-widest text-indigo">
          QUEM ESCREVEU O QUÊ? · MARQUEM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-2 max-w-4xl text-center text-xl md:text-3xl text-muted">
          {round.prompt}
        </p>
        <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          {round.answers.map((a) => (
            <li key={a.id} className="flex items-start gap-4 rounded-lg bg-surface p-5">
              <span className="num text-2xl md:text-4xl font-bold text-indigo">{a.n}</span>
              <p className="text-xl md:text-3xl leading-snug">«{a.text}»</p>
            </li>
          ))}
        </ul>
        <p className="num mt-8 text-center text-xl md:text-3xl text-muted">
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
      <p className="display text-xl md:text-3xl font-bold tracking-widest text-indigo">A REVELAÇÃO</p>

      {!current ? (
        <p className="display mt-10 text-2xl md:text-5xl text-muted">Toca em «Próxima» para começar…</p>
      ) : (
        <div className="mx-auto mt-8 max-w-5xl">
          <p className="display text-3xl md:text-6xl font-bold leading-tight">«{current.text}»</p>
          <p className="display mt-6 flex items-center justify-center gap-4 text-2xl md:text-5xl font-bold text-indigo">
            <Avatar name={current.author.name} emoji={current.author.emoji} size={64} />
            {current.author.name}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {current.guesses.map((g, i) => (
              <span
                key={i}
                className={`num rounded-md px-4 py-2 text-lg md:text-2xl ${
                  g.correct ? "bg-coral text-white" : "bg-surface text-muted"
                }`}
              >
                {g.guesser} → {g.guessed} {g.correct ? "✓" : "✗"}
              </span>
            ))}
          </div>
          {current.fooled > 0 && (
            <p className="num mt-6 text-xl md:text-3xl text-muted">
              enganou {current.fooled} {current.fooled === 1 ? "pessoa" : "pessoas"} (+
              {current.fooled * 3})
            </p>
          )}
        </div>
      )}

      {finished && round.mais_enganador && (
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border-4 border-gold p-8">
          <p className="display text-xl md:text-3xl font-bold tracking-widest text-gold">
            🏆 MAIS ENGANADOR DA RONDA
          </p>
          <p className="display mt-3 text-4xl md:text-7xl font-bold text-gold">
            {round.mais_enganador.name}
          </p>
        </div>
      )}

      {!finished && (
        <button
          onClick={proxima}
          disabled={busy}
          className="display mt-12 min-h-14 md:min-h-20 rounded-xl bg-coral px-8 md:px-16 text-2xl md:text-4xl font-bold text-white disabled:opacity-50"
        >
          Próxima →
        </button>
      )}
    </section>
  );
}
