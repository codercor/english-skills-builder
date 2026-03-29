import { NextResponse } from "next/server";
import { getAssessmentQuestions } from "@/lib/server/learning";

export async function POST() {
  return NextResponse.json({
    questions: await getAssessmentQuestions(),
  });
}
