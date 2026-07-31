"use client";

import { useState } from "react";
import useSWR from "swr";
import Shell from "@/components/Shell";
import Scoreboard from "@/components/Scoreboard";
import FlipNumber from "@/components/FlipNumber";
import { fetcher, POLL } from "@/lib/client";
import type { FeedItem, LeaderboardRow, Team } from "@/lib/types";

type Taca = {
  individual: (LeaderboardRow & { team_colour: string | null })[];
  teams: { team: Team; points: number; rank: number }[];
  feed: FeedItem[];
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
              tab === t ? "bg-coral text-white" : "bg-surface text-muted"
            }`}
          >
            {t === "individual" ? "Individual" : "Equipas"}
          </button>
        ))}
      </div>

      {!data ? (
        <div className="h-96 rounded-lg bg-surface" />
      ) : tab === "individual" ? (
        <Scoreboard rows={data.individual} />
      ) : (
        <div className="space-y-3">
          {data.teams.map((t) => (
            <div
              key={t.team.id}
              className="flex items-center justify-between rounded-lg border-l-8 bg-surface p-5"
              style={{ borderLeftColor: t.team.colour_hex }}
            >
              <div>
                <p className="num text-sm text-muted">{t.rank}.º</p>
                <p className={`display text-2xl font-bold ${t.rank === 1 ? "text-gold" : ""}`}>
                  {t.team.name}
                </p>
              </div>
              <FlipNumber value={t.points} className="text-5xl font-bold" />
            </div>
          ))}
        </div>
      )}

      {/* últimas jogadas */}
      <section className="mt-6">
        <h2 className="display mb-2 text-lg">Últimas jogadas</h2>
        <ul className="divide-y divide-line rounded-xl bg-surface">
          {(!data || data.feed.length === 0) && (
            <li className="p-4 text-muted">Ainda ninguém marcou. Toca a mexer.</li>
          )}
          {data?.feed.map((f) => (
            <li key={f.id} className="flex items-start gap-3 p-3">
              <span
                className={`num shrink-0 font-bold ${
                  f.points >= 0 ? "text-coral" : "text-muted"
                }`}
              >
                {f.points >= 0 ? `+${f.points}` : f.points}
              </span>
              <p className="text-sm leading-snug">
                <span className="font-semibold">{f.player?.name}</span>{" "}
                <span className="text-muted">{f.reason}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>
    </Shell>
  );
}
