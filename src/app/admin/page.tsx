"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, post, POLL } from "@/lib/client";
import Avatar from "@/components/Avatar";
import type { Player, Team } from "@/lib/types";

type Admin = {
  admin: boolean;
  day: number;
  camera_player_id: string | null;
  draw_reveal: number;
  players: Player[];
  teams: Team[];
  prompts: { id: string; text: string }[];
  events: { id: string; name: string; when_hint: string | null }[];
  ideas: { id: string; kind: string; text: string; player: { name: string } }[];
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

  if (!data) return <div className="min-h-dvh bg-page" />;

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
          className="num mt-6 min-h-14 rounded-md border border-line bg-surface px-4 text-2xl text-ink"
        />
        <button
          onClick={login}
          className="display mt-3 min-h-14 rounded-md bg-coral text-lg font-bold text-white"
        >
          Entrar
        </button>
        {msg && <p className="mt-3 text-indigo">{msg}</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6 pb-16">
      <header className="flex items-baseline justify-between">
        <h1 className="display text-3xl font-bold">Admin</h1>
        <span className="num text-muted">Dia {data.day}</span>
      </header>

      {msg && (
        <p className="rounded-md border border-indigo bg-surface p-3 text-center font-semibold">
          {msg}
        </p>
      )}

      <Sorteio data={data} mutate={mutate} flash={flash} />
      <QuemDisseControlo data={data} mutate={mutate} flash={flash} />
      <Eventos data={data} mutate={mutate} flash={flash} />
      <Ideias data={data} mutate={mutate} flash={flash} />
      <PontosManuais players={data.players} flash={flash} />
      <Dia data={data} mutate={mutate} flash={flash} />
    </div>
  );
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-surface p-4">
      <h2 className="display mb-3 text-xl font-bold text-indigo">{title}</h2>
      {children}
    </section>
  );
}

function Sorteio({
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
  const [names, setNames] = useState<Record<string, string>>({});
  const drawn = data.players.length > 0 && data.players.every((p) => p.team_id);

  async function guardarNomes() {
    if (busy) return;
    const changed = data.teams
      .filter((t) => names[t.id] !== undefined && names[t.id].trim() && names[t.id] !== t.name)
      .map((t) => ({ id: t.id, name: names[t.id] }));
    if (changed.length === 0) return;
    setBusy(true);
    const res = await post("/api/admin/equipas", { teams: changed });
    setBusy(false);
    if (res.ok) {
      flash("Nomes das equipas guardados.");
      setNames({});
      mutate();
    }
  }

  async function sortear() {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/sorteio");
    setBusy(false);
    setConfirming(false);
    if (res.ok) {
      flash("Sorteado! A TV está em modo revelação — toca em «Começar» lá.");
      mutate();
    }
  }

  return (
    <Sec title="Sorteio de equipas">
      {/* nomes decididos ao vivo na abertura */}
      <div className="mb-3 space-y-2">
        {data.teams.map((t) => (
          <div key={t.id} className="flex items-center gap-2">
            <span
              className="h-6 w-1.5 shrink-0 rounded"
              style={{ background: t.colour_hex }}
              aria-hidden
            />
            <input
              value={names[t.id] ?? t.name}
              onChange={(e) => setNames((n) => ({ ...n, [t.id]: e.target.value }))}
              className="min-h-12 flex-1 rounded-md border border-line bg-page px-3 text-ink"
            />
          </div>
        ))}
        <button
          onClick={guardarNomes}
          disabled={busy}
          className="display min-h-11 w-full rounded-md border border-line text-sm font-bold text-muted disabled:opacity-50"
        >
          Guardar nomes das equipas
        </button>
      </div>
      {!drawn ? (
        <>
          <p className="text-sm text-muted">
            Divide os 10 em duas equipas ao calhas e põe a TV a revelar um a um.
            Faz isto com toda a gente em frente à televisão.
          </p>
          <button
            onClick={sortear}
            disabled={busy}
            className="display mt-3 min-h-14 w-full rounded-md bg-coral font-bold text-white disabled:opacity-50"
          >
            🎲 Sortear equipas (aparece na TV)
          </button>
        </>
      ) : (
        <>
          <div className="space-y-2">
            {data.teams.map((t) => (
              <p key={t.id} className="text-sm">
                <span className="font-semibold" style={{ color: t.colour_hex }}>
                  {t.name}:
                </span>{" "}
                {data.players
                  .filter((p) => p.team_id === t.id)
                  .map((p) => p.name)
                  .join(", ")}
              </p>
            ))}
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="display mt-3 min-h-12 w-full rounded-md border border-line font-bold text-muted"
            >
              Re-sortear…
            </button>
          ) : (
            <div className="mt-3 rounded-md border-2 border-indigo p-3">
              <p className="text-sm">
                Baralha as equipas outra vez e repete a revelação na TV. De certeza?
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={sortear}
                  disabled={busy}
                  className="display min-h-12 flex-1 rounded-md bg-coral font-bold text-white disabled:opacity-50"
                >
                  Sim, re-sortear
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="display min-h-12 rounded-md border border-line px-4 font-bold text-muted"
                >
                  Não
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Sec>
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
  const [cancelArmed, setCancelArmed] = useState(false);

  async function cancelar() {
    if (busy) return;
    if (!cancelArmed) {
      setCancelArmed(true);
      setTimeout(() => setCancelArmed(false), 3000);
      return;
    }
    setBusy(true);
    const res = await post("/api/admin/ronda/cancelar");
    setBusy(false);
    setCancelArmed(false);
    if (res.ok) {
      flash("Ronda cancelada — respostas apagadas, sem pontos.");
      mutate();
    }
  }

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
    <Sec title="Quizz (Quem Disse Isto?)">
      {data.round ? (
        <>
          <p className="text-sm text-muted">Ronda ativa:</p>
          <p className="mt-1 font-semibold">«{data.round.prompt}»</p>
          <p className="num mt-1 text-sm text-muted">
            Fase: {FASE_LABEL[data.round.status] ?? data.round.status}
          </p>
          <button
            onClick={avancar}
            disabled={busy}
            className="display mt-3 min-h-14 w-full rounded-md bg-coral font-bold text-white disabled:opacity-50"
          >
            {AVANCAR_LABEL[data.round.status] ?? "Avançar"}
          </button>
          <button
            onClick={cancelar}
            disabled={busy}
            className="display mt-2 min-h-12 w-full rounded-md border border-line font-bold text-muted disabled:opacity-50"
          >
            {cancelArmed ? "De certeza? Toca outra vez" : "Cancelar ronda (sem pontos)"}
          </button>
        </>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted">Escolhe uma pergunta:</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {data.prompts.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => criar({ prompt_id: p.id })}
                  disabled={busy}
                  className="min-h-11 w-full rounded-md bg-page p-2 text-left text-sm active:bg-surface-2"
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
              className="min-h-12 flex-1 rounded-md border border-line bg-page px-3 text-ink"
            />
            <button
              onClick={() => custom.trim() && criar({ prompt: custom })}
              disabled={busy || !custom.trim()}
              className="display min-h-12 rounded-md bg-coral px-4 font-bold text-white disabled:opacity-40"
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
            className={`display flex min-h-11 items-center gap-1.5 rounded-md px-3 text-sm font-bold ${
              selected.has(p.id) ? "bg-coral text-white" : "bg-page text-ink"
            }`}
          >
            <Avatar name={p.name} emoji={p.emoji} size={22} /> {p.name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[-5, 3, 5, 10, 15, 20].map((v) => (
          <button
            key={v}
            onClick={() => setPoints(v)}
            className={`num min-h-11 min-w-14 rounded-md px-2 font-bold ${
              points === v ? "bg-coral text-white" : "bg-page text-ink"
            }`}
          >
            {v > 0 ? `+${v}` : v}
          </button>
        ))}
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="num min-h-11 w-20 rounded-md border border-line bg-page px-2 text-ink"
        />
      </div>
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (ex.: Mölkky — vitória)"
        className="mt-3 min-h-12 w-full rounded-md border border-line bg-page px-3 text-ink"
      />
      <button
        onClick={dar}
        disabled={busy || selected.size === 0 || !reason.trim()}
        className="display mt-3 min-h-14 w-full rounded-md bg-coral font-bold text-white disabled:opacity-40"
      >
        Dar pontos
      </button>
    </Sec>
  );
}

// os clássicos do grupo — um toque preenche o nome; editável à vontade
const EVENTOS_SUGERIDOS = [
  "Campeonato de Saltos",
  "Olimpíadas Parvas",
  "Mölkky",
  "Prova cega de vinho verde",
  "Torneio de cartas",
  "Corrida de boias",
];

function Eventos({
  data,
  mutate,
  flash,
}: {
  data: Admin;
  mutate: () => void;
  flash: (m: string) => void;
}) {
  const [name, setName] = useState("");
  const [whenHint, setWhenHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [podium, setPodium] = useState<{ first?: string; second?: string; third?: string }>({});

  async function anunciar() {
    if (busy || !name.trim()) return;
    setBusy(true);
    const res = await post("/api/admin/eventos", { name, when_hint: whenHint });
    setBusy(false);
    if (res.ok) {
      flash(`«${name}» anunciado — já aparece na app de todos.`);
      setName("");
      setWhenHint("");
      mutate();
    }
  }

  async function registar(eventId: string) {
    if (busy || !podium.first) return;
    setBusy(true);
    const res = await post("/api/admin/eventos/jogar", { event_id: eventId, ...podium });
    setBusy(false);
    if (res.ok) {
      flash("Pódio registado — pontos na Taça.");
      setPlaying(null);
      setPodium({});
      mutate();
    }
  }

  const places = [
    { key: "first" as const, label: "1.º · 10 pts", colour: "text-gold" },
    { key: "second" as const, label: "2.º · 6 pts", colour: "" },
    { key: "third" as const, label: "3.º · 3 pts", colour: "" },
  ];

  return (
    <Sec title="Eventos (pódio 10/6/3)">
      <p className="mb-2 text-sm text-muted">
        1. Anuncia antes de jogar (fica visível a todos). 2. No fim, regista o pódio.
      </p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {EVENTOS_SUGERIDOS.map((ev) => (
          <button
            key={ev}
            onClick={() => setName(ev)}
            className={`display min-h-11 rounded-md px-3 text-sm font-bold ${
              name === ev ? "bg-coral text-white" : "bg-page text-ink"
            }`}
          >
            {ev}
          </button>
        ))}
      </div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="…ou escreve outro nome"
        className="min-h-12 w-full rounded-md border border-line bg-page px-3 text-ink"
      />
      <div className="mt-2 flex gap-2">
        <input
          value={whenHint}
          onChange={(e) => setWhenHint(e.target.value)}
          placeholder="Quando? (ex.: hoje às 17h)"
          className="min-h-12 flex-1 rounded-md border border-line bg-page px-3 text-ink"
        />
        <button
          onClick={anunciar}
          disabled={busy || !name.trim()}
          className="display min-h-12 rounded-md bg-indigo px-4 font-bold text-white disabled:opacity-40"
        >
          Anunciar
        </button>
      </div>

      {data.events.length > 0 && (
        <ul className="mt-4 space-y-2">
          {data.events.map((e) => (
            <li key={e.id} className="rounded-md border border-line p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="display">
                  {e.name}
                  {e.when_hint && (
                    <span className="ml-2 text-xs font-normal text-muted">{e.when_hint}</span>
                  )}
                </p>
                <button
                  onClick={() => {
                    setPlaying(playing === e.id ? null : e.id);
                    setPodium({});
                  }}
                  className="display min-h-11 shrink-0 rounded-md bg-coral px-3 text-sm font-bold text-white"
                >
                  {playing === e.id ? "Fechar" : "Registar pódio"}
                </button>
              </div>
              {playing === e.id && (
                <div className="mt-2">
                  {places.map(({ key, label, colour }) => (
                    <div key={key} className="mt-2">
                      <p className={`display text-sm font-bold ${colour}`}>{label}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {data.players.map((p) => {
                          const takenElsewhere = Object.entries(podium).some(
                            ([k, v]) => v === p.id && k !== key
                          );
                          return (
                            <button
                              key={p.id}
                              onClick={() =>
                                setPodium((pd) => ({
                                  ...pd,
                                  [key]: pd[key] === p.id ? undefined : p.id,
                                }))
                              }
                              disabled={takenElsewhere}
                              className={`display min-h-11 rounded-md px-2.5 text-sm font-bold ${
                                podium[key] === p.id
                                  ? "bg-coral text-white"
                                  : takenElsewhere
                                    ? "bg-page text-muted/50"
                                    : "bg-page text-ink"
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
                    onClick={() => registar(e.id)}
                    disabled={busy || !podium.first}
                    className="display mt-3 min-h-14 w-full rounded-md bg-coral font-bold text-white disabled:opacity-40"
                  >
                    Confirmar pódio
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Sec>
  );
}

const KIND_LABEL: Record<string, string> = {
  missao: "🕵️ Missão",
  evento: "🏊 Evento",
  quizz: "🎤 Pergunta",
  outro: "💡 Outra",
};

function Ideias({
  data,
  mutate,
  flash,
}: {
  data: Admin;
  mutate: () => void;
  flash: (m: string) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function aprovar(id: string) {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/ideias/aprovar", { idea_id: id });
    setBusy(false);
    if (res.ok) {
      flash("Ideia aceite e posta em jogo.");
      mutate();
    }
  }

  if (data.ideas.length === 0) return null;

  return (
    <Sec title={`Ideias do grupo (${data.ideas.length})`}>
      <ul className="space-y-2">
        {data.ideas.map((i) => (
          <li key={i.id} className="rounded-md border border-line p-3">
            <p className="text-xs text-muted">
              {KIND_LABEL[i.kind] ?? i.kind} · {i.player?.name}
            </p>
            <p className="mt-1 text-sm leading-snug">{i.text}</p>
            <button
              onClick={() => aprovar(i.id)}
              disabled={busy}
              className="display mt-2 min-h-11 w-full rounded-md bg-indigo text-sm font-bold text-white disabled:opacity-50"
            >
              {i.kind === "missao"
                ? "Aceitar → catálogo de missões"
                : i.kind === "evento"
                  ? "Aceitar → anunciar evento"
                  : i.kind === "quizz"
                    ? "Aceitar → perguntas do Quizz"
                    : "Marcar como vista"}
            </button>
          </li>
        ))}
      </ul>
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

  async function novoDia() {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/novo-dia");
    setBusy(false);
    setConfirming(false);
    if (res.ok) {
      const body = await res.json();
      flash(`Dia ${body.day}: ${body.dealt} missões novas distribuídas.`);
      mutate();
    }
  }

  return (
    <Sec title="Novo dia">
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="display min-h-14 w-full rounded-md border-2 border-indigo font-bold text-indigo"
        >
          Novo dia →
        </button>
      ) : (
        <div className="mt-3 rounded-md border-2 border-indigo p-3">
          <p className="text-sm">
            O que muda: as missões de hoje não cumpridas expiram, cada jogador
            recebe 3 novas, e as 2 acusações renovam-se. O que NÃO muda: pontos,
            Quizz e eventos. Fazer ao pequeno-almoço. De certeza?
          </p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={novoDia}
              disabled={busy}
              className="display min-h-12 flex-1 rounded-md bg-coral font-bold text-white disabled:opacity-50"
            >
              Sim, novo dia
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="display min-h-12 rounded-md border border-line px-4 font-bold text-muted"
            >
              Não
            </button>
          </div>
        </div>
      )}
    </Sec>
  );
}
