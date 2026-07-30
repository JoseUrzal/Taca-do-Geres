import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/identity";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "pin_errado" }, { status: 403 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, pin, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return res;
}
