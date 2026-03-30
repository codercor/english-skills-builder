import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/session";
import { getOrCreatePracticeSession } from "@/lib/server/learning";
import { buildTopicSessionHref } from "@/lib/server/topic-views";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => ({}));
  const sessionId =
    typeof json?.builderKind === "string" &&
    typeof json?.topicKey === "string" &&
    typeof json?.learningMode === "string"
      ? buildTopicSessionHref(
          json.builderKind,
          json.topicKey,
          json.learningMode,
        ).replace("/practice/", "")
      : typeof json?.sessionId === "string"
        ? json.sessionId
        : "best-next";

  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const session = await getOrCreatePracticeSession(
    user,
    sessionId,
  );

  if (!session) {
    return NextResponse.json(
      { error: "No practice session is available yet." },
      { status: 409 },
    );
  }

  return NextResponse.json(session);
}
