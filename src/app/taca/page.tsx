"use client";

import { useState } from "react";
import useSWR from "swr";
import Shell from "@/components/Shell";
import FlipNumber from "@/components/FlipNumber";
import Avatar from "@/components/Avatar";
import { fetcher, POLL } from "@/lib/client";
import type { ActivityItem, LeaderboardRow } from "@/lib/types";

type Taca = {
  individual: LeaderboardRow[];
  activity: ActivityItem[];
};

const SOURCE_ICON: Record<string, string> = {
  missao: "🕵️",
  acusacao: "🎯",
  quem_disse: "🎤",
};

// a fonte «manual» cobre eventos, cumplicidade e pontos do admin —
// distingue-se pelo motivo
function iconFor(e: { source: string; reason: string }): string {
  if (e.reason.startsWith("Cumplicidade")) return "🤝";
  if (/\d\.º lugar/.test(e.reason)) return "🏅";
  return SOURCE_ICON[e.source] ?? "⭐";
}

export default function TacaPage() {
  const { data } = useSWR<Taca>("/api/taca", fetcher, POLL);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <Shell title="Taça">
      {!data ? (
        <div className="h-96 rounded-lg bg-surface" />
      ) : (
        <>
          <p className="mb-2 text-sm text-muted">Toca num nome para ver o extrato.</p>
          <ol className="divide-y divide-line rounded-lg bg-surface">
            {data.individual.map((r) => {
              const gold = r.rank === 1 && r.points > 0;
              const isOpen = open === r.player.id;
              return (
                <li key={r.player.id}>
                  <button
                    onClick={() => setOpen(isOpen ? null : r.player.id)}
                    className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left active:bg-surface-2"
                  >
                    <span
                      className={`num w-9 shrink-0 text-right text-lg ${
                        gold ? "font-bold text-gold" : "text-muted"
                      }`}
                    >
                      {r.rank}
                    </span>
                    <Avatar name={r.player.name} emoji={r.player.emoji} size={32} />
                    <span
                      className={`display min-w-0 flex-1 truncate text-xl font-bold ${
                        gold ? "text-gold" : ""
                      }`}
                    >
                      {r.player.name}
                    </span>
                    <FlipNumber
                      value={r.points}
                      className={`shrink-0 text-2xl font-bold ${gold ? "text-gold" : ""}`}
                    />
                    <span className={`text-muted transition-transform ${isOpen ? "rotate-90" : ""}`}>
                      ›
                    </span>
                  </button>
                  {isOpen && <Extrato playerId={r.player.id} />}
                </li>
              );
            })}
          </ol>

          {/* últimas atividades */}
          <section className="mt-6">
            <h2 className="display mb-2 text-lg">Últimas atividades</h2>
            <ul className="divide-y divide-line rounded-xl bg-surface">
              {data.activity.length === 0 && (
                <li className="p-4 text-muted">Ainda ninguém marcou. Toca a mexer.</li>
              )}
              {data.activity.map((f) => (
                <li key={f.id} className="flex items-start gap-3 p-3">
                  <span
                    className={`num shrink-0 font-bold ${
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
                  <p className="text-sm leading-snug">
                    {f.player && <span className="font-semibold">{f.player.name} </span>}
                    <span className="text-muted">{f.text}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </Shell>
  );
}

// Extrato de um jogador: cada linha de pontos, da mais recente para a mais
// antiga. Carrega quando a linha abre.
function Extrato({ playerId }: { playerId: string }) {
  const { data } = useSWR<{
    total: number;
    events: {
      id: string;
      points: number;
      reason: string;
      source: string;
      created_at: string;
      votes?: { name: string; vote: boolean }[];
    }[];
  }>(`/api/jogador/${playerId}`, fetcher);

  if (!data) {
    return <div className="mx-4 mb-3 h-16 rounded-md bg-page" />;
  }
  if (data.events.length === 0) {
    return (
      <p className="mx-4 mb-3 rounded-md bg-page p-3 text-sm text-muted">
        Ainda sem pontos. Tudo por fazer.
      </p>
    );
  }
  return (
    <ul className="mx-4 mb-3 divide-y divide-line rounded-md bg-page">
      {data.events.map((e) => (
        <li key={e.id} className="flex items-start gap-2.5 p-2.5">
          <span aria-hidden className="text-sm">
            {iconFor(e)}
          </span>
          <p className="min-w-0 flex-1 text-sm leading-snug text-ink/90">
            {e.reason}
            <span className="num ml-1.5 text-xs text-muted">
              {new Date(e.created_at).toLocaleString("pt-PT", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {e.votes && e.votes.length > 0 && (
              <span className="mt-0.5 block text-xs text-muted">
                {[
                  e.votes.some((v) => v.vote) &&
                    `✅ ${e.votes.filter((v) => v.vote).map((v) => v.name).join(", ")}`,
                  e.votes.some((v) => !v.vote) &&
                    `❌ ${e.votes.filter((v) => !v.vote).map((v) => v.name).join(", ")}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            )}
          </p>
          <span
            className={`num shrink-0 font-bold ${
              e.points > 0 ? "text-coral" : "text-muted"
            }`}
          >
            {e.points > 0 ? `+${e.points}` : e.points}
          </span>
        </li>
      ))}
    </ul>
  );
}
