import { NextRequest, NextResponse } from "next/server";
import { practiceCompleteRequestSchema } from "@/lib/engine/evaluator";
import { getAuthenticatedUser } from "@/lib/session";
import { completePracticeSession } from "@/lib/server/learning";

export async function POST(request: NextRequest) {
  const json = await request.json();
  const parsed = practiceCompleteRequestSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review completion payload." },
      { status: 400 },
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await completePracticeSession({
    viewer: user,
    sessionId: parsed.data.sessionId,
    items: parsed.data.items,
  });

  return NextResponse.json(summary);
}
