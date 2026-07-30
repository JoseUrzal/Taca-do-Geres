"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, post, POLL } from "@/lib/client";
import type { Player } from "@/lib/types";

type Admin = {
  admin: boolean;
  day: number;
  camera_player_id: string | null;
  players: Player[];
  prompts: { id: string; text: string }[];
  round: { id: string; prompt: string; status: string; reveal_index: number } | null;
};

const FASE_LABEL: Record<string, string> = {
  a_responder: "A responder",
  a_adivinhar: "A adivinhar",
  revelado: "Revelação",
};
const AVANCAR_LABEL: Record<string, string> = {
  a_responder: "Fechar respostas → adivinhar",
  a_adivinhar: "Fechar palpites → revelar (pontua!)",
  revelado: "Terminar ronda",
};

export default function AdminPage() {
  const { data, mutate } = useSWR<Admin>("/api/admin", fetcher, POLL);
  const [pin, setPin] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  function flash(m: string) {
    setMsg(m);
    setTimeout(() => setMsg(null), 2500);
  }

  async function login() {
    const res = await post("/api/admin/login", { pin });
    if (res.ok) mutate();
    else flash("PIN errado.");
  }

  if (!data) return <div className="min-h-dvh bg-granito" />;

  if (!data.admin) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6">
        <h1 className="display text-4xl font-bold">Admin</h1>
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="PIN"
          className="num mt-6 min-h-14 rounded-md border border-pinhal-claro bg-pinhal px-4 text-2xl text-cal"
        />
        <button
          onClick={login}
          className="display mt-3 min-h-14 rounded-md bg-rosa text-lg font-bold text-granito"
        >
          Entrar
        </button>
        {msg && <p className="mt-3 text-rosa">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-16">
      <header className="flex items-baseline justify-between">
        <h1 className="display text-3xl font-bold">Admin</h1>
        <span className="num text-cal-fraca">Dia {data.day}</span>
      </header>

      {msg && (
        <p className="rounded-md border border-rosa bg-pinhal p-3 text-center font-semibold">
          {msg}
        </p>
      )}

      <QuemDisseControlo data={data} mutate={mutate} flash={flash} />
      <PontosManuais players={data.players} flash={flash} />
      <Evento players={data.players} flash={flash} />
      <Dia data={data} mutate={mutate} flash={flash} />
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-pinhal p-4">
      <h2 className="display mb-3 text-xl font-bold text-rosa">{title}</h2>
      {children}
    </section>
  );
}

function QuemDisseControlo({
  data,
  mutate,
  flash,
}: {
  data: Admin;
  mutate: () => void;
  flash: (m: string) => void;
}) {
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  async function criar(body: { prompt?: string; prompt_id?: string }) {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/ronda", body);
    setBusy(false);
    if (res.ok) {
      setCustom("");
      mutate();
      flash("Ronda criada — está na TV.");
    } else flash("Não deu. Já há ronda ativa?");
  }

  async function avancar() {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/ronda/avancar");
    setBusy(false);
    if (res.ok) mutate();
  }

  return (
    <Sec title="Quem Disse Isto?">
      {data.round ? (
        <>
          <p className="text-sm text-cal-fraca">Ronda ativa:</p>
          <p className="mt-1 font-semibold">«{data.round.prompt}»</p>
          <p className="num mt-1 text-sm text-cal-fraca">
            Fase: {FASE_LABEL[data.round.status] ?? data.round.status}
          </p>
          <button
            onClick={avancar}
            disabled={busy}
            className="display mt-3 min-h-14 w-full rounded-md bg-rosa font-bold text-granito disabled:opacity-50"
          >
            {AVANCAR_LABEL[data.round.status] ?? "Avançar"}
          </button>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm text-cal-fraca">Escolhe uma pergunta:</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {data.prompts.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => criar({ prompt_id: p.id })}
                  disabled={busy}
                  className="min-h-11 w-full rounded-md bg-granito p-2 text-left text-sm active:bg-pinhal-claro"
                >
                  {p.text}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <input
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              placeholder="…ou escreve uma nova"
              className="min-h-12 flex-1 rounded-md border border-pinhal-claro bg-granito px-3 text-cal"
            />
            <button
              onClick={() => custom.trim() && criar({ prompt: custom })}
              disabled={busy || !custom.trim()}
              className="display min-h-12 rounded-md bg-rosa px-4 font-bold text-granito disabled:opacity-40"
            >
              Criar
            </button>
          </div>
        </>
      )}
    </Sec>
  );
}

function PontosManuais({ players, flash }: { players: Player[]; flash: (m: string) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [points, setPoints] = useState<number>(5);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function dar() {
    if (busy || selected.size === 0 || !reason.trim()) return;
    setBusy(true);
    const res = await post("/api/admin/pontos", {
      entries: [...selected].map((player_id) => ({ player_id, points })),
      reason,
    });
    setBusy(false);
    if (res.ok) {
      flash(`${points > 0 ? "+" : ""}${points} para ${selected.size} jogador(es).`);
      setSelected(new Set());
      setReason("");
    }
  }

  return (
    <Sec title="Pontos manuais">
      <div className="flex flex-wrap gap-1.5">
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => toggle(p.id)}
            className={`display min-h-11 rounded-md px-3 text-sm font-bold ${
              selected.has(p.id) ? "bg-rosa text-granito" : "bg-granito text-cal"
            }`}
          >
            {p.emoji} {p.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[-5, 3, 5, 10, 15, 20].map((v) => (
          <button
            key={v}
            onClick={() => setPoints(v)}
            className={`num min-h-11 min-w-14 rounded-md px-2 font-bold ${
              points === v ? "bg-rosa text-granito" : "bg-granito text-cal"
            }`}
          >
            {v > 0 ? `+${v}` : v}
          </button>
        ))}
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="num min-h-11 w-20 rounded-md border border-pinhal-claro bg-granito px-2 text-cal"
        />
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (ex.: Mölkky — vitória)"
        className="mt-3 min-h-12 w-full rounded-md border border-pinhal-claro bg-granito px-3 text-cal"
      />
      <button
        onClick={dar}
        disabled={busy || selected.size === 0 || !reason.trim()}
        className="display mt-3 min-h-14 w-full rounded-md bg-rosa font-bold text-granito disabled:opacity-40"
      >
        Dar pontos
      </button>
    </Sec>
  );
}

function Evento({ players, flash }: { players: Player[]; flash: (m: string) => void }) {
  const [name, setName] = useState("");
  const [podium, setPodium] = useState<{ first?: string; second?: string; third?: string }>({});
  const [busy, setBusy] = useState(false);

  const places = [
    { key: "first" as const, label: "1.º · 10 pts", colour: "text-ouro" },
    { key: "second" as const, label: "2.º · 6 pts", colour: "" },
    { key: "third" as const, label: "3.º · 3 pts", colour: "" },
  ];

  async function registar() {
    if (busy || !name.trim() || !podium.first) return;
    setBusy(true);
    const res = await post("/api/admin/evento", { name, ...podium });
    setBusy(false);
    if (res.ok) {
      flash(`Evento «${name}» registado.`);
      setName("");
      setPodium({});
    }
  }

  return (
    <Sec title="Evento (pódio 10/6/3)">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do evento (ex.: Campeonato de Saltos)"
        className="min-h-12 w-full rounded-md border border-pinhal-claro bg-granito px-3 text-cal"
      />
      {places.map(({ key, label, colour }) => (
        <div key={key} className="mt-3">
          <p className={`display text-sm font-bold ${colour}`}>{label}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {players.map((p) => {
              const takenElsewhere = Object.entries(podium).some(
                ([k, v]) => v === p.id && k !== key
              );
              return (
                <button
                  key={p.id}
                  onClick={() =>
                    setPodium((pd) => ({ ...pd, [key]: pd[key] === p.id ? undefined : p.id }))
                  }
                  disabled={takenElsewhere}
                  className={`display min-h-11 rounded-md px-2.5 text-sm font-bold ${
                    podium[key] === p.id
                      ? "bg-rosa text-granito"
                      : takenElsewhere
                        ? "bg-granito text-cal-fraca/40"
                        : "bg-granito text-cal"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <button
        onClick={registar}
        disabled={busy || !name.trim() || !podium.first}
        className="display mt-4 min-h-14 w-full rounded-md bg-rosa font-bold text-granito disabled:opacity-40"
      >
        Registar evento
      </button>
    </Sec>
  );
}

function Dia({
  data,
  mutate,
  flash,
}: {
  data: Admin;
  mutate: () => void;
  flash: (m: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const camera = data.players.find((p) => p.id === data.camera_player_id);

  async function novoDia() {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/novo-dia");
    setBusy(false);
    setConfirming(false);
    if (res.ok) {
      const body = await res.json();
      flash(`Dia ${body.day}: ${body.dealt} missões dadas. Câmara: ${body.camera}.`);
      mutate();
    }
  }

  async function reroll() {
    if (busy) return;
    setBusy(true);
    await post("/api/admin/camara");
    setBusy(false);
    mutate();
  }

  return (
    <Sec title="Dia & câmara">
      <p className="text-sm text-cal-fraca">
        Câmara do dia: <span className="font-semibold text-cal">{camera?.name ?? "—"}</span>
      </p>
      <button
        onClick={reroll}
        disabled={busy}
        className="display mt-2 min-h-12 w-full rounded-md border border-cal-fraca/30 font-bold disabled:opacity-50"
      >
        🎲 Re-sortear câmara
      </button>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="display mt-3 min-h-14 w-full rounded-md border-2 border-rosa font-bold text-rosa"
        >
          Novo dia →
        </button>
      ) : (
        <div className="mt-3 rounded-md border-2 border-rosa p-3">
          <p className="text-sm">
            Expira as missões ativas, dá 3 novas a cada um e re-sorteia a câmara. De certeza?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={novoDia}
              disabled={busy}
              className="display min-h-12 flex-1 rounded-md bg-rosa font-bold text-granito disabled:opacity-50"
            >
              Sim, novo dia
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="display min-h-12 rounded-md border border-cal-fraca/30 px-4 font-bold text-cal-fraca"
            >
              Não
            </button>
          </div>
        </div>
      )}
    </Sec>
  );
}
