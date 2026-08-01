"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import FlipNumber from "@/components/FlipNumber";
import Avatar from "@/components/Avatar";
import { fetcher, post, POLL } from "@/lib/client";
import type { ActivityItem, LeaderboardRow } from "@/lib/types";

type TvData = {
  day: number;
  board: LeaderboardRow[];
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

const BASE_PANELS = ["marcador", "ultima-hora", "relatorio"];

// ecrã baixo = telemóvel deitado a fazer de TV
function useShortScreen() {
  const [short, setShort] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-height: 500px)");
    const update = () => setShort(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return short;
}

export default function TvPage() {
  const { data } = useSWR<TvData>("/api/tv", fetcher, POLL);
  const [panel, setPanel] = useState(0);
  const shortScreen = useShortScreen();

  // telemóvel-TV: nunca deixar o ecrã adormecer (Wake Lock, quando existir)
  useEffect(() => {
    type Sentinel = { release: () => Promise<void> };
    type WL = { request: (t: "screen") => Promise<Sentinel> };
    let lock: Sentinel | null = null;
    let gone = false;
    const acquire = async () => {
      try {
        const wl = (navigator as Navigator & { wakeLock?: WL }).wakeLock;
        if (wl && !gone) lock = await wl.request("screen");
      } catch {
        // sem suporte ou sem permissão — segue sem wake lock
      }
    };
    acquire();
    const onVis = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      gone = true;
      document.removeEventListener("visibilitychange", onVis);
      lock?.release().catch(() => {});
    };
  }, []);

  // ecrã inteiro + orientação horizontal (onde o browser deixar)
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const update = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  async function ecraInteiro() {
    try {
      await document.documentElement.requestFullscreen();
      const o = screen.orientation as ScreenOrientation & {
        lock?: (mode: string) => Promise<void>;
      };
      await o.lock?.("landscape");
    } catch {
      // iPhone/Safari não suporta — a página funciona na mesma
    }
  }

  const panels = [
    ...BASE_PANELS,
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
    <div className="dark flex h-dvh flex-col overflow-hidden bg-page p-4 tv:p-10 text-ink">
      <header className="flex shrink-0 items-baseline justify-between border-b-2 border-line pb-4 short:pb-2">
        <h1 className="display text-3xl short:text-2xl tv:text-6xl font-bold">
          Taça do <span className="text-indigo">Gerês</span>
        </h1>
        <p className="num text-xl short:text-base tv:text-3xl text-muted">Dia {data?.day ?? "—"}</p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden py-8 short:py-3">
        {!data ? null : data.round ? (
          <TvRoundView round={data.round} canControl={data.can_control} />
        ) : current === "marcador" ? (
          <section className="flex min-h-0 flex-col justify-center">
            <h2 className="display mb-6 short:mb-2 text-2xl short:text-lg tv:text-4xl font-bold text-coral">🏆 Classificação</h2>
            <ol className="grid grid-flow-col grid-rows-5 gap-x-10 short:gap-x-6 tv:gap-x-16 gap-y-2 short:gap-y-1">
              {data.board.map((r) => {
                const gold = r.rank === 1 && r.points > 0;
                return (
                  <li
                    key={r.player.id}
                    className="flex items-center gap-3 short:gap-2 border-b border-line pb-2 short:pb-1"
                  >
                    <span
                      className={`num w-8 shrink-0 text-right text-lg short:text-sm tv:text-3xl ${
                        gold ? "font-bold text-gold" : "text-muted"
                      }`}
                    >
                      {r.rank}
                    </span>
                    <Avatar name={r.player.name} emoji={r.player.emoji} size={shortScreen ? 26 : 40} />
                    <span
                      className={`display min-w-0 flex-1 truncate text-xl short:text-base tv:text-3xl font-bold ${
                        gold ? "text-gold" : ""
                      }`}
                    >
                      {r.player.name}
                    </span>
                    <FlipNumber
                      value={r.points}
                      className={`shrink-0 text-2xl short:text-lg tv:text-4xl font-bold ${
                        gold ? "text-gold" : ""
                      }`}
                    />
                  </li>
                );
              })}
            </ol>
            {data.next_event && (
              <p className="display mt-4 short:mt-2 rounded-md bg-surface p-3 short:p-2 text-center text-lg short:text-sm tv:text-2xl">
                📣 <span className="font-bold text-coral">Próximo evento:</span>{" "}
                {data.next_event.name}
                {data.next_event.when_hint && (
                  <span className="text-muted"> · {data.next_event.when_hint}</span>
                )}
              </p>
            )}
          </section>
        ) : current === "ultima-hora" ? (
          <section className="grid min-h-0 grid-cols-3 gap-8 short:gap-4">
            <div className="col-span-2 min-w-0">
              <h2 className="display mb-6 short:mb-2 text-2xl short:text-lg tv:text-4xl font-bold text-coral">📰 Última hora</h2>
              <ul className="space-y-4 short:space-y-2">
                {data.activity.slice(0, shortScreen ? 4 : 6).map((f) => (
                  <li key={f.id} className="flex items-baseline gap-6 short:gap-3 border-b border-line pb-4 short:pb-2">
                    <span
                      className={`num w-24 short:w-12 shrink-0 text-right text-2xl short:text-lg tv:text-4xl font-bold ${
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
                    <p className="text-xl short:text-base tv:text-3xl leading-snug">
                      {f.player && <span className="display font-bold">{f.player.name} </span>}
                      <span className="text-muted">{f.text}</span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-w-0">
              <h2 className="display mb-6 short:mb-2 text-2xl short:text-lg tv:text-4xl font-bold text-coral">🎥 Momentos</h2>
              {data.moments.length === 0 ? (
                <p className="text-base short:text-sm tv:text-2xl text-muted">
                  Viste algo épico? Filma e toca em «Guardar momento» na app.
                </p>
              ) : (
                <ul className="space-y-3 short:space-y-2">
                  {data.moments.slice(0, shortScreen ? 2 : 3).map((m) => (
                    <li key={m.id} className="rounded-xl bg-surface p-3 short:p-2 tv:p-5">
                      <p className="text-base short:text-sm tv:text-2xl leading-snug">«{m.text}»</p>
                      <p className="display mt-1 flex items-center gap-2 text-sm short:text-xs tv:text-lg text-muted">
                        <Avatar name={m.player?.name ?? ""} emoji={m.player?.emoji ?? ""} size={20} />
                        {m.player?.name}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : current === "relatorio" ? (
          <section>
            <h2 className="display mb-6 short:mb-2 text-2xl short:text-lg tv:text-4xl font-bold text-coral">
              📊 Relatório do dia
            </h2>
            {data.stats.length === 0 ? (
              <p className="text-lg tv:text-3xl text-muted">
                Ainda não há números. Vão jogar, vá.
              </p>
            ) : (
              <ul className="grid grid-cols-2 gap-4 short:gap-2">
                {data.stats.slice(0, shortScreen ? 6 : 8).map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center gap-4 short:gap-2.5 rounded-xl bg-surface p-4 short:p-2 tv:p-5"
                  >
                    <span className="text-3xl short:text-xl tv:text-5xl">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="display text-xs short:text-[10px] tv:text-lg font-bold tracking-widest text-muted">
                        {s.label.toUpperCase()}
                      </p>
                      <p className="display truncate text-xl short:text-sm tv:text-3xl font-bold">{s.value}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : (
          <section>
            <h2 className="display mb-6 short:mb-2 text-2xl short:text-lg tv:text-4xl font-bold text-coral">
              ⚖️ Tribunal — vota no telemóvel!
            </h2>
            <ul className="space-y-4 short:space-y-2">
              {data.tribunal.slice(0, shortScreen ? 3 : 4).map((c) => (
                <li key={c.id} className="flex items-center gap-4 rounded-xl bg-surface p-4 short:p-2.5 tv:p-6">
                  <Avatar name={c.player.name} emoji={c.player.emoji} size={shortScreen ? 36 : 56} />
                  <p className="text-lg short:text-base tv:text-3xl leading-snug">
                    <span className="display font-bold">{c.player.name}</span>{" "}
                    <span className="text-muted">diz que cumpriu:</span> «{c.mission.text}»{" "}
                    <span className="num text-coral">+{c.mission.points}</span>
                  </p>
                </li>
              ))}
            </ul>
            <p className="mt-6 short:mt-2 text-center text-lg short:text-sm tv:text-2xl text-muted">
              2 ✅ confirmam · 3 ❌ chumbam · os votos são públicos
            </p>
          </section>
        )}
      </main>

      {!takeover && (
        <footer className="flex shrink-0 items-center justify-between pb-2">
          <span className="flex w-40 justify-start">
            {!isFullscreen && (
              <button
                onClick={ecraInteiro}
                className="display text-xl short:text-base text-muted/70"
              >
                ⛶ Ecrã inteiro
              </button>
            )}
          </span>
          <div className="flex gap-3">
            {panels.map((p, i) => (
              <span
                key={p}
                className={`h-2 w-10 rounded-full ${i === panel % panels.length ? "bg-coral" : "bg-surface-2"}`}
              />
            ))}
          </div>
          <span className="flex w-40 justify-end gap-4">
            <a href="/tv/abertura" className="display text-xl short:text-base text-muted/70">
              ▶ Abertura
            </a>
            <a href="/tv/final" className="display text-xl short:text-base text-muted/70">
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
        <p className="display text-xl tv:text-3xl font-bold tracking-widest text-coral">
          QUEM DISSE ISTO? · RESPONDAM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-8 short:mt-3 max-w-5xl text-4xl short:text-3xl tv:text-7xl font-bold leading-tight">
          {round.prompt}
        </p>
        <p className="num mt-12 short:mt-4 text-2xl short:text-lg tv:text-4xl text-muted">
          {round.answered_count}/{round.total_players} responderam
        </p>
        <div className="mt-6 short:mt-3 flex flex-wrap justify-center gap-4">
          {round.answered.map((p, i) => (
            <span
              key={i}
              className="display flex items-center gap-3 rounded-md bg-surface px-5 py-2 text-xl short:text-base tv:text-3xl font-bold"
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
        <p className="display text-center text-xl tv:text-3xl font-bold tracking-widest text-coral">
          QUEM ESCREVEU O QUÊ? · MARQUEM NO TELEMÓVEL
        </p>
        <p className="display mx-auto mt-2 max-w-4xl text-center text-xl tv:text-3xl text-muted">
          {round.prompt}
        </p>
        <ul className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-3 md:grid-cols-2 tv:gap-5">
          {round.answers.map((a) => (
            <li key={a.id} className="flex items-start gap-4 rounded-lg bg-surface p-5 short:p-3">
              <span className="num text-2xl tv:text-4xl font-bold text-coral">{a.n}</span>
              <p className="text-xl short:text-base tv:text-3xl leading-snug">«{a.text}»</p>
            </li>
          ))}
        </ul>
        <p className="num mt-8 short:mt-3 text-center text-xl short:text-base tv:text-3xl text-muted">
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
      <p className="display text-xl tv:text-3xl font-bold tracking-widest text-coral">A REVELAÇÃO</p>

      {!current ? (
        <p className="display mt-10 text-2xl tv:text-5xl text-muted">
          {canControl ? "Toca em «Próxima» para começar…" : "A revelação vai começar…"}
        </p>
      ) : (
        <div className="mx-auto mt-8 max-w-5xl">
          <p className="display text-3xl short:text-2xl tv:text-6xl font-bold leading-tight">«{current.text}»</p>
          <p className="display mt-6 short:mt-3 flex items-center justify-center gap-4 text-2xl short:text-xl tv:text-5xl font-bold text-coral">
            <Avatar name={current.author.name} emoji={current.author.emoji} size={64} />
            {current.author.name}
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {current.guesses.map((g, i) => (
              <span
                key={i}
                className={`num rounded-md px-4 py-2 text-lg tv:text-2xl ${
                  g.correct ? "bg-coral text-white" : "bg-surface text-muted"
                }`}
              >
                {g.guesser} → {g.guessed} {g.correct ? "✓" : "✗"}
              </span>
            ))}
          </div>
          {current.fooled > 0 && (
            <p className="num mt-6 text-xl tv:text-3xl text-muted">
              enganou {current.fooled} {current.fooled === 1 ? "pessoa" : "pessoas"} (+
              {current.fooled * 3})
            </p>
          )}
        </div>
      )}

      {finished && round.mais_enganador && (
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border-4 border-gold p-8">
          <p className="display text-xl tv:text-3xl font-bold tracking-widest text-gold">
            🏆 MAIS ENGANADOR DA RONDA
          </p>
          <p className="display mt-3 text-4xl tv:text-7xl font-bold text-gold">
            {round.mais_enganador.name}
          </p>
        </div>
      )}

      {!finished &&
        (canControl ? (
          <button
            onClick={proxima}
            disabled={busy}
            className="display mt-12 short:mt-4 min-h-14 tv:min-h-20 rounded-xl bg-coral px-8 tv:px-16 text-2xl tv:text-4xl font-bold text-white disabled:opacity-50"
          >
            Próxima →
          </button>
        ) : (
          <p className="display mt-12 text-lg tv:text-2xl text-muted">
            o José avança a revelação
          </p>
        ))}
    </section>
  );
}
