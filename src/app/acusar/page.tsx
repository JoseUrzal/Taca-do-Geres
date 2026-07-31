"use client";

import { useState } from "react";
import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, post, POLL } from "@/lib/client";
import Avatar from "@/components/Avatar";
import type { Player } from "@/lib/types";

type Catalogo = {
  missions: {
    id: string;
    text: string;
    resolved: { status: string } | null;
  }[];
};

// Acusar custa uma vida (só há 2 por dia) — daí o passo de confirmação pesado.
export default function AcusarPage() {
  const { data: casa, mutate: mutateCasa } = useSWR("/api/casa", fetcher, POLL);
  const { data: playersData } = useSWR<{ players: Player[]; me: string }>(
    "/api/players",
    fetcher
  );
  const { data: catalogo } = useSWR<Catalogo>("/api/missoes", fetcher, POLL);

  const [target, setTarget] = useState<Player | null>(null);
  const [missionId, setMissionId] = useState<string | null>(null);
  const [result, setResult] = useState<"certo" | "errado" | null>(null);
  const [busy, setBusy] = useState(false);

  const left = casa?.accusations_left ?? 0;
  const mission = catalogo?.missions.find((m) => m.id === missionId);

  async function confirmar() {
    if (!target || !missionId || busy) return;
    setBusy(true);
    const res = await post("/api/acusar", { target_id: target.id, mission_id: missionId });
    setBusy(false);
    if (res.ok) {
      const body = await res.json();
      setResult(body.correct ? "certo" : "errado");
      mutateCasa();
    } else {
      setTarget(null);
      setMissionId(null);
      mutateCasa();
    }
  }

  function reset() {
    setTarget(null);
    setMissionId(null);
    setResult(null);
  }

  if (result) {
    return (
      <Shell title="Acusar">
        <div className="rounded-lg bg-surface p-6 text-center">
          {result === "certo" ? (
            <>
              <p className="text-5xl">🎯</p>
              <p className="display mt-3 text-3xl font-bold text-indigo">Apanhado!</p>
              <p className="mt-2 text-muted">
                {target?.name} tinha mesmo essa missão. <span className="num text-indigo">+15</span>{" "}
                para ti, missão queimada para {target?.name}.
              </p>
            </>
          ) : (
            <>
              <p className="text-5xl">💨</p>
              <p className="display mt-3 text-3xl font-bold">Falhaste.</p>
              <p className="mt-2 text-muted">
                {target?.name} não tinha essa missão. <span className="num">−5</span> pontos.
              </p>
            </>
          )}
          <button
            onClick={reset}
            className="display mt-6 min-h-14 w-full rounded-md bg-coral font-bold text-white"
          >
            Voltar
          </button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="Acusar">
      <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-surface px-4 py-3">
        <span className="display font-bold">Acusações restantes hoje</span>
        <span className="num text-3xl font-bold text-indigo">{left}</span>
      </div>

      {left === 0 ? (
        <p className="rounded-lg bg-surface p-6 text-center text-muted">
          Gastaste as duas de hoje. Amanhã há mais.
        </p>
      ) : !target ? (
        <>
          <h2 className="display mb-2 text-lg font-bold">1. Quem?</h2>
          <div className="grid grid-cols-2 gap-2">
            {playersData?.players
              .filter((p) => p.id !== playersData.me)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setTarget(p)}
                  className="flex min-h-16 items-center gap-2 rounded-lg bg-surface px-3 text-left active:bg-surface-2"
                >
                  <Avatar name={p.name} emoji={p.emoji} size={40} />
                  <span className="display font-bold">{p.name}</span>
                </button>
              ))}
          </div>
        </>
      ) : !missionId ? (
        <>
          <h2 className="display mb-2 text-lg font-bold">
            2. {target.name} anda a tentar…
          </h2>
          <button onClick={() => setTarget(null)} className="mb-3 text-sm text-muted underline">
            ← trocar de alvo
          </button>
          <ul className="space-y-2">
            {catalogo?.missions
              .filter((m) => !m.resolved)
              .map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => setMissionId(m.id)}
                    className="min-h-14 w-full rounded-lg bg-surface p-3 text-left leading-snug active:bg-surface-2"
                  >
                    {m.text}
                  </button>
                </li>
              ))}
          </ul>
        </>
      ) : (
        <div className="rounded-lg border-2 border-indigo bg-surface p-4">
          <h2 className="display text-xl font-bold text-indigo">3. Tens a certeza?</h2>
          <p className="mt-3 leading-snug">
            Acusas <span className="display font-bold">{target.name}</span> de
            andar a tentar:
          </p>
          <p className="mt-2 rounded-md bg-page p-3 font-semibold">«{mission?.text}»</p>
          <p className="num mt-3 text-sm text-muted">
            Certo: +15 · Errado: −5 · Custa 1 das tuas {left}
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={confirmar}
              disabled={busy}
              className="display min-h-14 rounded-md bg-coral text-lg font-bold text-white active:opacity-80 disabled:opacity-50"
            >
              {busy ? "…" : "Acusar!"}
            </button>
            <button
              onClick={() => setMissionId(null)}
              className="display min-h-14 rounded-md border border-line font-bold text-muted"
            >
              Não, voltar
            </button>
          </div>
        </div>
      )}
    </Shell>
  );
}
