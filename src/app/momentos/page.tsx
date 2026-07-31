"use client";

import useSWR from "swr";
import Shell from "@/components/Shell";
import { fetcher, POLL } from "@/lib/client";
import Avatar from "@/components/Avatar";

type Momentos = {
  moments: {
    id: string;
    text: string;
    created_at: string;
    player: { name: string; emoji: string };
  }[];
};

export default function MomentosPage() {
  const { data } = useSWR<Momentos>("/api/momentos", fetcher, POLL);

  return (
    <Shell title="Momentos">
      <p className="mb-4 text-sm text-muted">
        A matéria-prima do vídeo de domingo à noite.
      </p>
      {data && data.moments.length === 0 && (
        <p className="rounded-lg bg-surface p-6 text-center text-muted">
          Ainda nada. Usa o «Guardar momento» na Casa.
        </p>
      )}
      <ul className="space-y-2">
        {data?.moments.map((m) => (
          <li key={m.id} className="rounded-lg bg-surface p-4">
            <p className="leading-snug">{m.text}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <Avatar name={m.player.name} emoji={m.player.emoji} size={18} />
              {m.player.name} ·{" "}
              <span className="num">
                {new Date(m.created_at).toLocaleString("pt-PT", {
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </p>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
