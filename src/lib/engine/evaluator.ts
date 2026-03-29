import { z } from "zod";
import { evaluateWithLLM } from "@/lib/ai/service";
import type {
  AssessmentQuestion,
  AssessmentResult,
  FeedbackPayload,
  PracticeItem,
  RecommendationPayload,
} from "@/lib/types";
import { calculateResponseScore, calculateSessionScore } from "@/lib/engine/scoring";
import { clamp, round, tokenize } from "@/lib/utils";

export const practiceEvaluationRequestSchema = z.object({
  sessionId: z.string(),
  itemId: z.string(),
  response: z.string(),
  attemptNumber: z.number().min(1),
  responseLatencyMs: z.number().int().min(0).max(1000 * 60 * 30).optional(),
});

export const practiceCompleteRequestSchema = z.object({
  sessionId: z.string(),
  items: z.array(
    z.object({
      itemId: z.string(),
      responseScore: z.number(),
      qualityScore: z.number(),
      revealedAnswer: z.boolean(),
    }),
  ),
});

export const assessmentEvaluationRequestSchema = z.object({
  mode: z.enum(["placement", "recalibration"]).optional(),
  answers: z.array(
    z.object({
      questionId: z.string(),
      value: z.string(),
    }),
  ),
});

function overlapScore(requiredTokens: string[], response: string) {
  const tokens = tokenize(response);
  if (!tokens.length) {
    return 0;
  }

  const matched = requiredTokens.filter((token) => tokens.includes(token.toLowerCase()));
  return matched.length / requiredTokens.length;
}

function findMissingTokens(requiredTokens: string[], response: string) {
  const tokens = tokenize(response);
  return requiredTokens.filter((token) => !tokens.includes(token.toLowerCase()));
}

export async function evaluatePracticeItem(
  item: PracticeItem,
  response: string,
  attemptNumber: number,
): Promise<FeedbackPayload> {
  const llmFeedback = await evaluateWithLLM(item, response, attemptNumber);
  if (llmFeedback) {
    return { ...llmFeedback, itemId: item.id, structureKey: item.structureKey };
  }

  const coverage = overlapScore(item.evaluationRubric.requiredTokens, response);
  const missing = findMissingTokens(item.evaluationRubric.requiredTokens, response);
  const firstTryAccuracy = clamp(coverage);
  const repairSuccess = coverage >= 0.85 ? 1 : coverage >= 0.6 ? 0.65 : 0.25;
  const lowHintDependence = attemptNumber === 1 ? 1 : attemptNumber === 2 ? 0.65 : 0.35;
  const lowErrorSeverity =
    item.evaluationRubric.severity === "high"
      ? 1 - (1 - coverage) * 1.1
      : item.evaluationRubric.severity === "medium"
        ? 1 - (1 - coverage) * 0.9
        : 1 - (1 - coverage) * 0.7;
  const naturalnessQuality = response.trim().split(/\s+/).length >= 6 ? 0.8 : 0.62;
  const responseScore = calculateResponseScore({
    firstTryAccuracy,
    repairSuccess,
    lowHintDependence,
    lowErrorSeverity: clamp(lowErrorSeverity),
    naturalnessQuality,
  });

  const qualityScore = round(
    clamp((coverage * 0.7 + naturalnessQuality * 0.3) * (attemptNumber > 1 ? 0.92 : 1)),
  );

  const isAccepted = coverage >= 0.8;

  return {
    itemId: item.id,
    structureKey: item.structureKey,
    highlightedSpans: isAccepted
      ? []
      : [
          {
            text: missing.slice(0, 2).join(" ") || response.split(" ").slice(-3).join(" "),
            reason: `${item.evaluationRubric.commonSlip} Missing or weak token(s): ${missing.slice(0, 2).join(", ")}.`,
            severity: item.evaluationRubric.severity,
          },
        ],
    errorTags: [item.evaluationRubric.errorTag],
    hint1: item.hint1,
    hint2: item.hint2,
    acceptedAnswer: item.acceptedAnswer,
    naturalRewrite: item.naturalRewrite,
    levelUpVariants: item.levelUpVariants,
    whyItWorks: item.whyItWorks,
    qualityScore,
    responseScore,
    shouldUpdateMastery: true,
    isAccepted,
    canRevealAnswer: !isAccepted && attemptNumber >= 2,
  };
}

export function summarizeSession(
  sessionId: string,
  items: Array<{ responseScore: number; qualityScore: number; revealedAnswer: boolean }>,
  recommendation: RecommendationPayload,
) {
  const learningScore = calculateSessionScore(
    items.map((item) => item.responseScore),
    0.08,
    items.filter((item) => item.revealedAnswer).length * 0.05,
  );

  return {
    sessionId,
    learningScore,
    masteryDelta: round(
      clamp(
        items.reduce((sum, item) => sum + item.qualityScore, 0) / items.length / 4,
        0,
        0.18,
      ),
    ),
    reviewItemsCreated: items.filter((item) => item.responseScore < 0.62).length,
    streakChange: "+1 meaningful streak",
    leagueImpact: `+${Math.max(9, Math.round(learningScore * 18))} weekly score`,
    recommendationTitle: recommendation.selected.title,
    recommendationReason: recommendation.selected.reason,
  };
}

export function evaluateAssessment(
  questions: AssessmentQuestion[],
  answers: Array<{ questionId: string; value: string }>,
): AssessmentResult {
  if (!answers.length) {
    return {
      overallLevel: "A2",
      grammarControl: "A2",
      vocabularyUsage: "A2",
      sentenceBuilding: "A2",
      topGrowthAreas: ["Articles", "Prepositions", "Sentence combining"],
      initialLane: "Foundation",
      confidence: 0.2,
    };
  }

  let grammarSignal = 0;
  let vocabularySignal = 0;
  let sentenceSignal = 0;

  for (const question of questions) {
    const answer = answers.find((entry) => entry.questionId === question.id)?.value ?? "";
    const tokenCount = tokenize(answer).length;

    if (
      question.targetStructure === "articles" ||
      question.targetStructure === "prepositions" ||
      question.targetStructure === "present-perfect"
    ) {
      grammarSignal += tokenCount >= 5 ? 1 : 0.5;
    }

    if (question.targetStructure === "collocations") {
      vocabularySignal += tokenCount >= 6 ? 1 : 0.45;
    }

    if (
      question.targetStructure === "relative-clauses" ||
      question.targetStructure === "connectors" ||
      question.targetStructure === "conditionals"
    ) {
      sentenceSignal += tokenCount >= 8 ? 1 : 0.55;
    }
  }

  return {
    overallLevel:
      grammarSignal + vocabularySignal + sentenceSignal >= 9 ? "B2" : "B1",
    grammarControl: grammarSignal >= 4 ? "B1" : "A2",
    vocabularyUsage: vocabularySignal >= 1.5 ? "B2" : "B1",
    sentenceBuilding: sentenceSignal >= 3.2 ? "B2" : "B1",
    topGrowthAreas:
      grammarSignal < 4
        ? ["Articles", "Prepositions", "Sentence combining"]
        : sentenceSignal < 3
          ? ["Sentence combining", "Connectors", "Relative clauses"]
          : ["Collocations", "Relative clauses", "Conditionals"],
    initialLane:
      grammarSignal < 3
        ? "Foundation"
        : sentenceSignal >= 3
          ? "Flexible Production"
          : "Controlled Production",
    confidence: 0.76,
  };
}
