import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const PLAYER_COOKIE = "tg_player";
export const ADMIN_COOKIE = "tg_admin";

export async function getPlayerId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(PLAYER_COOKIE)?.value ?? null;
}

export async function requirePlayer(): Promise<string | NextResponse> {
  const id = await getPlayerId();
  if (!id) {
    return NextResponse.json({ error: "sem_identidade" }, { status: 401 });
  }
  return id;
}

export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const pin = jar.get(ADMIN_COOKIE)?.value;
  return !!pin && pin === process.env.ADMIN_PIN;
}

export async function requireAdmin(): Promise<true | NextResponse> {
  if (await isAdmin()) return true;
  return NextResponse.json({ error: "pin_errado" }, { status: 403 });
}
