import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";
import { requireAdmin } from "@/lib/identity";

// Anunciar um evento (fica 'previsto', visível em /eventos, na Casa e na TV).
export async function POST(req: NextRequest) {
  const ok = await requireAdmin();
  if (ok !== true) return ok;

  const { name, when_hint } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "sem_nome" }, { status: 400 });

  const { error } = await db()
    .from("events")
    .insert({ name: name.trim(), when_hint: when_hint?.trim() || null });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
