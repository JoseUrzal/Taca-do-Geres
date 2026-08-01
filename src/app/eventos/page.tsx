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
  my_vote: string | null;
  players: { id: string; name: string; emoji: string }[];
  me: string | null;
};

export default function EventosPage() {
  const { data, mutate } = useSWR<{ events: Evento[]; voting: Voting | null }>(
    "/api/eventos",
    fetcher,
    POLL
  );
  const [busy, setBusy] = useState(false);
  const previstos = data?.events.filter((e) => e.status === "previsto") ?? [];
  const jogados = data?.events.filter((e) => e.status === "jogado") ?? [];
  const voting = data?.voting ?? null;

  async function votar(targetId: string) {
    if (busy || !voting) return;
    setBusy(true);
    await post("/api/eventos/votar", { target_id: targetId });
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

            {/* votação do evento ativo: um voto por pessoa, podes mudar até fechar */}
            {voting && voting.event_id === e.id && (
              <div className="mt-3 rounded-lg border-2 border-coral p-3">
                <p className="display text-sm font-bold text-coral">
                  🗳 Vota no melhor
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Um voto por pessoa (não podes votar em ti). Podes mudar até o
                  José fechar a votação.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {voting.players
                    .filter((p) => p.id !== voting.me)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => votar(p.id)}
                        disabled={busy}
                        className={`display flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-bold disabled:opacity-50 ${
                          voting.my_vote === p.id
                            ? "bg-coral text-white"
                            : "bg-page text-ink active:bg-surface-2"
                        }`}
                      >
                        <Avatar name={p.name} emoji={p.emoji} size={22} /> {p.name}
                      </button>
                    ))}
                </div>
                <p className="num mt-2 text-xs text-muted">
                  {voting.my_vote ? "✓ Voto registado · " : ""}
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
