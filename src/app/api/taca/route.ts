import { NextResponse } from "next/server";
import { getActivity, getLeaderboard } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ individual }, activity] = await Promise.all([getLeaderboard(), getActivity(20)]);
  return NextResponse.json({ individual, activity });
}
