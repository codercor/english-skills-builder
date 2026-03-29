import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getProfileSnapshot } from "@/lib/server/learning";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const snapshot = await getProfileSnapshot(user);
  if (!snapshot) {
    return NextResponse.json(
      { error: "Complete onboarding and placement first." },
      { status: 409 },
    );
  }

  return NextResponse.json(snapshot);
}
