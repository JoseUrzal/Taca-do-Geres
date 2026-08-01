"use client";

import useSWR from "swr";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { fetcher, POLL } from "@/lib/client";

type Pair = {
  a: { name: string; emoji: string };
  b: { name: string; emoji: string };
  a_yes_b: number;
  b_yes_a: number;
  a_no_b: number;
  b_no_a: number;
  total: number;
  level: number;
};

const GRUPOS: { level: number; titulo: string; desc: string; borda: string }[] = [
  {
    level: 2,
    titulo: "🤔 Parceria?",
    desc: "2 ✅ à mesma pessoa num só dia — o limite diário",
    borda: "border-coral",
  },
  {
    level: 1,
    titulo: "🧐 Suspeito",
    desc: "1 ✅ num dia — a ver se repete…",
    borda: "border-line",
  },
  {
    level: 0,
    titulo: "😌 Tranqui",
    desc: "só ❌ trocados — aqui não há favores",
    borda: "border-line",
  },
];

// Raio-X público do Tribunal, organizado por nível de parceria.
export default function CumplicidadesPage() {
  const { data } = useSWR<{ pairs: Pair[] }>("/api/cumplicidades", fetcher, POLL);

  return (
    <Shell title="Cumplicidades">
      <p className="mb-4 rounded-lg bg-surface p-4 text-sm text-muted">
        🤝 Quem vota ✅ nas missões de quem — tudo público. Limite:{" "}
        <b>máximo 2 ✅ à mesma pessoa por dia</b>; a 3.ª não entra (cada um só
        tem 3 missões por dia — validar as 3 é demais).
      </p>

      {data && data.pairs.length === 0 && (
        <p className="rounded-lg bg-surface p-6 text-center text-muted">
          Ainda não há votos no Tribunal. Voltem cá quando houver casos.
        </p>
      )}

      {GRUPOS.map((g) => {
        const doGrupo = data?.pairs.filter((p) => p.level === g.level) ?? [];
        if (doGrupo.length === 0) return null;
        return (
          <section key={g.level} className="mb-5">
            <h2 className="display text-lg font-bold">{g.titulo}</h2>
            <p className="mb-2 text-xs text-muted">{g.desc}</p>
            <ul className="space-y-2">
              {doGrupo.map((p, i) => (
                <li
                  key={i}
                  className={`rounded-xl border-2 bg-surface p-4 ${g.borda}`}
                >
                  <p className="display flex items-center gap-2 font-bold">
                    <Avatar name={p.a.name} emoji={p.a.emoji} size={26} /> {p.a.name}
                    <span className="text-muted">⇄</span>
                    <Avatar name={p.b.name} emoji={p.b.emoji} size={26} /> {p.b.name}
                    {p.total > 0 && (
                      <span className="num ml-auto text-coral">{p.total} ✅</span>
                    )}
                  </p>
                  <p className="num mt-1.5 text-sm text-muted">
                    {p.a.name} → {p.b.name}: {p.a_yes_b} ✅
                    {p.a_no_b > 0 && ` ${p.a_no_b} ❌`} · {p.b.name} → {p.a.name}:{" "}
                    {p.b_yes_a} ✅{p.b_no_a > 0 && ` ${p.b_no_a} ❌`}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </Shell>
  );
}
