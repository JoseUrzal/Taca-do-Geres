"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher, post } from "@/lib/client";
import Avatar from "@/components/Avatar";
import type { Player } from "@/lib/types";

// Primeira visita: escolher quem és. Fica num cookie e pronto — sem login.
export default function NamePicker() {
  const router = useRouter();
  const { data } = useSWR<{ players: Player[]; me: string | null }>(
    "/api/players",
    fetcher
  );
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (data?.me) router.replace("/casa");
  }, [data?.me, router]);

  if (data?.me) return null;

  async function pick(p: Player) {
    if (busy) return;
    setBusy(p.id);
    const res = await post("/api/identify", { player_id: p.id });
    if (res.ok) router.replace("/casa");
    else setBusy(null);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-8">
      <p className="display text-sm font-bold tracking-widest text-indigo">
        GERÊS · 31 JUL — 2 AGO
      </p>
      <h1 className="display mt-1 text-5xl font-bold leading-none">
        Taça do<br />Gerês
      </h1>
      <p className="mt-4 text-muted">Quem és tu? Toca no teu nome.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {!data &&
          Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-surface" />
          ))}
        {data?.players.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p)}
            disabled={!!busy}
            className="flex min-h-20 items-center gap-3 rounded-lg border-l-4 border-indigo bg-surface px-4 text-left active:bg-surface-2 disabled:opacity-50"
          >
            <Avatar name={p.name} emoji={p.emoji} size={48} />
            <span className="display text-xl font-bold">
              {busy === p.id ? "…" : p.name}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-muted">
        Escolhe uma vez. O telemóvel lembra-se de ti.
      </p>
    </div>
  );
}
