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
  flag: boolean;
};

// Raio-X público do Tribunal: quem aprova as missões de quem.
export default function CumplicidadesPage() {
  const { data } = useSWR<{ pairs: Pair[] }>("/api/cumplicidades", fetcher, POLL);

  return (
    <Shell title="Cumplicidades">
      <p className="mb-4 rounded-lg bg-surface p-4 text-sm text-muted">
        🤝 Quem vota ✅ nas missões de quem — tudo público. Aprovação mútua
        repetida ganha o selo <b className="text-coral">parceria?</b>. Não é
        proibido… mas agora toda a gente vê.
      </p>

      {data && data.pairs.length === 0 && (
        <p className="rounded-lg bg-surface p-4 text-muted">
          Ainda não há votos no Tribunal. Voltem cá quando houver casos.
        </p>
      )}

      <ul className="space-y-2">
        {data?.pairs.map((p, i) => (
          <li
            key={i}
            className={`rounded-xl bg-surface p-4 ${
              p.flag ? "border-2 border-coral" : ""
            }`}
          >
            {p.flag && (
              <p className="display mb-1 text-xs font-bold tracking-widest text-coral">
                🔥 PARCERIA?
              </p>
            )}
            <p className="display flex items-center gap-2 font-bold">
              <Avatar name={p.a.name} emoji={p.a.emoji} size={26} /> {p.a.name}
              <span className="text-muted">⇄</span>
              <Avatar name={p.b.name} emoji={p.b.emoji} size={26} /> {p.b.name}
              <span className="num ml-auto text-coral">{p.total} ✅</span>
            </p>
            <p className="num mt-1.5 text-sm text-muted">
              {p.a.name} → {p.b.name}: {p.a_yes_b} ✅
              {p.a_no_b > 0 && ` ${p.a_no_b} ❌`} · {p.b.name} → {p.a.name}:{" "}
              {p.b_yes_a} ✅{p.b_no_a > 0 && ` ${p.b_no_a} ❌`}
            </p>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
