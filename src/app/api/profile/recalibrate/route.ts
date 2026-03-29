import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getAssessmentQuestions } from "@/lib/server/learning";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  return NextResponse.json({
    mode: "recalibration",
    questions: await getAssessmentQuestions(),
  });
}
