import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lista pública de eventos: anunciados (previsto) e jogados (com pódio).
export async function GET() {
  const { data, error } = await db()
    .from("events")
    .select(
      "id, name, when_hint, status, played_at, created_at, first:first_id(name, emoji), second:second_id(name, emoji), third:third_id(name, emoji)"
    )
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data });
}
