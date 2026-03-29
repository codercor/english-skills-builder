import { NextRequest, NextResponse } from "next/server";
import { evaluatePracticeItem, practiceEvaluationRequestSchema } from "@/lib/engine/evaluator";
import { getAuthenticatedUser } from "@/lib/session";
import { getOrCreatePracticeSession, storePracticeFeedback } from "@/lib/server/learning";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = practiceEvaluationRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid practice evaluation payload." },
      { status: 400 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const viewer = user;
  const session = await getOrCreatePracticeSession(viewer, parsed.data.sessionId);

  if (!session) {
    return NextResponse.json({ error: "Practice session not found." }, { status: 404 });
  }

  const item = session.items.find((entry) => entry.id === parsed.data.itemId);

  if (!item) {
    return NextResponse.json({ error: "Practice item not found." }, { status: 404 });
  }

  const feedback = await evaluatePracticeItem(
    item,
    parsed.data.response,
    parsed.data.attemptNumber,
  );
  await storePracticeFeedback({
    viewer,
    sessionId: session.id,
    itemId: item.id,
    attemptNumber: parsed.data.attemptNumber,
    response: parsed.data.response,
    responseLatencyMs: parsed.data.responseLatencyMs,
    feedback,
  });

  return NextResponse.json(feedback);
}
