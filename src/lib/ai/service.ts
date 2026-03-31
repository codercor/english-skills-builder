import OpenAI from "openai";
import { feedbackPayloadSchema, recommendationPayloadSchema } from "@/lib/ai/schemas";
import type { CandidateAction, FeedbackPayload, PracticeItem, RecommendationPayload } from "@/lib/types";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

async function parseJsonResponse<T>(
  runner: () => Promise<string | null | undefined>,
  validator: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const raw = await runner();
      if (!raw) {
        continue;
      }

      const parsed = validator.safeParse(JSON.parse(raw));
      if (parsed.success) {
        return parsed.data;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export async function rankRecommendationsWithLLM(
  candidates: CandidateAction[],
): Promise<RecommendationPayload | null> {
  if (!openai) {
    return null;
  }

  const prompt = [
    "You are a personalization engine for an English learning app.",
    "Select the single best next action from the candidate list.",
    "Return strict JSON with selectedIndex and rationale.",
    JSON.stringify({ candidates }, null, 2),
  ].join("\n");

  const parsed = await parseJsonResponse(
    async () => {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Choose the next action that is most likely to improve learning while keeping difficulty in stretch zone.",
          },
          { role: "user", content: prompt },
        ],
      });

      return response.choices[0]?.message?.content;
    },
    recommendationPayloadSchema,
  );

  if (!parsed) {
    return null;
  }

  const selected = candidates[parsed.selectedIndex] ?? candidates[0];

  return {
    selected,
    ranked: candidates,
    rationale: parsed.rationale,
  };
}

export async function evaluateWithLLM(
  item: PracticeItem,
  responseText: string,
  attemptNumber: number,
): Promise<
  Omit<
    FeedbackPayload,
    "itemId" | "structureKey" | "feedbackSource" | "feedbackConfidence" | "scoreVisible"
  > | null
> {
  if (!openai) {
    return null;
  }

  const prompt = [
    "You evaluate one learner sentence for an English production practice app.",
    "Return strict JSON that matches the provided schema exactly.",
    "Be conservative about acceptance. Only accept if the structure and meaning are good enough for the target level.",
    "Keep feedback concise, specific, and useful for self-repair.",
    "Always populate issues as a layered list. Separate spelling/word-form, grammar/structure, tone/register, word choice, and naturalness/fluency when they apply.",
    "If there is a spelling mistake, malformed word form, or obviously wrong surface form, call it out directly in issues, highlightedSpans, and errorTags.",
    "Mark exactly one issue as fixFirst when the answer is not accepted. Pick the single issue that would unlock the biggest improvement on the next try.",
    "Issue summaries should explain what is wrong and why it matters. Issue hints should tell the learner what to change next.",
    "Do not mention words, phrases, or examples that are not in the learner response or in the task's explicit required targets.",
    "Ground the feedback in the actual learner sentence before you mention broader target goals.",
    JSON.stringify(
      {
        prompt: item.prompt,
        promptType: item.promptType,
        structureKey: item.structureKey,
        levelBand: item.levelBand,
        supportObjective: item.supportObjective,
        acceptedAnswer: item.acceptedAnswer,
        hint1: item.hint1,
        hint2: item.hint2,
        naturalRewrite: item.naturalRewrite,
        whyItWorks: item.whyItWorks,
        levelUpVariants: item.levelUpVariants,
        evaluationRubric: item.evaluationRubric,
        learnerResponse: responseText,
        attemptNumber,
        rules: {
          canRevealAnswer: attemptNumber >= 2,
          shouldUpdateMastery: true,
        },
      },
      null,
      2,
    ),
  ].join("\n");

  return parseJsonResponse(
    async () => {
      const response = await openai.chat.completions.create({
        model: DEFAULT_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "You are an English learning evaluator. Return only JSON with 0-1 scores. If accepted, highlightedSpans may be empty and issues may be an empty array. Keep rewritten examples aligned with the same meaning, and use issue blocks to separate different problem types.",
          },
          { role: "user", content: prompt },
        ],
      });

      return response.choices[0]?.message?.content;
    },
    feedbackPayloadSchema,
  );
}
