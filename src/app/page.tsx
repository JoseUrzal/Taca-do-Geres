"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher, post } from "@/lib/client";
import type { Player, Team } from "@/lib/types";

// Primeira visita: escolher quem és. Fica num cookie e pronto — sem login.
export default function NamePicker() {
  const router = useRouter();
  const { data } = useSWR<{ players: Player[]; teams: Team[]; me: string | null }>(
    "/api/players",
    fetcher
  );
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (data?.me) router.replace("/casa");
  }, [data?.me, router]);

  if (data?.me) return null;

  const teamColour = (p: Player) =>
    data?.teams.find((t) => t.id === p.team_id)?.colour_hex ?? "#2A3B34";

  async function pick(p: Player) {
    if (busy) return;
    setBusy(p.id);
    const res = await post("/api/identify", { player_id: p.id });
    if (res.ok) router.replace("/casa");
    else setBusy(null);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-8">
      <p className="display text-sm font-bold tracking-widest text-rosa">
        GERÊS · 31 JUL — 2 AGO
      </p>
      <h1 className="display mt-1 text-5xl font-bold leading-none">
        Taça do<br />Gerês
      </h1>
      <p className="mt-4 text-cal-fraca">Quem és tu? Toca no teu nome.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {!data &&
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-pinhal" />
          ))}
        {data?.players.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            disabled={!!busy}
            className="flex min-h-20 items-center gap-3 rounded-lg border-l-4 bg-pinhal px-4 text-left active:bg-pinhal-claro disabled:opacity-50"
            style={{ borderLeftColor: teamColour(p) }}
          >
            <span className="text-3xl">{p.emoji}</span>
            <span className="display text-xl font-bold">
              {busy === p.id ? "…" : p.name}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-cal-fraca">
        Escolhe uma vez. O telemóvel lembra-se de ti.
      </p>
    </div>
  );
}
