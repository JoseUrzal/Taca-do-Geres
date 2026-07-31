"use client";

import { useState } from "react";
import useSWR from "swr";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { fetcher, post, POLL } from "@/lib/client";
import { Lightbulb } from "lucide-react";

type Ideia = {
  id: string;
  kind: "missao" | "evento" | "quizz" | "outro";
  text: string;
  done: boolean;
  player: { name: string; emoji: string };
};

const KINDS = [
  { key: "evento", label: "Evento" },
  { key: "missao", label: "Missão" },
  { key: "quizz", label: "Pergunta" },
  { key: "outro", label: "Outra" },
] as const;

const KIND_LABEL: Record<string, string> = {
  evento: "🏊 Evento",
  missao: "🕵️ Missão",
  quizz: "🎤 Pergunta",
  outro: "💡 Ideia",
};

export default function IdeiasPage() {
  const { data, mutate } = useSWR<{ ideas: Ideia[] }>("/api/ideias", fetcher, POLL);
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("evento");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function enviar() {
    if (!text.trim() || busy) return;
    setBusy(true);
    const res = await post("/api/ideias", { kind, text });
    setBusy(false);
    if (res.ok) {
      setText("");
      mutate();
    }
  }

  return (
    <Shell title="Ideias">
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="display flex items-center gap-2">
          <Lightbulb size={18} className="text-coral" /> Propõe algo ao campeonato
        </p>
        <p className="mt-1 text-sm text-muted">
          Um evento novo, uma missão, uma pergunta para o Quizz… O José aprova e
          entra no jogo.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {KINDS.map((k) => (
            <button
              key={k.key}
              onClick={() => setKind(k.key)}
              className={`display min-h-11 rounded-md px-3 text-sm ${
                kind === k.key ? "bg-indigo text-white" : "bg-page text-ink"
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          className="mt-3 w-full rounded-md border border-line bg-page p-3 text-ink"
          placeholder={
            kind === "evento"
              ? "Ex.: Torneio de matraquilhos depois do almoço"
              : kind === "missao"
                ? "Ex.: Consegue que alguém…"
                : kind === "quizz"
                  ? "Ex.: Qual dos presentes…?"
                  : "Diz lá…"
          }
        />
        <button
          onClick={enviar}
          disabled={busy || !text.trim()}
          className="display mt-2 min-h-14 w-full rounded-md bg-coral text-white disabled:opacity-40"
        >
          Enviar ideia
        </button>
      </div>

      <h2 className="display mb-2 mt-6 text-lg">Mural</h2>
      {data && data.ideas.length === 0 && (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          Ainda vazio. Sê a primeira pessoa com uma ideia.
        </p>
      )}
      <ul className="space-y-2">
        {data?.ideas.map((i) => (
          <li
            key={i.id}
            className={`rounded-xl bg-surface p-4 ${i.done ? "opacity-60" : ""}`}
          >
            <p className="text-xs text-muted">
              {KIND_LABEL[i.kind]}
              {i.done && " · ✓ aceite"}
            </p>
            <p className="mt-1 leading-snug">{i.text}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <Avatar name={i.player.name} emoji={i.player.emoji} size={18} />
              {i.player.name}
            </p>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
