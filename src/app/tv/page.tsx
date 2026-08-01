"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import Scoreboard from "@/components/Scoreboard";
import Avatar from "@/components/Avatar";
import { fetcher, post, POLL } from "@/lib/client";
import type { ActivityItem, LeaderboardRow } from "@/lib/types";

type TvData = {
  day: number;
  top5: LeaderboardRow[];
  activity: ActivityItem[];
  stats: { icon: string; label: string; value: string }[];
  moments: { id: string; text: string; player: { name: string; emoji: string } }[];
  tribunal: {
    id: string;
    player: { name: string; emoji: string };
    mission: { text: string; points: number };
  }[];
  next_event: { name: string; when_hint: string | null } | null;
  round: TvRound;
  can_control: boolean;
};

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

const BASE_PANELS = ["top5", "atividade", "stats", "momentos"];

export default function TvPage() {
  const { data } = useSWR<TvData>("/api/tv", fetcher, POLL);
  const [panel, setPanel] = useState(0);

  const panels = [
    ...BASE_PANELS,
    ...(data?.next_event ? ["evento"] : []),
    ...(data?.tribunal && data.tribunal.length > 0 ? ["tribunal"] : []),
  ];
  const current = panels[panel % panels.length];

  // rotação de 12 em 12 segundos quando não há ronda ativa
  const takeover = !!data?.round;
  useEffect(() => {
    if (takeover) return;
    const n = panels.length;
    const t = setInterval(() => setPanel((p) => (p + 1) % n), 12000);
    return () => clearInterval(t);
  }, [takeover, panels.length]);

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
          <TvRoundView round={data.round} canControl={data.can_control} />
        ) : current === "top5" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-coral">Classificação</h2>
            <Scoreboard rows={data.top5} big />
          </section>
        ) : current === "atividade" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-coral">Últimas atividades</h2>
            <ul className="space-y-4">
              {data.activity.slice(0, 6).map((f) => (
                <li key={f.id} className="flex items-baseline gap-6 border-b border-line pb-4">
                  <span
                    className={`num w-24 shrink-0 text-right text-2xl md:text-4xl font-bold ${
                      f.kind === "pontos"
                        ? (f.points ?? 0) >= 0
                          ? "text-coral"
                          : "text-muted"
                        : ""
                    }`}
                  >
                    {f.kind === "pontos"
                      ? (f.points ?? 0) >= 0
                        ? `+${f.points}`
                        : f.points
                      : f.kind === "tribunal"
                        ? "🔥"
                        : "📣"}
                  </span>
                  <p className="text-xl md:text-3xl leading-snug">
                    {f.player && <span className="display font-bold">{f.player.name} </span>}
                    <span className="text-muted">{f.text}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : current === "stats" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-coral">
              📊 Números do fim de semana
            </h2>
            {data.stats.length === 0 ? (
              <p className="text-lg md:text-3xl text-muted">
                Ainda não há números. Vão jogar, vá.
              </p>
            ) : (
              <ul className="space-y-4">
                {data.stats.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center gap-5 rounded-xl bg-surface p-4 md:p-6"
                  >
                    <span className="text-3xl md:text-5xl">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="display text-sm md:text-xl font-bold tracking-widest text-muted">
                        {s.label.toUpperCase()}
                      </p>
                      <p className="display truncate text-2xl md:text-4xl font-bold">{s.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : current === "evento" && data.next_event ? (
          <section className="text-center">
            <p className="text-7xl md:text-9xl">📣</p>
            <p className="display mt-6 text-xl md:text-3xl font-bold tracking-widest text-coral">
              PRÓXIMO EVENTO
            </p>
            <h2 className="display mt-3 text-4xl md:text-8xl font-bold leading-tight">
              {data.next_event.name}
            </h2>
            {data.next_event.when_hint && (
              <p className="num mt-6 text-2xl md:text-5xl text-muted">{data.next_event.when_hint}</p>
            )}
            <p className="mt-8 text-lg md:text-3xl text-muted">
              Pódio 10 / 6 / 3 — tudo conta para a Taça.
            </p>
          </section>
        ) : current === "tribunal" ? (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-coral">
              ⚖️ Tribunal — vota no telemóvel!
            </h2>
            <ul className="space-y-4">
              {data.tribunal.map((c) => (
                <li key={c.id} className="flex items-center gap-4 rounded-xl bg-surface p-4 md:p-6">
                  <Avatar name={c.player.name} emoji={c.player.emoji} size={56} />
                  <p className="text-lg md:text-3xl leading-snug">
                    <span className="display font-bold">{c.player.name}</span>{" "}
                    <span className="text-muted">diz que cumpriu:</span> «{c.mission.text}»{" "}
                    <span className="num text-coral">+{c.mission.points}</span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-lg md:text-2xl text-muted">
              2 ✅ confirmam · 3 ❌ chumbam · os votos são públicos
            </p>
          </section>
        ) : (
          <section>
            <h2 className="display mb-6 text-2xl md:text-4xl font-bold text-coral">
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
          <span className="w-40" aria-hidden />
          <div className="flex gap-3">
            {panels.map((p, i) => (
              <span
                key={p}
                className={`h-2 w-10 rounded-full ${i === panel % panels.length ? "bg-coral" : "bg-surface-2"}`}
              />
            ))}
          </div>
          <span className="flex w-40 justify-end gap-4">
            <a href="/tv/abertura" className="display text-xl text-muted/70">
              ▶ Abertura
            </a>
            <a href="/tv/final" className="display text-xl text-muted/70">
              🏆 Final
            </a>
          </span>
        </footer>
      )}
    </div>
  );
}

function TvRoundView({
  round,
  canControl,
}: {
  round: NonNullable<TvRound>;
  canControl: boolean;
}) {
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
        <p className="display text-xl md:text-3xl font-bold tracking-widest text-coral">
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
        <p className="display text-center text-xl md:text-3xl font-bold tracking-widest text-coral">
          QUEM ESCREVEU O QUÊ? · MARQUEM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-2 max-w-4xl text-center text-xl md:text-3xl text-muted">
          {round.prompt}
        </p>
        <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 md:gap-5">
          {round.answers.map((a) => (
            <li key={a.id} className="flex items-start gap-4 rounded-lg bg-surface p-5">
              <span className="num text-2xl md:text-4xl font-bold text-coral">{a.n}</span>
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
      <p className="display text-xl md:text-3xl font-bold tracking-widest text-coral">A REVELAÇÃO</p>

      {!current ? (
        <p className="display mt-10 text-2xl md:text-5xl text-muted">
          {canControl ? "Toca em «Próxima» para começar…" : "A revelação vai começar…"}
        </p>
      ) : (
        <div className="mx-auto mt-8 max-w-5xl">
          <p className="display text-3xl md:text-6xl font-bold leading-tight">«{current.text}»</p>
          <p className="display mt-6 flex items-center justify-center gap-4 text-2xl md:text-5xl font-bold text-coral">
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

      {!finished &&
        (canControl ? (
          <button
            onClick={proxima}
            disabled={busy}
            className="display mt-12 min-h-14 md:min-h-20 rounded-xl bg-coral px-8 md:px-16 text-2xl md:text-4xl font-bold text-white disabled:opacity-50"
          >
            Próxima →
          </button>
        ) : (
          <p className="display mt-12 text-lg md:text-2xl text-muted">
            o José avança a revelação
          </p>
        ))}
    </section>
  );
}
