import { NextResponse } from "next/server";
import { getFeed, getLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ individual }, feed] = await Promise.all([getLeaderboard(), getFeed(20)]);
  return NextResponse.json({ individual, feed });
}
