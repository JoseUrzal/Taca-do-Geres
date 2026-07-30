import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requirePlayer } from "@/lib/identity";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await db()
    .from("moments")
    .select("id, text, created_at, player:player_id(name, emoji)")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ moments: data });
}

export async function POST(req: NextRequest) {
  const playerId = await requirePlayer();
  if (playerId instanceof NextResponse) return playerId;

  const { text } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "vazio" }, { status: 400 });

  const { error } = await db().from("moments").insert({ player_id: playerId, text: text.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
