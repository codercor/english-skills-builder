import { NextRequest, NextResponse } from "next/server";
import { assessmentEvaluationRequestSchema } from "@/lib/engine/evaluator";
import { getAuthenticatedUser } from "@/lib/session";
import { evaluateAndPersistAssessment } from "@/lib/server/learning";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = assessmentEvaluationRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid assessment payload." },
      { status: 400 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await evaluateAndPersistAssessment(
    user,
    parsed.data.answers,
    parsed.data.mode ?? "placement",
  );

  return NextResponse.json(result);
}
