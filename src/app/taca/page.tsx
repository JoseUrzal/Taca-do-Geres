"use client";

import { useState } from "react";
import useSWR from "swr";
import Shell from "@/components/Shell";
import Scoreboard from "@/components/Scoreboard";
import FlipNumber from "@/components/FlipNumber";
import { fetcher, POLL } from "@/lib/client";
import type { LeaderboardRow, Team } from "@/lib/types";

type Taca = {
  individual: (LeaderboardRow & { team_colour: string | null })[];
  teams: { team: Team; points: number; rank: number }[];
};

export default function TacaPage() {
  const { data } = useSWR<Taca>("/api/taca", fetcher, POLL);
  const [tab, setTab] = useState<"individual" | "equipas">("individual");

  return (
    <Shell title="Taça">
      <div className="mb-4 grid grid-cols-2 gap-2">
        {(["individual", "equipas"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`display min-h-14 rounded-md text-lg font-bold ${
              tab === t ? "bg-rosa text-granito" : "bg-pinhal text-cal-fraca"
            }`}
          >
            {t === "individual" ? "Individual" : "Equipas"}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="h-96 rounded-lg bg-pinhal" />
      ) : tab === "individual" ? (
        <Scoreboard rows={data.individual} />
      ) : (
        <div className="space-y-3">
          {data.teams.map((t) => (
            <div
              key={t.team.id}
              className="flex items-center justify-between rounded-lg border-l-8 bg-pinhal p-5"
              style={{ borderLeftColor: t.team.colour_hex }}
            >
              <div>
                <p className="num text-sm text-cal-fraca">{t.rank}.º</p>
                <p className={`display text-2xl font-bold ${t.rank === 1 ? "text-ouro" : ""}`}>
                  {t.team.name}
                </p>
              </div>
              <FlipNumber value={t.points} className="text-5xl font-bold" />
            </div>
          ))}
        </div>
      )}
    </Shell>
  );
}
