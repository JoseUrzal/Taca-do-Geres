"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { fetcher, post, POLL } from "@/lib/client";
import { CalendarClock, Medal } from "lucide-react";

type Evento = {
  id: string;
  name: string;
  when_hint: string | null;
  status: "previsto" | "jogado";
  first: { name: string; emoji: string } | null;
  second: { name: string; emoji: string } | null;
  third: { name: string; emoji: string } | null;
};

type Voting = {
  event_id: string;
  name: string;
  voted: number;
  total: number;
  my_votes: { 1: string | null; 2: string | null; 3: string | null };
  players: { id: string; name: string; emoji: string }[];
  me: string | null;
};

type StyleDraw = { player: { id: string; name: string; emoji: string }; style: string };

export default function EventosPage() {
  const { data, mutate } = useSWR<{
    events: Evento[];
    voting: Voting | null;
    styles: StyleDraw[] | null;
  }>("/api/eventos", fetcher, POLL);
  const [busy, setBusy] = useState(false);
  // escolhas locais por slot; null = ainda por preencher nesta sessão
  const [picks, setPicks] = useState<{ 1: string | null; 2: string | null; 3: string | null } | null>(null);
  const [saved, setSaved] = useState(false);
  const previstos = data?.events.filter((e) => e.status === "previsto") ?? [];
  const jogados = data?.events.filter((e) => e.status === "jogado") ?? [];
  const voting = data?.voting ?? null;

  // arranca com o boletim já submetido (se houver)
  const current = picks ?? voting?.my_votes ?? { 1: null, 2: null, 3: null };
  const complete = current[1] && current[2] && current[3];

  function pick(slot: 1 | 2 | 3, id: string) {
    setSaved(false);
    setPicks({ ...current, [slot]: current[slot] === id ? null : id });
  }

  async function votar() {
    if (busy || !voting || !complete) return;
    setBusy(true);
    const res = await post("/api/eventos/votar", {
      first: current[1],
      second: current[2],
      third: current[3],
    });
    if (res.ok) setSaved(true);
    await mutate();
    setBusy(false);
  }

  return (
    <Shell title="Eventos">
      <p className="mb-4 text-sm text-muted">
        Os jogos físicos do fim de semana. Anunciados antes, pódio 10/6/3 depois.
      </p>

      <h2 className="display mb-2 flex items-center gap-2 text-lg">
        <CalendarClock size={18} className="text-coral" /> Anunciados
      </h2>
      {previstos.length === 0 && (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          Nada anunciado. Tens uma ideia?{" "}
          <Link href="/ideias" className="text-indigo underline">
            Propõe um evento
          </Link>
          .
        </p>
      )}
      <ul className="space-y-2">
        {previstos.map((e) => (
          <li key={e.id} className="rounded-xl border-l-4 border-indigo bg-surface p-4">
            <p className="display">{e.name}</p>
            {e.when_hint && <p className="text-sm text-muted">{e.when_hint}</p>}

            {/* dança: estilos sorteados pela app, iguais em todos os ecrãs */}
            {data?.styles && voting && voting.event_id === e.id && (
              <div className="mt-3 rounded-lg border-2 border-indigo p-3">
                <p className="display text-sm font-bold text-indigo">
                  🎭 Sorteio de estilos
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Cada um dança 30–45 segundos o estilo que a app lhe deu. Sem
                  trocas, sem choraminguices — comprometer-se vale mais que
                  dançar bem.
                </p>
                <ul className="mt-2 space-y-1">
                  {data.styles.map((s) => {
                    const mine = s.player.id === voting.me;
                    return (
                      <li
                        key={s.player.id}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                          mine ? "bg-indigo text-white" : ""
                        }`}
                      >
                        <Avatar name={s.player.name} emoji={s.player.emoji} size={22} />
                        <span className="display text-sm font-bold">
                          {s.player.name}
                          {mine ? " (tu!)" : ""}
                        </span>
                        <span className={`ml-auto text-sm ${mine ? "" : "text-muted"}`}>
                          {s.style}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* votação do evento ativo: top 3 por ordem, podes mudar até fechar */}
            {voting && voting.event_id === e.id && (
              <div className="mt-3 rounded-lg border-2 border-coral p-3">
                <p className="display text-sm font-bold text-coral">
                  🗳 Vota nos teus 3 melhores
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Por ordem: 🥇 vale 3, 🥈 vale 2, 🥉 vale 1. Não podes votar em
                  ti. Podes mudar até o José fechar a votação.
                </p>
                {([1, 2, 3] as const).map((slot) => (
                  <div key={slot} className="mt-2.5">
                    <p className="display text-xs font-bold">
                      {slot === 1 ? "🥇 O melhor" : slot === 2 ? "🥈 Segundo" : "🥉 Terceiro"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {voting.players
                        .filter((p) => p.id !== voting.me)
                        .map((p) => {
                          const takenElsewhere =
                            current[slot] !== p.id &&
                            (current[1] === p.id || current[2] === p.id || current[3] === p.id);
                          return (
                            <button
                              key={p.id}
                              onClick={() => pick(slot, p.id)}
                              disabled={busy || takenElsewhere}
                              className={`display flex min-h-11 items-center gap-1.5 rounded-md px-2.5 text-sm font-bold disabled:opacity-40 ${
                                current[slot] === p.id
                                  ? "bg-coral text-white"
                                  : "bg-page text-ink active:bg-surface-2"
                              }`}
                            >
                              <Avatar name={p.name} emoji={p.emoji} size={20} /> {p.name}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
                <button
                  onClick={votar}
                  disabled={busy || !complete}
                  className="display mt-3 min-h-14 w-full rounded-md bg-coral font-bold text-white disabled:opacity-40"
                >
                  {saved || (!picks && voting.my_votes[1])
                    ? "✓ Voto registado — tocar para atualizar"
                    : "Votar"}
                </button>
                <p className="num mt-2 text-xs text-muted">
                  {voting.voted}/{voting.total} já votaram
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>

      <h2 className="display mb-2 mt-6 flex items-center gap-2 text-lg">
        <Medal size={18} className="text-gold" /> Jogados
      </h2>
      {jogados.length === 0 && (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          Ainda nenhum. O primeiro pódio vai saber a pouco tempo depois.
        </p>
      )}
      <ul className="space-y-2">
        {jogados.map((e) => (
          <li key={e.id} className="rounded-xl bg-surface p-4">
            <p className="display">{e.name}</p>
            <div className="num mt-2 space-y-1 text-sm">
              {e.first && <p>🥇 {e.first.name} <span className="text-muted">+10</span></p>}
              {e.second && <p>🥈 {e.second.name} <span className="text-muted">+6</span></p>}
              {e.third && <p>🥉 {e.third.name} <span className="text-muted">+3</span></p>}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
