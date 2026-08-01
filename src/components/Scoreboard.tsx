"use client";

import FlipNumber from "./FlipNumber";
import Avatar from "./Avatar";
import type { LeaderboardRow } from "@/lib/types";

// O elemento-assinatura: marcador de estádio. Rank em mono, nome condensado
// em maiúsculas, pontos tabulares à direita, réguas finas entre linhas.
// Ouro só para o 1.º lugar — mais nada.
export default function Scoreboard({
  rows,
  big = false,
}: {
  rows: LeaderboardRow[];
  big?: boolean;
}) {
  return (
    <ol className="divide-y divide-line rounded-lg bg-surface">
      {rows.map((r) => {
        const gold = r.rank === 1 && r.points > 0;
        return (
          <li
            key={r.player.id}
            className={`flex items-center gap-3 ${big ? "px-6 py-4" : "px-4 py-3"}`}
          >
            <span
              className={`num w-9 shrink-0 text-right ${
                big ? "text-3xl" : "text-lg"
              } ${gold ? "font-bold text-gold" : "text-muted"}`}
            >
              {r.rank}
            </span>
            <Avatar name={r.player.name} emoji={r.player.emoji} size={big ? 56 : 32} />
            <span
              className={`display min-w-0 flex-1 truncate font-bold ${
                big ? "text-4xl" : "text-xl"
              } ${gold ? "text-gold" : ""}`}
            >
              {r.player.name}
            </span>
            <FlipNumber
              value={r.points}
              className={`shrink-0 font-bold ${big ? "text-5xl" : "text-2xl"} ${
                gold ? "text-gold" : ""
              }`}
            />
          </li>
        );
      })}
    </ol>
  );
}
