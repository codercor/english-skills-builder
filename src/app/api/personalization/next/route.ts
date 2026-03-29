import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getDashboardSnapshot } from "@/lib/server/learning";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const snapshot = await getDashboardSnapshot(user);
  if (!snapshot) {
    return NextResponse.json(
      { error: "Complete onboarding and placement first." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    selected: snapshot.bestNextPractice,
    ranked: snapshot.decisionLog.candidateActions,
    rationale: snapshot.decisionLog.llmRationale,
  });
}
