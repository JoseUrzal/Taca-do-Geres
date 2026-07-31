"use client";

import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, POLL } from "@/lib/client";

type Catalogo = {
  missions: {
    id: string;
    text: string;
    points: number;
    difficulty: 1 | 2 | 3;
    resolved: { status: string; player: string } | null;
  }[];
};

const STATUS_LABEL: Record<string, string> = {
  confirmada: "cumprida por",
  chumbada: "chumbada a",
  apanhada: "apanhada a",
};

export default function MissoesPage() {
  const { data } = useSWR<Catalogo>("/api/missoes", fetcher, POLL);

  return (
    <Shell title="Missões">
      <p className="mb-4 text-sm text-muted">
        O catálogo é público: sabes o que anda em jogo, não sabes quem tem o quê.
      </p>
      <ul className="space-y-2">
        {!data &&
          Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="h-16 rounded-lg bg-surface" />
          ))}
        {data?.missions.map((m) => (
          <li
            key={m.id}
            className={`rounded-lg bg-surface p-4 ${m.resolved ? "opacity-50" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="leading-snug">{m.text}</p>
              <span className="num shrink-0 font-bold text-indigo">+{m.points}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
              <span className="num">{"★".repeat(m.difficulty)}</span>
              {m.resolved && (
                <span>
                  · {STATUS_LABEL[m.resolved.status] ?? m.resolved.status}{" "}
                  <span className="font-semibold">{m.resolved.player}</span>
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
