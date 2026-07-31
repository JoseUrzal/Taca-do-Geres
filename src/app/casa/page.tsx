"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import Shell from "@/components/Shell";
import FlipNumber from "@/components/FlipNumber";
import { fetcher, post, POLL } from "@/lib/client";
import { Camera, Video, Crosshair } from "lucide-react";

type Casa = {
  me: { name: string; emoji: string };
  points: number;
  rank: number;
  total_players: number;
  day: number;
  missions: {
    id: string;
    status: "ativa" | "reclamada";
    mission: { text: string; points: number; difficulty: number };
  }[];
  accusations_left: number;
  camera: { name: string; emoji: string } | null;
};

export default function CasaPage() {
  const { data, mutate } = useSWR<Casa>("/api/casa", fetcher, POLL);
  const [momento, setMomento] = useState("");
  const [momentoOpen, setMomentoOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  async function reclamar(assignmentId: string) {
    if (!data) return;
    // otimista: marca já como reclamada
    mutate(
      {
        ...data,
        missions: data.missions.map((m) =>
          m.id === assignmentId ? { ...m, status: "reclamada" as const } : m
        ),
      },
      { revalidate: false }
    );
    await post("/api/claims", { assignment_id: assignmentId });
    mutate();
  }

  async function guardarMomento() {
    if (!momento.trim()) return;
    await post("/api/momentos", { text: momento });
    setMomento("");
    setMomentoOpen(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Shell title="Taça do Gerês">
      {!data ? (
        <div className="space-y-3">
          <div className="h-28 rounded-lg bg-surface" />
          <div className="h-40 rounded-lg bg-surface" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* pontos + rank */}
          <section className="flex items-stretch gap-3">
            <div className="flex-1 rounded-lg bg-surface p-4">
              <p className="display text-xs font-bold tracking-widest text-muted">
                {data.me.emoji} {data.me.name} · Pontos
              </p>
              <FlipNumber value={data.points} className="text-5xl font-bold" />
            </div>
            <div className="rounded-lg bg-surface p-4 text-right">
              <p className="display text-xs font-bold tracking-widest text-muted">
                Lugar
              </p>
              <p
                className={`num text-5xl font-bold ${data.rank === 1 ? "text-gold" : ""}`}
              >
                {data.rank}
                <span className="text-lg text-muted">/{data.total_players}</span>
              </p>
            </div>
          </section>

          {/* câmara do dia */}
          {data.camera && (
            <section className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3">
              <Camera className="shrink-0 text-indigo" size={22} />
              <p>
                <span className="display font-bold">Câmara do dia: {data.camera.name}</span>
                <span className="text-muted"> — filma tudo.</span>
              </p>
            </section>
          )}

          {/* missões de hoje */}
          <section>
            <h2 className="display mb-2 text-lg font-bold">
              As tuas missões — dia {data.day}
            </h2>
            {data.missions.length === 0 && (
              <p className="rounded-lg bg-surface p-4 text-muted">
                Sem missões ativas. Espera pelo novo dia.
              </p>
            )}
            <ul className="space-y-2">
              {data.missions.map((a) => (
                <li key={a.id} className="rounded-lg bg-surface p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="leading-snug">{a.mission.text}</p>
                    <span className="num shrink-0 font-bold text-indigo">
                      +{a.mission.points}
                    </span>
                  </div>
                  {a.status === "ativa" ? (
                    <button
                      onClick={() => reclamar(a.id)}
                      className="display mt-3 min-h-14 w-full rounded-md bg-coral text-lg font-bold text-white active:opacity-80"
                    >
                      Reclamar
                    </button>
                  ) : (
                    <p className="display mt-3 flex min-h-14 items-center justify-center rounded-md border border-line text-lg font-bold text-muted">
                      No Tribunal…
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* acusações + momento */}
          <section className="grid grid-cols-2 gap-3">
            <Link
              href="/acusar"
              className="flex min-h-20 flex-col items-center justify-center rounded-lg bg-surface p-3 active:bg-surface-2"
            >
              <span className="flex items-center gap-2">
                <Crosshair size={18} className="text-indigo" />
                <span className="num text-3xl font-bold">{data.accusations_left}</span>
              </span>
              <span className="display text-sm font-bold text-muted">
                {data.accusations_left === 1 ? "Acusação restante" : "Acusações restantes"}
              </span>
            </Link>
            <button
              onClick={() => setMomentoOpen(true)}
              className="flex min-h-20 flex-col items-center justify-center rounded-lg bg-surface p-3 active:bg-surface-2"
            >
              <Video size={26} className="text-indigo" />
              <span className="display text-sm font-bold text-muted">
                {saved ? "Guardado ✓" : "Guardar momento"}
              </span>
            </button>
          </section>

          {momentoOpen && (
            <section className="rounded-lg border border-line bg-surface p-4">
              <label className="display mb-2 block text-sm font-bold" htmlFor="momento">
                O que aconteceu?
              </label>
              <textarea
                id="momento"
                value={momento}
                onChange={(e) => setMomento(e.target.value)}
                rows={2}
                className="w-full rounded-md border border-line bg-page p-3 text-ink"
                placeholder="O Gil caiu da boia outra vez…"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={guardarMomento}
                  className="display min-h-14 flex-1 rounded-md bg-coral font-bold text-white"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setMomentoOpen(false)}
                  className="display min-h-14 rounded-md border border-line px-4 font-bold text-muted"
                >
                  Fechar
                </button>
              </div>
              <Link href="/momentos" className="mt-2 block text-sm text-muted underline">
                Ver todos os momentos
              </Link>
            </section>
          )}

        </div>
      )}
    </Shell>
  );
}
