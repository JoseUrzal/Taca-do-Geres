import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

export const dynamic = "force-dynamic";

const KINDS = ["missao", "evento", "quizz", "outro"];

// Mural de ideias: qualquer jogador propõe missões, eventos, perguntas…
export async function GET() {
  const { data, error } = await db()
    .from("ideas")
    .select("id, kind, text, done, created_at, player:player_id(name, emoji)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ideas: data });
}

export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { kind, text } = await req.json();
  if (!KINDS.includes(kind) || !text?.trim()) {
    return NextResponse.json({ error: "dados_em_falta" }, { status: 400 });
  }
  const { error } = await db()
    .from("ideas")
    .insert({ player_id: playerId, kind, text: text.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
