"use client";

import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, post, POLL } from "@/lib/client";
import { Check, X } from "lucide-react";

type Tribunal = {
  me: string;
  claims: {
    id: string;
    player: { id: string; name: string; emoji: string };
    mission: { text: string; points: number };
    yes: number;
    no: number;
    my_vote: boolean | null;
    is_mine: boolean;
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
      <p className="mb-4 text-sm text-cal-fraca">
        2 ✅ confirmam e dão os pontos. 2 ❌ chumbam e queimam a missão.
      </p>
      {data && data.claims.length === 0 && (
        <p className="rounded-lg bg-pinhal p-6 text-center text-cal-fraca">
          Nada em julgamento. Por agora.
        </p>
      )}
      <ul className="space-y-3">
        {data?.claims.map((c) => (
          <li key={c.id} className="rounded-lg bg-pinhal p-4">
            <p className="display text-lg font-bold">
              {c.player.emoji} {c.player.name}
            </p>
            <p className="mt-1 leading-snug">
              diz que cumpriu: <span className="font-semibold">«{c.mission.text}»</span>{" "}
              <span className="num text-rosa">+{c.mission.points}</span>
            </p>
            <div className="num mt-2 text-sm text-cal-fraca">
              ✅ {c.yes}/2 · ❌ {c.no}/2
            </div>
            {c.is_mine ? (
              <p className="display mt-3 flex min-h-14 items-center justify-center rounded-md border border-cal-fraca/30 font-bold text-cal-fraca">
                A tua reclamação — não votas
              </p>
            ) : c.my_vote !== null ? (
              <p className="display mt-3 flex min-h-14 items-center justify-center rounded-md border border-cal-fraca/30 font-bold text-cal-fraca">
                Votaste {c.my_vote ? "✅" : "❌"}
              </p>
            ) : (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => votar(c.id, true)}
                  className="display flex min-h-14 flex-1 items-center justify-center gap-2 rounded-md bg-rosa text-lg font-bold text-granito active:opacity-80"
                >
                  <Check size={22} strokeWidth={3} /> Confirmo
                </button>
                <button
                  onClick={() => votar(c.id, false)}
                  className="display flex min-h-14 flex-1 items-center justify-center gap-2 rounded-md border-2 border-cal-fraca/40 text-lg font-bold active:bg-pinhal-claro"
                >
                  <X size={22} strokeWidth={3} /> Chumbo
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Shell>
  );
}
