import { z } from "zod";
import { evaluateWithLLM } from "@/lib/ai/service";
import { getStructureUnit } from "@/lib/catalog";
import type {
  AssessmentQuestion,
  AssessmentResult,
  FeedbackIssue,
  FeedbackIssueKind,
  FeedbackPayload,
  PracticeItem,
  PracticeTaskStep,
  RecognitionEvidence,
  RecommendationPayload,
} from "@/lib/types";
import { calculateResponseScore, calculateSessionScore } from "@/lib/engine/scoring";
import { clamp, round, tokenize } from "@/lib/utils";

const recognitionEvidenceSchema = z.object({
  selectedChoiceId: z.string(),
  correctChoiceId: z.string(),
  choiceAttempts: z.number().min(1),
  revealed: z.boolean(),
  correct: z.boolean(),
  score: z.number().min(0).max(1),
});

export const practiceEvaluationRequestSchema = z.object({
  sessionId: z.string(),
  itemId: z.string(),
  response: z.string().default(""),
  attemptNumber: z.number().min(1),
  responseLatencyMs: z.number().int().min(0).max(1000 * 60 * 30).optional(),
  interactionStep: z.enum(["recognition", "follow_up", "text"]).optional(),
  selectedChoiceId: z.string().optional(),
  recognitionEvidence: recognitionEvidenceSchema.optional(),
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

const ABSOLUTE_TONE_WORDS = new Set([
  "prove",
  "proves",
  "proved",
  "always",
  "never",
  "definitely",
  "certainly",
  "clearly",
  "obviously",
  "bad",
  "good",
  "best",
  "worst",
]);

const CASUAL_REGISTER_WORDS = new Set([
  "thing",
  "stuff",
  "really",
  "a lot",
  "good",
  "bad",
]);

const ISSUE_TITLES: Record<FeedbackIssueKind, string> = {
  spelling_word_form: "Spelling / word form",
  grammar_structure: "Grammar / structure",
  tone_register: "Tone / register",
  word_choice: "Word choice",
  naturalness_fluency: "Naturalness / fluency",
};

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

function normalizeExactRewriteText(text: string) {
  return text
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function matchesExactRewrite(expected: string, response: string) {
  return normalizeExactRewriteText(expected) === normalizeExactRewriteText(response);
}

function hasPhrase(response: string, phrase: string) {
  return response.toLowerCase().includes(phrase.toLowerCase());
}

function isOpenProductionItem(item: PracticeItem) {
  return (
    item.allowOpenProduction !== false &&
    (item.promptType === "memory_anchor" || item.promptType === "free_production")
  );
}

function groundedExpectedTokens(item: PracticeItem) {
  return [
    ...(item.groundingTargets ?? []),
    ...item.evaluationRubric.requiredTokens,
    ...tokenize(item.focusTargetItemLabel ?? ""),
  ]
    .map((token) => token.toLowerCase())
    .filter((token) => token.length >= 4)
    .filter((token, index, array) => array.indexOf(token) === index);
}

function withFeedbackTrust(
  item: PracticeItem,
  feedback: Omit<FeedbackPayload, "feedbackSource" | "feedbackConfidence" | "scoreVisible">,
  source: FeedbackPayload["feedbackSource"],
  options?: { forceGrounded?: boolean },
): FeedbackPayload {
  const lowConfidence = options?.forceGrounded ? false : isOpenProductionItem(item);

  return {
    ...feedback,
    feedbackSource: source,
    feedbackConfidence: lowConfidence ? "low_confidence" : "grounded",
    scoreVisible: !lowConfidence,
  };
}

function findPotentialTypo(item: PracticeItem, response: string) {
  const responseTokens = tokenize(response);
  const expectedTokens = groundedExpectedTokens(item);

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

function primaryIssueKind(item: PracticeItem): FeedbackIssueKind {
  const unit = getStructureUnit(item.structureKey);

  if (
    item.structureKey === "hedging" ||
    item.evaluationRubric.errorTag.includes("tone")
  ) {
    return "tone_register";
  }

  if (unit?.builderKind === "vocabulary" || unit?.builderKind === "phrase_idiom") {
    return "word_choice";
  }

  if (unit?.builderKind === "sentence") {
    return "naturalness_fluency";
  }

  return "grammar_structure";
}

function activeVocabularyTarget(item: PracticeItem) {
  return (
    item.targetItems?.find((target) => target.itemKey === item.focusTargetItemKey) ??
    item.targetItems?.[0] ??
    null
  );
}

function buildStrategySpecificIssue(
  item: PracticeItem,
  response: string,
): FeedbackIssue | null {
  const responseLower = response.toLowerCase();

  if (item.feedbackStrategy === "reported_speech") {
    if (item.evaluationRubric.errorTag.includes("told_frame") && /\btold that\b/.test(responseLower)) {
      return {
        kind: "grammar_structure",
        title: ISSUE_TITLES.grammar_structure,
        summary: 'Use "told" with an object like "me", "us", or "him". "Told that" sounds incomplete in reported speech.',
        severity: "high",
        fixFirst: false,
        hint: 'Try the full frame: "told me that..."',
      };
    }

    if (
      item.evaluationRubric.errorTag.includes("time_shift") &&
      /\b(today|tomorrow|here|now|will)\b/.test(responseLower)
    ) {
      return {
        kind: "grammar_structure",
        title: ISSUE_TITLES.grammar_structure,
        summary: "This report still keeps direct-speech time or future wording. Reported speech usually shifts the tense or the time marker here.",
        severity: "high",
        fixFirst: false,
        hint: 'Try forms like "would", "that day", "the next day", or "there" if the original moment has shifted.',
      };
    }

    if (
      item.evaluationRubric.errorTag.includes("question_form") &&
      (responseLower.includes("?") || /\basked\b.*\b(did|do|does|is|are|can|will|have)\b/.test(responseLower))
    ) {
      return {
        kind: "grammar_structure",
        title: ISSUE_TITLES.grammar_structure,
        summary: "Reported questions need statement word order. The sentence still sounds too close to the original question.",
        severity: "high",
        fixFirst: false,
        hint: 'Use a frame like "asked whether ..." and keep the verb order flat.',
      };
    }

    if (/\b(i|me|my)\b/.test(responseLower) && /\b(she|he|they)\b/.test(item.acceptedAnswer.toLowerCase())) {
      return {
        kind: "grammar_structure",
        title: ISSUE_TITLES.grammar_structure,
        summary: "The viewpoint is still too close to the original quote. Reported speech usually shifts the pronoun to match the speaker being reported.",
        severity: "medium",
        fixFirst: false,
        hint: "Check whether the pronoun should follow the original speaker instead of the direct quote voice.",
      };
    }
  }

  if (item.feedbackStrategy === "spoken_chunk") {
    if (hasPhrase(responseLower, "go to home")) {
      return {
        kind: "word_choice",
        title: ISSUE_TITLES.word_choice,
        summary: 'English uses the chunk "go home", not "go to home". The extra preposition makes it sound translated.',
        severity: "high",
        fixFirst: false,
        hint: 'Use the chunk exactly as "go home".',
      };
    }

    if (item.evaluationRubric.errorTag.includes("spoken_chunk_honest") && !hasPhrase(responseLower, "to be honest")) {
      return {
        kind: "word_choice",
        title: ISSUE_TITLES.word_choice,
        summary: 'This task is checking the fixed chunk "to be honest". The current wording still misses part of that opener.',
        severity: "medium",
        fixFirst: false,
        hint: 'Start with the full chunk "to be honest".',
      };
    }

    if (item.evaluationRubric.errorTag.includes("spoken_chunk_same_time") && hasPhrase(responseLower, "same side")) {
      return {
        kind: "word_choice",
        title: ISSUE_TITLES.word_choice,
        summary: 'The natural chunk is "at the same time". Changing one word inside the chunk makes it sound unnatural.',
        severity: "high",
        fixFirst: false,
        hint: 'Use "at the same time".',
      };
    }

    if (item.evaluationRubric.errorTag.includes("spoken_chunk_bit") && !hasPhrase(responseLower, "a bit")) {
      return {
        kind: "word_choice",
        title: ISSUE_TITLES.word_choice,
        summary: 'This task is checking the chunk "a bit". The current sentence still does not keep that chunk together.',
        severity: "medium",
        fixFirst: false,
        hint: 'Keep the chunk together as "a bit".',
      };
    }

    if (item.evaluationRubric.errorTag.includes("spoken_chunk_that_said") && !hasPhrase(responseLower, "that said")) {
      return {
        kind: "word_choice",
        title: ISSUE_TITLES.word_choice,
        summary: 'The contrast is clear, but the sentence still misses the spoken chunk "that said".',
        severity: "medium",
        fixFirst: false,
        hint: 'Open the sentence with "That said, ..."',
      };
    }
  }

  return null;
}

function issuePriority(issue: FeedbackIssue) {
  const severityWeight =
    issue.severity === "high" ? 30 : issue.severity === "medium" ? 20 : 10;
  const kindWeight =
    issue.kind === "spelling_word_form"
      ? 5
      : issue.kind === "grammar_structure"
        ? 4
        : issue.kind === "tone_register"
          ? 3
          : issue.kind === "word_choice"
            ? 2
            : 1;

  return severityWeight + kindWeight;
}

function buildIssues(params: {
  item: PracticeItem;
  response: string;
  coverage: number;
  missing: string[];
  potentialTypo: { actual: string; expected: string } | null;
  attemptNumber: number;
}) {
  const { item, response, coverage, missing, potentialTypo } = params;
  const responseTokens = tokenize(response);
  const issues: FeedbackIssue[] = [];
  const primaryKind = primaryIssueKind(item);
  const targetItem = activeVocabularyTarget(item);
  const absoluteToneWords = responseTokens.filter((token) =>
    ABSOLUTE_TONE_WORDS.has(token),
  );
  const casualRegisterWords = responseTokens.filter((token) =>
    CASUAL_REGISTER_WORDS.has(token),
  );
  const strategySpecificIssue = buildStrategySpecificIssue(item, response);
  const preferredPhrases = item.evaluationRubric.preferredPhrases ?? [];
  const missingPreferredPhrase = preferredPhrases.find((phrase) => {
    const normalizedPhrase = phrase.toLowerCase();
    return !response.toLowerCase().includes(normalizedPhrase);
  });
  const feelsShort =
    responseTokens.length > 0 &&
    responseTokens.length < Math.max(6, tokenize(item.acceptedAnswer).length - 2);

  if (strategySpecificIssue) {
    issues.push(strategySpecificIssue);
  }

  if (potentialTypo && !strategySpecificIssue) {
    issues.push({
      kind: "spelling_word_form",
      title: ISSUE_TITLES.spelling_word_form,
      summary: `"${potentialTypo.actual}" looks closer to "${potentialTypo.expected}", so the sentence still breaks before the main idea can land cleanly.`,
      severity: "high",
      fixFirst: false,
      hint: `Repair "${potentialTypo.actual}" first, then check the rest of the sentence again.`,
    });
  }

  if (missing.length || coverage < 0.82) {
    const missingText = missing.slice(0, 2).join(", ");
    const issueSummary =
      primaryKind === "tone_register"
        ? `${item.evaluationRubric.commonSlip} The claim still sounds too absolute for the evidence you are showing${missingText ? `, and it is still missing ${missingText}` : ""}.`
        : primaryKind === "word_choice"
          ? targetItem?.kind === "word_family"
            ? `${item.evaluationRubric.commonSlip}${missingText ? ` The slot still needs a cleaner form from "${targetItem.label}"` : ` The sentence still needs a cleaner form from "${targetItem.label}"`}, so the family choice is not stable yet.`
            : targetItem
              ? `${item.evaluationRubric.commonSlip}${missingText ? ` The sentence is still missing or weakening ${missingText}` : ""}, so "${targetItem.label}" does not land as a natural ${targetItem.kind === "collocation" ? "collocation" : "word choice"} yet.`
              : `${item.evaluationRubric.commonSlip}${missingText ? ` The sentence is still missing or weakening ${missingText}` : ""}, so the wording does not sound fully usable yet.`
          : primaryKind === "naturalness_fluency"
            ? `${item.evaluationRubric.commonSlip}${missingText ? ` The connection is still weak around ${missingText}` : ""}, so the sentence does not flow yet.`
            : `${item.evaluationRubric.commonSlip}${missingText ? ` The target form is still weak around ${missingText}.` : ""}`;

    issues.push({
      kind: primaryKind,
      title: ISSUE_TITLES[primaryKind],
      summary: issueSummary,
      severity: item.evaluationRubric.severity,
      fixFirst: false,
      hint: item.hint1,
    });
  }

  if (
    primaryKind !== "tone_register" &&
    (item.structureKey === "hedging" ||
      item.evaluationRubric.errorTag.includes("tone") ||
      item.supportObjective.toLowerCase().includes("tone") ||
      ((targetItem?.register === "formal" || targetItem?.register === "academic") &&
        casualRegisterWords.length > 0)) &&
    (absoluteToneWords.length > 0 ||
      missing.includes("may") ||
      missing.includes("might") ||
      casualRegisterWords.length > 0)
  ) {
    issues.push({
      kind: "tone_register",
      title: ISSUE_TITLES.tone_register,
      summary:
        casualRegisterWords.length > 0 && targetItem
          ? `The wording around "${targetItem.label}" is still more casual than this task wants${casualRegisterWords.length ? ` because of ${casualRegisterWords.slice(0, 2).join(" and ")}` : ""}, so the register does not fully match yet.`
          : `The tone still sounds more absolute than analytical${absoluteToneWords.length ? ` because of ${absoluteToneWords.slice(0, 2).join(" and ")}` : ""}, which makes the claim harder to defend.`,
      severity: "medium",
      fixFirst: false,
      hint: item.hint1,
    });
  }

  if (
    primaryKind !== "word_choice" &&
    missingPreferredPhrase
  ) {
    issues.push({
      kind: "word_choice",
      title: ISSUE_TITLES.word_choice,
      summary: `The idea is close, but the wording still misses a more natural choice like "${missingPreferredPhrase}", so it can sound translated or slightly off-register.`,
      severity: "medium",
      fixFirst: false,
      hint: item.hint1,
    });
  }

  if (
    primaryKind !== "naturalness_fluency" &&
    (feelsShort || item.promptType === "guided_generation" || item.promptType === "free_production")
  ) {
    issues.push({
      kind: "naturalness_fluency",
      title: ISSUE_TITLES.naturalness_fluency,
      summary: feelsShort
        ? "The sentence is understandable, but it is still too bare to feel like a natural final version."
        : "The sentence carries the idea, but it still sounds slightly mechanical rather than fully fluent.",
      severity: feelsShort ? "medium" : "low",
      fixFirst: false,
      hint:
        params.attemptNumber > 1
          ? item.hint2
          : "Add one detail, connector, or natural phrase so the sentence sounds more complete.",
    });
  }

  const uniqueIssues = issues.reduce<FeedbackIssue[]>((list, issue) => {
    if (list.some((current) => current.kind === issue.kind)) {
      return list;
    }

    list.push(issue);
    return list;
  }, []);

  uniqueIssues.sort((left, right) => issuePriority(right) - issuePriority(left));

  return uniqueIssues.slice(0, 3).map((issue, index) => ({
    ...issue,
    fixFirst: index === 0,
  }));
}

function buildHighlightedSpans(params: {
  item: PracticeItem;
  response: string;
  missing: string[];
  potentialTypo: { actual: string; expected: string } | null;
  issues: FeedbackIssue[];
}) {
  const spans: FeedbackPayload["highlightedSpans"] = [];
  const responseTokens = tokenize(params.response);
  const absoluteToneWords = responseTokens.filter((token) =>
    ABSOLUTE_TONE_WORDS.has(token),
  );

  if (params.potentialTypo) {
    spans.push({
      text: params.potentialTypo.actual,
      reason: `This looks closer to "${params.potentialTypo.expected}".`,
      severity: "high",
    });
  }

  if (params.missing.length) {
    spans.push({
      text: params.missing.slice(0, 2).join(" "),
      reason: `The sentence still needs ${params.missing.slice(0, 2).join(" and ")} to land the target cleanly.`,
      severity: params.item.evaluationRubric.severity,
    });
  }

  if (absoluteToneWords.length && spans.length < 3) {
    spans.push({
      text: absoluteToneWords.slice(0, 2).join(" "),
      reason: "This wording makes the claim sound more absolute than the task wants.",
      severity: "medium",
    });
  }

  if (!spans.length && params.issues[0]) {
    spans.push({
      text:
        responseTokens.slice(-4).join(" ") ||
        params.response.trim() ||
        params.item.topic,
      reason: params.issues[0].summary,
      severity: params.issues[0].severity,
    });
  }

  return spans.slice(0, 3);
}

function recognitionCredit(attemptNumber: number, correct: boolean) {
  if (!correct) {
    return 0;
  }

  return attemptNumber === 1 ? 0.22 : 0.12;
}

function resolveChoiceFeedback(
  item: PracticeItem,
  selectedChoiceId: string,
  correctChoiceId: string,
) {
  const correctOption =
    item.choiceOptions?.find((option) => option.id === correctChoiceId) ?? null;
  const selectedOption =
    item.choiceOptions?.find((option) => option.id === selectedChoiceId) ?? null;
  const configured = item.choiceFeedbackByOption?.[selectedChoiceId];

  if (configured) {
    return configured;
  }

  if (selectedChoiceId === correctChoiceId) {
    return {
      whatWentWrong: "Right choice.",
      why: item.whyItWorks,
      whatFitsInstead: `Lock it in now by rewriting "${correctOption?.text ?? item.acceptedAnswer}" exactly.`,
    };
  }

  const primaryKind = primaryIssueKind(item);
  const why =
    primaryKind === "word_choice"
      ? item.evaluationRubric.commonSlip
      : primaryKind === "grammar_structure"
        ? item.hint1
        : item.whyItWorks;

  return {
    whatWentWrong:
      selectedOption?.text
        ? `"${selectedOption.text}" keeps the weaker version of the pattern.`
        : "That option keeps the weaker version of the pattern.",
    why,
    whatFitsInstead: `The better option is "${correctOption?.text ?? item.acceptedAnswer}".`,
  };
}

function buildRecognitionFeedback(
  item: PracticeItem,
  selectedChoiceId: string,
  attemptNumber: number,
): FeedbackPayload {
  const correctChoiceId = item.correctChoiceId ?? item.choiceOptions?.[0]?.id ?? "A";
  const correct = selectedChoiceId === correctChoiceId;
  const revealed = !correct && attemptNumber >= 2;
  const recognitionEvidence: RecognitionEvidence = {
    selectedChoiceId,
    correctChoiceId,
    choiceAttempts: attemptNumber,
    revealed,
    correct,
    score: recognitionCredit(attemptNumber, correct),
  };
  const recognitionFeedback = resolveChoiceFeedback(
    item,
    selectedChoiceId,
    correctChoiceId,
  );
  const correctOption =
    item.choiceOptions?.find((option) => option.id === correctChoiceId) ?? null;
  const issueKind = primaryIssueKind(item);

  return withFeedbackTrust(
    item,
    {
    itemId: item.id,
    structureKey: item.structureKey,
    taskStep: "recognition",
    itemResolved: false,
    opensFollowUp: correct || revealed,
    recognitionEvidence,
    recognitionFeedback,
    highlightedSpans:
      correct
        ? []
        : [
            {
              text: correctOption?.text ?? item.acceptedAnswer,
              reason: recognitionFeedback.whatFitsInstead,
              severity: item.evaluationRubric.severity,
            },
          ],
    issues:
      correct
        ? []
        : [
            {
              kind: issueKind,
              title: ISSUE_TITLES[issueKind],
              summary: recognitionFeedback.whatWentWrong,
              severity: item.evaluationRubric.severity,
              fixFirst: true,
              hint: recognitionFeedback.whatFitsInstead,
            },
          ],
    errorTags: [
      item.evaluationRubric.errorTag,
      correct ? "recognition_match" : "recognition_miss",
    ],
    hint1: item.followUpHint1 ?? item.hint1,
    hint2: item.followUpHint2 ?? item.hint2,
    acceptedAnswer: correctOption?.text ?? item.acceptedAnswer,
    naturalRewrite: item.followUpNaturalRewrite ?? item.naturalRewrite,
    levelUpVariants: item.followUpLevelUpVariants ?? item.levelUpVariants,
    whyItWorks: correct ? item.whyItWorks : recognitionFeedback.why,
    qualityScore: round(recognitionEvidence.score),
    responseScore: round(recognitionEvidence.score),
    shouldUpdateMastery: false,
    isAccepted: correct,
    canRevealAnswer: false,
    },
    item.contentSource ?? "authored_bank",
    { forceGrounded: true },
  );
}

function toFollowUpItem(item: PracticeItem): PracticeItem {
  if (!item.followUpPrompt) {
    return item;
  }

  return {
    ...item,
    prompt: item.followUpPrompt,
    promptType: item.followUpPromptType ?? item.promptType,
    interactionType: "text",
    followUpMode: item.followUpMode,
    acceptedAnswer: item.followUpAcceptedAnswer ?? item.acceptedAnswer,
    whyItWorks: item.followUpWhyItWorks ?? item.whyItWorks,
    hint1: item.followUpHint1 ?? item.hint1,
    hint2: item.followUpHint2 ?? item.hint2,
    naturalRewrite: item.followUpNaturalRewrite ?? item.naturalRewrite,
    levelUpVariants: item.followUpLevelUpVariants ?? item.levelUpVariants,
    evaluationRubric: item.followUpEvaluationRubric ?? item.evaluationRubric,
    choiceOptions: undefined,
    correctChoiceId: undefined,
    choiceFeedbackByOption: undefined,
  };
}

function exactRewriteAcceptedFeedback(
  item: PracticeItem,
  attemptNumber: number,
): Omit<FeedbackPayload, "feedbackSource" | "feedbackConfidence" | "scoreVisible"> {
  const responseScore =
    attemptNumber === 1 ? 0.82 : attemptNumber === 2 ? 0.74 : 0.68;
  const qualityScore =
    attemptNumber === 1 ? 0.9 : attemptNumber === 2 ? 0.84 : 0.78;

  return {
    itemId: item.id,
    structureKey: item.structureKey,
    taskStep: "text",
    itemResolved: true,
    opensFollowUp: false,
    highlightedSpans: [],
    issues: [],
    errorTags: [item.evaluationRubric.errorTag, "exact_rewrite_match"],
    hint1: item.hint1,
    hint2: item.hint2,
    acceptedAnswer: item.acceptedAnswer,
    naturalRewrite: item.naturalRewrite,
    levelUpVariants: item.levelUpVariants,
    whyItWorks: item.whyItWorks,
    qualityScore: round(qualityScore),
    responseScore: round(responseScore),
    shouldUpdateMastery: true,
    isAccepted: true,
    canRevealAnswer: false,
  };
}

function exactRewriteMismatchFeedback(
  item: PracticeItem,
  response: string,
  attemptNumber: number,
): Omit<FeedbackPayload, "feedbackSource" | "feedbackConfidence" | "scoreVisible"> {
  const hasAnyResponse = Boolean(response.trim());
  const summary = hasAnyResponse
    ? "This step is checking whether you can reproduce the reference sentence exactly, so changing the wording still keeps the item unresolved."
    : "This step only counts when you rewrite the reference sentence exactly.";
  const hint = `Rewrite this sentence exactly: "${item.acceptedAnswer}"`;
  const issueKind = primaryIssueKind(item);

  return {
    itemId: item.id,
    structureKey: item.structureKey,
    taskStep: "text",
    itemResolved: false,
    opensFollowUp: false,
    highlightedSpans: [
      {
        text: response.trim() || item.acceptedAnswer,
        reason: "This follow-up is exact rewrite only, so the wording must match the reference sentence.",
        severity: "medium",
      },
    ],
    issues: [
      {
        kind: issueKind,
        title: "Exact rewrite",
        summary,
        severity: "medium",
        fixFirst: true,
        hint,
      },
    ],
    errorTags: [item.evaluationRubric.errorTag, "exact_rewrite_miss"],
    hint1: hint,
    hint2: hint,
    acceptedAnswer: item.acceptedAnswer,
    naturalRewrite: item.naturalRewrite,
    levelUpVariants: item.levelUpVariants,
    whyItWorks: item.whyItWorks,
    qualityScore: round(attemptNumber >= 2 ? 0.22 : 0.3),
    responseScore: round(attemptNumber >= 2 ? 0.18 : 0.24),
    shouldUpdateMastery: true,
    isAccepted: false,
    canRevealAnswer: attemptNumber >= 2,
  };
}

async function evaluateTextPracticeItem(
  item: PracticeItem,
  response: string,
  attemptNumber: number,
): Promise<FeedbackPayload> {
  if (item.followUpMode === "exact_rewrite") {
    if (matchesExactRewrite(item.acceptedAnswer, response)) {
      return withFeedbackTrust(
        item,
        exactRewriteAcceptedFeedback(item, attemptNumber),
        item.contentSource ?? "authored_bank",
        { forceGrounded: true },
      );
    }

    return withFeedbackTrust(
      item,
      exactRewriteMismatchFeedback(item, response, attemptNumber),
      item.contentSource ?? "authored_bank",
      { forceGrounded: true },
    );
  }

  const shouldUseLLM =
    item.contentSource !== "safe_fallback" && isOpenProductionItem(item);
  if (shouldUseLLM) {
    const llmFeedback = await evaluateWithLLM(item, response, attemptNumber);
    if (llmFeedback) {
      return withFeedbackTrust(
        item,
        { ...llmFeedback, itemId: item.id, structureKey: item.structureKey },
        "llm",
      );
    }
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
  const issues = isAccepted
    ? []
    : buildIssues({
        item,
        response,
        coverage,
        missing,
        potentialTypo,
        attemptNumber,
      });
  const highlightedSpans = isAccepted
    ? []
    : buildHighlightedSpans({
        item,
        response,
        missing,
        potentialTypo,
        issues,
      });

  return withFeedbackTrust(item, {
    itemId: item.id,
    structureKey: item.structureKey,
    taskStep: "text",
    itemResolved: isAccepted,
    opensFollowUp: false,
    highlightedSpans,
    issues,
    errorTags: [
      item.evaluationRubric.errorTag,
      ...(potentialTypo ? ["spelling_or_word_form"] : []),
      ...issues.map((issue) => issue.kind),
    ].filter((tag, index, list) => list.indexOf(tag) === index),
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
  }, item.contentSource ?? "authored_bank");
}

function mergeRecognitionEvidence(
  item: PracticeItem,
  feedback: FeedbackPayload,
  recognitionEvidence?: RecognitionEvidence,
): FeedbackPayload {
  if (!recognitionEvidence) {
    return feedback;
  }

  const productionWeight = item.followUpMode === "exact_rewrite" ? 0.78 : 0.85;
  const recognitionWeight = 1 - productionWeight;
  const exactRevealPenalty =
    item.followUpMode === "exact_rewrite" && recognitionEvidence.revealed
      ? 0.88
      : 1;

  return {
    ...feedback,
    taskStep: "follow_up",
    itemResolved: feedback.isAccepted,
    opensFollowUp: false,
    recognitionEvidence,
    responseScore: round(
      clamp(
        (feedback.responseScore * productionWeight +
          recognitionEvidence.score * recognitionWeight) *
          exactRevealPenalty,
      ),
    ),
    qualityScore: round(
      clamp(
        (feedback.qualityScore * 0.92 + recognitionEvidence.score * 0.08) *
          (item.followUpMode === "exact_rewrite" && recognitionEvidence.revealed
            ? 0.92
            : 1),
      ),
    ),
    errorTags: [
      ...feedback.errorTags,
      recognitionEvidence.correct ? "recognition_support" : "recognition_repaired",
    ].filter((tag, index, list) => list.indexOf(tag) === index),
  };
}

export async function evaluatePracticeItem(
  item: PracticeItem,
  response: string,
  attemptNumber: number,
  options?: {
    interactionStep?: PracticeTaskStep;
    selectedChoiceId?: string;
    recognitionEvidence?: RecognitionEvidence;
  },
): Promise<FeedbackPayload> {
  const interactionStep =
    options?.interactionStep ??
    (item.interactionType === "hybrid_choice_text" ? "recognition" : "text");

  if (interactionStep === "recognition") {
    if (!item.choiceOptions?.length || !options?.selectedChoiceId) {
      throw new Error("Recognition items require a selected choice.");
    }

    return buildRecognitionFeedback(item, options.selectedChoiceId, attemptNumber);
  }

  const effectiveItem =
    interactionStep === "follow_up" ? toFollowUpItem(item) : item;
  const feedback = await evaluateTextPracticeItem(
    effectiveItem,
    response,
    attemptNumber,
  );

  return interactionStep === "follow_up"
    ? mergeRecognitionEvidence(effectiveItem, feedback, options?.recognitionEvidence)
    : feedback;
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
