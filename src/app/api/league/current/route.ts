import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getLeagueSnapshot } from "@/lib/server/learning";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json(await getLeagueSnapshot(user));
}
