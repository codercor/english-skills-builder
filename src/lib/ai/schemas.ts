import { z } from "zod";

export const promptPayloadSchema = z.object({
  title: z.string(),
  description: z.string(),
  items: z.array(
    z.object({
      prompt: z.string(),
      promptType: z.enum([
        "completion",
        "rewrite",
        "guided_generation",
        "free_production",
        "memory_anchor",
        "constraint_based",
        "error_correction",
      ]),
      acceptedAnswer: z.string(),
      hint1: z.string(),
      hint2: z.string(),
      naturalRewrite: z.string(),
      whyItWorks: z.string(),
      levelUpVariants: z.array(
        z.object({
          level: z.enum(["A2", "B1", "B2", "C1"]),
          text: z.string(),
        }),
      ),
      evaluationRubric: z.object({
        requiredTokens: z.array(z.string()),
        preferredPhrases: z.array(z.string()).optional(),
        errorTag: z.string(),
        commonSlip: z.string(),
        severity: z.enum(["low", "medium", "high"]),
      }),
    }),
  ),
});

export const feedbackPayloadSchema = z.object({
  highlightedSpans: z.array(
    z.object({
      text: z.string(),
      reason: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    }),
  ),
  issues: z.array(
    z.object({
      kind: z.enum([
        "spelling_word_form",
        "grammar_structure",
        "tone_register",
        "word_choice",
        "naturalness_fluency",
      ]),
      title: z.string(),
      summary: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      fixFirst: z.boolean(),
      hint: z.string(),
    }),
  ),
  errorTags: z.array(z.string()),
  hint1: z.string(),
  hint2: z.string(),
  acceptedAnswer: z.string(),
  naturalRewrite: z.string(),
  levelUpVariants: z.array(
    z.object({
      level: z.enum(["A2", "B1", "B2", "C1"]),
      text: z.string(),
    }),
  ),
  whyItWorks: z.string(),
  qualityScore: z.number(),
  responseScore: z.number(),
  shouldUpdateMastery: z.boolean(),
  isAccepted: z.boolean(),
  canRevealAnswer: z.boolean(),
});

export const recommendationPayloadSchema = z.object({
  selectedIndex: z.number().min(0),
  rationale: z.string(),
});

export const progressionDecisionPayloadSchema = z.object({
  decisionType: z.enum([
    "promote",
    "hold",
    "assign_review",
    "difficulty_up",
    "difficulty_down",
    "switch_prompt_type",
    "prioritize_weakness",
    "schedule_recalibration",
  ]),
  confidence: z.number().min(0).max(1),
  reasonCodes: z.array(z.string()),
  expectedEffect: z.string(),
});
