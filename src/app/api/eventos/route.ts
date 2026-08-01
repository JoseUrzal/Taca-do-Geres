import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { getPlayerId } from "@/lib/identity";
import { getPlayers } from "@/lib/queries";

export const dynamic = "force-dynamic";

// Competição de dança: 10 estilos ridículos, sorteados pela app.
// O sorteio é determinístico (semeado pelo id do evento): igual em todos
// os telemóveis, sem tabela nova — ninguém pode re-sortear até lhe agradar.
const ESTILOS = [
  "Flamenco 💃",
  "Robot 🤖",
  "Anos 80 🕺",
  "Ballet 🩰",
  "Reggaeton 🔥",
  "Slow motion 🐌",
  "Kuduro ⚡",
  "Valsa 🎩",
  "Breakdance 🌀",
  "Dança do ventre 🐍",
];

function seededShuffle<T>(arr: T[], seedText: string): T[] {
  let seed = 0;
  for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const rand = () => {
    // mulberry32
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Lista pública de eventos + estado da votação do evento ativo (o primeiro
// anunciado): quem já votou (contagem), o meu voto, e os candidatos.
export async function GET() {
  const [{ data, error }, players, me] = await Promise.all([
    db()
      .from("events")
      .select(
        "id, name, when_hint, status, played_at, created_at, first:first_id(name, emoji), second:second_id(name, emoji), third:third_id(name, emoji)"
      )
      .order("created_at", { ascending: false }),
    getPlayers(),
    getPlayerId(),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // evento ativo = o previsto mais antigo (o primeiro da lista do admin)
  const previstos = (data ?? []).filter((e) => e.status === "previsto");
  const ativo = previstos.length > 0 ? previstos[previstos.length - 1] : null;

  let voting = null;
  if (ativo) {
    const { data: votes } = await db()
      .from("event_votes")
      .select("voter_id, target_id, slot")
      .eq("event_id", ativo.id);
    const all = votes ?? [];
    const mine = me ? all.filter((v) => v.voter_id === me) : [];
    voting = {
      event_id: ativo.id,
      name: ativo.name,
      voted: new Set(all.map((v) => v.voter_id)).size,
      total: players.length,
      my_votes: {
        1: mine.find((v) => v.slot === 1)?.target_id ?? null,
        2: mine.find((v) => v.slot === 2)?.target_id ?? null,
        3: mine.find((v) => v.slot === 3)?.target_id ?? null,
      },
      players: players.map((p) => ({ id: p.id, name: p.name, emoji: p.emoji })),
      me,
    };
  }

  // evento de dança ativo → sorteio de estilos na app
  let styles = null;
  if (ativo && ativo.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes("danc")) {
    const baralhados = seededShuffle(ESTILOS, ativo.id);
    const ordenados = [...players].sort((a, b) => a.id.localeCompare(b.id));
    styles = ordenados.map((p, i) => ({
      player: { id: p.id, name: p.name, emoji: p.emoji },
      style: baralhados[i % baralhados.length],
    }));
  }

  return NextResponse.json({ events: data, voting, styles });
}
