"use client";

import Link from "next/link";
import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, POLL } from "@/lib/client";
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

export default function EventosPage() {
  const { data } = useSWR<{ events: Evento[] }>("/api/eventos", fetcher, POLL);
  const previstos = data?.events.filter((e) => e.status === "previsto") ?? [];
  const jogados = data?.events.filter((e) => e.status === "jogado") ?? [];

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
