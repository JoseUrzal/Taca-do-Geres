"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher, post, POLL } from "@/lib/client";
import Avatar from "@/components/Avatar";
import type { Player } from "@/lib/types";

type Admin = {
  admin: boolean;
  day: number;
  players: Player[];
  prompts: { id: string; text: string }[];
  events: { id: string; name: string; when_hint: string | null }[];
  event_votes: Record<string, number>;
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
  const [editing, setEditing] = useState<{ id: string; name: string; when: string } | null>(null);
  const [deleteArmed, setDeleteArmed] = useState<string | null>(null);
  const [closeArmed, setCloseArmed] = useState<string | null>(null);

  async function fecharVotacao(eventId: string) {
    if (busy) return;
    if (closeArmed !== eventId) {
      setCloseArmed(eventId);
      setTimeout(() => setCloseArmed(null), 3000);
      return;
    }
    setBusy(true);
    const res = await post("/api/admin/eventos/fechar-votacao", { event_id: eventId });
    setBusy(false);
    setCloseArmed(null);
    if (res.ok) {
      const body = (await res.json()) as { podium: { name: string; votes: number }[] };
      flash(
        `Pódio: ${body.podium.map((p, i) => `${["🥇", "🥈", "🥉"][i]} ${p.name} (${p.votes})`).join(" · ")}`
      );
      mutate();
    } else flash("Ainda não há votos.");
  }

  async function subir(eventId: string) {
    if (busy) return;
    setBusy(true);
    const res = await post("/api/admin/eventos/subir", { event_id: eventId });
    setBusy(false);
    if (res.ok) mutate();
  }

  async function guardarEdicao() {
    if (busy || !editing || !editing.name.trim()) return;
    setBusy(true);
    const res = await post("/api/admin/eventos/editar", {
      event_id: editing.id,
      name: editing.name,
      when_hint: editing.when,
    });
    setBusy(false);
    if (res.ok) {
      setEditing(null);
      flash("Evento atualizado.");
      mutate();
    }
  }

  async function apagar(eventId: string) {
    if (busy) return;
    if (deleteArmed !== eventId) {
      setDeleteArmed(eventId);
      setTimeout(() => setDeleteArmed(null), 3000);
      return;
    }
    setBusy(true);
    const res = await post("/api/admin/eventos/apagar", { event_id: eventId });
    setBusy(false);
    setDeleteArmed(null);
    if (res.ok) {
      flash("Evento apagado.");
      mutate();
    }
  }

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
          {data.events.map((e, idx) => (
            <li key={e.id} className="rounded-md border border-line p-3">
              {idx === 0 && (
                <p className="display mb-1 text-xs font-bold tracking-widest text-coral">
                  📣 PRÓXIMO — está na TV e na Casa de todos
                </p>
              )}
              {editing?.id === e.id ? (
                <div className="space-y-2">
                  <input
                    value={editing.name}
                    onChange={(ev) => setEditing({ ...editing, name: ev.target.value })}
                    className="min-h-12 w-full rounded-md border border-line bg-page px-3 text-ink"
                  />
                  <input
                    value={editing.when}
                    onChange={(ev) => setEditing({ ...editing, when: ev.target.value })}
                    placeholder="Quando? (ex.: hoje às 17h)"
                    className="min-h-12 w-full rounded-md border border-line bg-page px-3 text-ink"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={guardarEdicao}
                      disabled={busy || !editing.name.trim()}
                      className="display min-h-12 flex-1 rounded-md bg-coral font-bold text-white disabled:opacity-40"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="display min-h-12 rounded-md border border-line px-4 font-bold text-muted"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                  {(data.event_votes[e.id] ?? 0) > 0 && (
                    <button
                      onClick={() => fecharVotacao(e.id)}
                      disabled={busy}
                      className="display mt-2 min-h-12 w-full rounded-md bg-indigo font-bold text-white disabled:opacity-50"
                    >
                      {closeArmed === e.id
                        ? "De certeza? Fecha e dá os pontos"
                        : `🗳 Fechar votação (${data.event_votes[e.id]} ${
                            data.event_votes[e.id] === 1 ? "voto" : "votos"
                          }) → pódio`}
                    </button>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    {idx > 0 && (
                      <button
                        onClick={() => subir(e.id)}
                        disabled={busy}
                        className="display min-h-10 rounded-md border border-line px-3 text-sm font-bold text-muted disabled:opacity-50"
                      >
                        ⬆ Subir
                      </button>
                    )}
                    <button
                      onClick={() =>
                        setEditing({ id: e.id, name: e.name, when: e.when_hint ?? "" })
                      }
                      disabled={busy}
                      className="display min-h-10 rounded-md border border-line px-3 text-sm font-bold text-muted disabled:opacity-50"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => apagar(e.id)}
                      disabled={busy}
                      className={`display min-h-10 rounded-md px-3 text-sm font-bold disabled:opacity-50 ${
                        deleteArmed === e.id
                          ? "bg-coral text-white"
                          : "border border-line text-muted"
                      }`}
                    >
                      {deleteArmed === e.id ? "De certeza?" : "🗑 Apagar"}
                    </button>
                  </div>
                </>
              )}
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
