"use client";

import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, post, POLL } from "@/lib/client";
import Avatar from "@/components/Avatar";
import { Check, X } from "lucide-react";

type Tribunal = {
  me: string;
  claims: {
    id: string;
    player: { id: string; name: string; emoji: string };
    mission: { text: string; points: number };
    yes: number;
    no: number;
    yes_names: string[];
    no_names: string[];
    my_vote: boolean | null;
    is_mine: boolean;
    my_yes_to_owner: number;
  }[];
};

export default function TribunalPage() {
  const { data, mutate } = useSWR<Tribunal>("/api/tribunal", fetcher, POLL);

  async function votar(claimId: string, vote: boolean) {
    if (!data) return;
    // otimista
    mutate(
      {
        ...data,
        claims: data.claims.map((c) =>
          c.id === claimId
            ? { ...c, my_vote: vote, yes: c.yes + (vote ? 1 : 0), no: c.no + (vote ? 0 : 1) }
            : c
        ),
      },
      { revalidate: false }
    );
    await post("/api/tribunal/vote", { assignment_id: claimId, vote });
    mutate();
  }

  return (
    <Shell title="Tribunal">
      <p className="mb-4 text-sm text-muted">
        2 ✅ confirmam e dão os pontos. 3 ❌ chumbam e queimam a missão. Os
        votos são públicos — vota com honra.
      </p>
      {data && data.claims.length === 0 && (
        <p className="rounded-lg bg-surface p-6 text-center text-muted">
          Nada em julgamento. Por agora.
        </p>
      )}
      <ul className="space-y-3">
        {data?.claims.map((c) => (
          <li key={c.id} className="rounded-lg bg-surface p-4">
            <div className="flex items-center gap-2">
              <Avatar name={c.player.name} emoji={c.player.emoji} size={36} />
              <p className="display text-lg font-bold">{c.player.name}</p>
            </div>
            <p className="mt-1 leading-snug">
              diz que cumpriu: <span className="font-semibold">«{c.mission.text}»</span>{" "}
              <span className="num text-indigo">+{c.mission.points}</span>
            </p>
            <div className="num mt-2 text-sm text-muted">
              ✅ {c.yes}/2{c.yes_names.length > 0 && ` (${c.yes_names.join(", ")})`} · ❌{" "}
              {c.no}/3{c.no_names.length > 0 && ` (${c.no_names.join(", ")})`}
            </div>
            {c.is_mine ? (
              <p className="display mt-3 flex min-h-14 items-center justify-center rounded-md border border-line font-bold text-muted">
                A tua reclamação — não votas
              </p>
            ) : c.my_vote !== null ? (
              <p className="display mt-3 flex min-h-14 items-center justify-center rounded-md border border-line font-bold text-muted">
                Votaste {c.my_vote ? "✅" : "❌"}
              </p>
            ) : (
              <>
                {c.my_yes_to_owner >= 2 && (
                  <p className="mt-3 rounded-md border border-coral p-2 text-xs text-coral">
                    🤔 Já confirmaste 2 missões de {c.player.name} <b>hoje</b> —
                    a 3.ª só amanhã (são só 3 missões por dia…).
                  </p>
                )}
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => votar(c.id, true)}
                  disabled={c.my_yes_to_owner >= 2}
                  className="display flex min-h-14 flex-1 items-center justify-center gap-2 rounded-md bg-coral text-lg font-bold text-white active:opacity-80 disabled:opacity-40"
                >
                  <Check size={22} strokeWidth={3} /> Confirmo
                </button>
                <button
                  onClick={() => votar(c.id, false)}
                  className="display flex min-h-14 flex-1 items-center justify-center gap-2 rounded-md border-2 border-line text-lg font-bold active:bg-surface-2"
                >
                  <X size={22} strokeWidth={3} /> Chumbo
                </button>
              </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </Shell>
  );
}
