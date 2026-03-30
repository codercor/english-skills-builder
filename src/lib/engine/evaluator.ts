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

const BE_AUXILIARIES = new Set([
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
]);

function lexemeForms(token: string) {
  const normalized = token.toLowerCase();
  const forms = new Set([normalized]);

  if (normalized.endsWith("ies") && normalized.length > 4) {
    forms.add(`${normalized.slice(0, -3)}y`);
  }

  if (normalized.endsWith("es") && normalized.length > 4) {
    forms.add(normalized.slice(0, -2));
  }

  if (normalized.endsWith("s") && normalized.length > 3) {
    forms.add(normalized.slice(0, -1));
  }

  if (normalized.endsWith("ing") && normalized.length > 5) {
    const stem = normalized.slice(0, -3);
    forms.add(stem);
    forms.add(`${stem}e`);
  }

  if (normalized.endsWith("ed") && normalized.length > 4) {
    const stem = normalized.slice(0, -2);
    forms.add(stem);
    forms.add(`${stem}e`);

    if (stem.endsWith("i")) {
      forms.add(`${stem.slice(0, -1)}y`);
    }
  }

  return forms;
}

function bestTokenMatchWeight(requiredToken: string, responseTokens: string[]) {
  const requiredForms = lexemeForms(requiredToken);
  let best = 0;

  for (let index = 0; index < responseTokens.length; index += 1) {
    const token = responseTokens[index];

    if (token === requiredToken.toLowerCase()) {
      return 1;
    }

    const tokenForms = lexemeForms(token);
    const sharesLexeme = [...requiredForms].some((form) => tokenForms.has(form));

    if (!sharesLexeme) {
      continue;
    }

    const previousToken = responseTokens[index - 1];
    const weakPassiveForm =
      token.endsWith("ed") &&
      Boolean(previousToken) &&
      BE_AUXILIARIES.has(previousToken);

    best = Math.max(best, weakPassiveForm ? 0.35 : 0.72);
  }

  return best;
}

function overlapScore(requiredTokens: string[], response: string) {
  const tokens = tokenize(response);
  if (!tokens.length || !requiredTokens.length) {
    return 0;
  }

  const weightedMatches = requiredTokens.reduce(
    (sum, token) => sum + bestTokenMatchWeight(token, tokens),
    0,
  );

  return weightedMatches / requiredTokens.length;
}

function findMissingTokens(requiredTokens: string[], response: string) {
  const tokens = tokenize(response);
  return requiredTokens.filter(
    (token) => bestTokenMatchWeight(token, tokens) === 0,
  );
}

function editDistance(left: string, right: string) {
  if (left === right) {
    return 0;
  }

  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array.from({ length: right.length + 1 }, () => 0),
  );

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + substitutionCost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function findPotentialTypo(item: PracticeItem, response: string) {
  const responseTokens = tokenize(response);
  const expectedTokens = [
    ...item.evaluationRubric.requiredTokens,
    ...tokenize(item.acceptedAnswer),
    ...tokenize(item.naturalRewrite),
  ]
    .filter((token) => token.length >= 4)
    .filter((token, index, array) => array.indexOf(token) === index);

  for (const token of responseTokens) {
    if (token.length < 4) {
      continue;
    }

    if (expectedTokens.includes(token)) {
      continue;
    }

    const sharesLexeme = expectedTokens.some(
      (expected) => bestTokenMatchWeight(expected, [token]) > 0,
    );
    if (sharesLexeme) {
      continue;
    }

    const closest = expectedTokens
      .map((expected) => ({
        expected,
        distance: editDistance(token, expected),
      }))
      .filter(({ distance }) => distance > 0 && distance <= 2)
      .sort((left, right) => left.distance - right.distance)[0];

    if (closest) {
      return {
        actual: token,
        expected: closest.expected,
      };
    }
  }

  return null;
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
  const potentialTypo = findPotentialTypo(item, response);
  const firstTryAccuracy = clamp(coverage);
  const repairSuccess = coverage >= 0.85 ? 1 : coverage >= 0.6 ? 0.65 : 0.25;
  const lowHintDependence = attemptNumber === 1 ? 1 : attemptNumber === 2 ? 0.65 : 0.35;
  const lowErrorSeverity =
    item.evaluationRubric.severity === "high"
      ? 1 - (1 - coverage) * 1.1
      : item.evaluationRubric.severity === "medium"
        ? 1 - (1 - coverage) * 0.9
        : 1 - (1 - coverage) * 0.7;
  const naturalnessQuality = clamp(
    (response.trim().split(/\s+/).length >= 6 ? 0.8 : 0.62) - (potentialTypo ? 0.12 : 0),
  );
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

  const isAccepted = coverage >= 0.8 && !potentialTypo;
  const fallbackReason = potentialTypo
    ? `Possible spelling or word-form issue: "${potentialTypo.actual}" looks closer to "${potentialTypo.expected}".${missing.length ? ` The sentence also still needs ${missing.slice(0, 2).join(" and ")}.` : ""}`
    : missing.length
      ? `${item.evaluationRubric.commonSlip} Missing or weak token(s): ${missing.slice(0, 2).join(", ")}.`
      : `${item.evaluationRubric.commonSlip} The key idea is present, but the sentence form still needs tightening.`;

  return {
    itemId: item.id,
    structureKey: item.structureKey,
    highlightedSpans: isAccepted
      ? []
      : [
          {
            text:
              potentialTypo?.actual ??
              (missing.slice(0, 2).join(" ") ||
                response.split(" ").slice(-4).join(" ")),
            reason: fallbackReason,
            severity: item.evaluationRubric.severity,
          },
        ],
    errorTags: potentialTypo
      ? [item.evaluationRubric.errorTag, "spelling_or_word_form"]
      : [item.evaluationRubric.errorTag],
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
