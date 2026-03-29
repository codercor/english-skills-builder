import { z } from "zod";

export const ONBOARDING_STORAGE_NAMESPACE = "english-practice-onboarding-v2";
export const ONBOARDING_STORAGE_EVENT = "onboarding-profile-change";

export type OnboardingGoal =
  | "speak_naturally"
  | "write_clearly"
  | "reduce_grammar_mistakes";

export type OnboardingTimeCommitment = "light" | "steady" | "immersive";

export type OnboardingConfidence = "supported" | "steady" | "stretch";

export type OnboardingFrustration =
  | "articles_prepositions"
  | "repetitive_sentences"
  | "combining_ideas"
  | "freezing_under_pressure";

export type OnboardingTheme =
  | "work_study"
  | "daily_life"
  | "travel"
  | "opinions"
  | "messages"
  | "ielts";

export type OnboardingCompletionState = "draft" | "completed" | "skipped";

export interface OnboardingProfileInput {
  goal: OnboardingGoal | null;
  timeCommitment: OnboardingTimeCommitment | null;
  confidence: OnboardingConfidence | null;
  ieltsIntent: boolean;
  frustration: OnboardingFrustration | null;
  themes: OnboardingTheme[];
  completionState: OnboardingCompletionState;
}

export interface OnboardingProfile extends OnboardingProfileInput {
  updatedAt: string | null;
}

type Choice<T extends string> = {
  value: T;
  label: string;
  description: string;
};

const onboardingThemeSchema = z.enum([
  "work_study",
  "daily_life",
  "travel",
  "opinions",
  "messages",
  "ielts",
]);

export const onboardingProfileInputSchema = z.object({
  goal: z
    .enum(["speak_naturally", "write_clearly", "reduce_grammar_mistakes"])
    .nullable(),
  timeCommitment: z.enum(["light", "steady", "immersive"]).nullable(),
  confidence: z.enum(["supported", "steady", "stretch"]).nullable(),
  ieltsIntent: z.boolean(),
  frustration: z
    .enum([
      "articles_prepositions",
      "repetitive_sentences",
      "combining_ideas",
      "freezing_under_pressure",
    ])
    .nullable(),
  themes: z.array(onboardingThemeSchema).max(3),
  completionState: z.enum(["draft", "completed", "skipped"]),
});

export const onboardingProfileSchema = onboardingProfileInputSchema.extend({
  updatedAt: z.string().nullable(),
});

export const onboardingGoalOptions: Choice<OnboardingGoal>[] = [
  {
    value: "speak_naturally",
    label: "Speak with more ease",
    description: "Get faster at turning ideas into spoken English that feels natural.",
  },
  {
    value: "write_clearly",
    label: "Write more clearly",
    description: "Make messages and short writing sound steadier and easier to trust.",
  },
  {
    value: "reduce_grammar_mistakes",
    label: "Catch repeat mistakes",
    description: "Spend more time repairing the slips that keep showing up.",
  },
];

export const onboardingTimeOptions: Choice<OnboardingTimeCommitment>[] = [
  {
    value: "light",
    label: "10 minutes, 3 times a week",
    description: "A light rhythm that keeps progress moving without adding pressure.",
  },
  {
    value: "steady",
    label: "20 minutes, 4 times a week",
    description: "A balanced weekly rhythm for practice, repair, and review.",
  },
  {
    value: "immersive",
    label: "30+ minutes, 5 times a week",
    description: "A stronger pace with more volume, more review, and more stretch.",
  },
];

export const onboardingConfidenceOptions: Choice<OnboardingConfidence>[] = [
  {
    value: "supported",
    label: "Coach me closely",
    description: "Start with clearer guidance and a gentler first week.",
  },
  {
    value: "steady",
    label: "Give me a balanced push",
    description: "Mix correction with moderate challenge from the start.",
  },
  {
    value: "stretch",
    label: "Challenge me",
    description: "Use harder prompts and less hand-holding from the beginning.",
  },
];

export const onboardingFrustrationOptions: Choice<OnboardingFrustration>[] = [
  {
    value: "articles_prepositions",
    label: "Small grammar slips",
    description: "Articles and prepositions still trip up otherwise good sentences.",
  },
  {
    value: "repetitive_sentences",
    label: "Repetitive sentence shapes",
    description: "The meaning is there, but the sentences still sound repetitive.",
  },
  {
    value: "combining_ideas",
    label: "Long sentences fall apart",
    description: "Connecting ideas smoothly still feels unstable under pressure.",
  },
  {
    value: "freezing_under_pressure",
    label: "I freeze under pressure",
    description: "You know the rule until timing and confidence start to matter.",
  },
];

export const onboardingThemeOptions: Choice<OnboardingTheme>[] = [
  {
    value: "work_study",
    label: "Work and study",
    description: "Meetings, presentations, assignments, and interviews.",
  },
  {
    value: "daily_life",
    label: "Daily life",
    description: "Routines, plans, and everyday conversations.",
  },
  {
    value: "travel",
    label: "Travel",
    description: "Booking, asking for help, and handling practical problems.",
  },
  {
    value: "opinions",
    label: "Opinions",
    description: "Giving reasons, reacting, and defending a point of view.",
  },
  {
    value: "messages",
    label: "Messages",
    description: "Email, DMs, and short writing with the right tone.",
  },
  {
    value: "ielts",
    label: "IELTS style",
    description: "Task-style prompts with more formal control.",
  },
];

export const onboardingStageLabels = ["Warm-up", "Lane", "Rhythm"] as const;

export function createInitialOnboardingProfile(): OnboardingProfile {
  return {
    goal: null,
    timeCommitment: null,
    confidence: null,
    ieltsIntent: false,
    frustration: null,
    themes: [],
    completionState: "draft",
    updatedAt: null,
  };
}

function dedupeThemes(themes: OnboardingTheme[]) {
  return Array.from(new Set(themes)).slice(0, 3);
}

export function normalizeOnboardingProfile(
  value: Partial<OnboardingProfileInput> | null | undefined,
): OnboardingProfileInput {
  const base = createInitialOnboardingProfile();
  const candidate = {
    ...base,
    ...value,
    themes: Array.isArray(value?.themes)
      ? dedupeThemes(
          value.themes.filter((theme): theme is OnboardingTheme =>
            onboardingThemeSchema.safeParse(theme).success,
          ),
        )
      : [],
  };

  return onboardingProfileInputSchema.parse(candidate);
}

export function hydrateOnboardingProfile(
  value: Partial<OnboardingProfile> | null | undefined,
): OnboardingProfile {
  const normalized = normalizeOnboardingProfile(value);

  return onboardingProfileSchema.parse({
    ...normalized,
    updatedAt:
      typeof value?.updatedAt === "string" || value?.updatedAt === null
        ? value.updatedAt
        : null,
  });
}

export function parseOnboardingProfile(raw: string | null): OnboardingProfile | null {
  if (!raw) {
    return null;
  }

  try {
    return hydrateOnboardingProfile(JSON.parse(raw) as Partial<OnboardingProfile>);
  } catch {
    return null;
  }
}

export function getOnboardingStorageKey(viewerId: string) {
  return `${ONBOARDING_STORAGE_NAMESPACE}:${viewerId}`;
}

export function writeStoredOnboardingProfile(
  storageKey: string,
  profile: OnboardingProfileInput,
) {
  const nextProfile = hydrateOnboardingProfile({
    ...profile,
    updatedAt: new Date().toISOString(),
  });

  window.localStorage.setItem(storageKey, JSON.stringify(nextProfile));
  window.dispatchEvent(
    new CustomEvent<string>(ONBOARDING_STORAGE_EVENT, { detail: storageKey }),
  );

  return nextProfile;
}

export function clearStoredOnboardingProfile(storageKey: string) {
  window.localStorage.removeItem(storageKey);
  window.dispatchEvent(
    new CustomEvent<string>(ONBOARDING_STORAGE_EVENT, { detail: storageKey }),
  );
}

export function readStoredOnboardingProfile(storageKey: string) {
  return parseOnboardingProfile(window.localStorage.getItem(storageKey));
}

export function getSuggestedStage(profile: OnboardingProfile | null) {
  if (!profile) {
    return 0;
  }

  if (!profile.goal && !profile.confidence && !profile.timeCommitment) {
    return 0;
  }

  if (!profile.goal || !profile.confidence) {
    return 1;
  }

  return 2;
}

function getChoiceLabel<T extends string>(options: Choice<T>[], value: T | null) {
  return options.find((option) => option.value === value)?.label ?? null;
}

export function summarizeOnboardingProfile(profile: OnboardingProfile) {
  const selectedThemes = onboardingThemeOptions
    .filter((option) => profile.themes.includes(option.value))
    .map((option) => option.label);

  return {
    goalLabel:
      getChoiceLabel(onboardingGoalOptions, profile.goal) ??
      "No training lane chosen yet",
    timeLabel:
      getChoiceLabel(onboardingTimeOptions, profile.timeCommitment) ??
      "No weekly rhythm chosen yet",
    confidenceLabel:
      getChoiceLabel(onboardingConfidenceOptions, profile.confidence) ??
      "No support style chosen yet",
    frustrationLabel:
      getChoiceLabel(onboardingFrustrationOptions, profile.frustration) ??
      "No pressure point chosen yet",
    themeLabels: selectedThemes,
  };
}
