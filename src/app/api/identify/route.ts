import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { PLAYER_COOKIE } from "@/lib/identity";

export async function POST(req: NextRequest) {
  const { player_id } = await req.json();
  const { data: player } = await db().from("players").select("id").eq("id", player_id).single();
  if (!player) return NextResponse.json({ error: "jogador_invalido" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PLAYER_COOKIE, player_id, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
