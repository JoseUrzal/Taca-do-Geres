import { NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Catálogo público. Mostra o estado resolvido (confirmada/chumbada/apanhada)
// mas NUNCA revela quem tem missões ativas.
export async function GET() {
  const [{ data: missions }, { data: resolved }] = await Promise.all([
    db().from("missions").select("*").eq("active", true).order("points").order("text"),
    db()
      .from("assignments")
      .select("mission_id, status, player:player_id(name)")
      .in("status", ["confirmada", "chumbada", "apanhada"]),
  ]);

  const resolvedBy = new Map(
    (resolved ?? []).map((r) => [
      r.mission_id,
      { status: r.status, player: (r.player as unknown as { name: string })?.name },
    ])
  );

  return NextResponse.json({
    missions: (missions ?? []).map((m) => ({
      ...m,
      resolved: resolvedBy.get(m.id) ?? null,
    })),
  });
}
