import { getStructureUnit } from "@/lib/catalog";
import type {
  LevelBand,
  LearningMode,
  VocabularyItemProgress,
  VocabularyItemState,
  VocabularyTargetItem,
} from "@/lib/types";
import type { PracticeBlueprint } from "@/lib/data/practice-bank";
import { tokenize } from "@/lib/utils";

const REVIEW_PROMPT_PREFIX = "[vocab-card:";

const vocabularyTargetBank: Record<string, VocabularyTargetItem[]> = {
  collocations: [
    {
      itemKey: "make-progress",
      label: "make progress",
      kind: "collocation",
      gloss: "use this chunk when improvement is steady and measurable",
      register: "neutral",
      naturalPairings: ["make steady progress", "make real progress"],
      goodExample: "I am making steady progress with my speaking practice.",
      awkwardExample: "I am doing steady progress with my speaking practice.",
      commonTrap: "Do not replace make with a literal verb like do or take.",
    },
    {
      itemKey: "pay-attention",
      label: "pay attention",
      kind: "collocation",
      gloss: "use this when focus or care matters",
      register: "neutral",
      naturalPairings: ["pay close attention", "pay attention to"],
      goodExample: "You need to pay attention to the final paragraph.",
      awkwardExample: "You need to give attention to the final paragraph.",
      commonTrap: "Attention usually takes pay, not give or do.",
    },
    {
      itemKey: "meet-deadline",
      label: "meet a deadline",
      kind: "collocation",
      gloss: "use this for finishing work on time",
      register: "neutral",
      naturalPairings: ["meet the deadline", "meet a tight deadline"],
      goodExample: "We still need to meet the deadline by Friday.",
      awkwardExample: "We still need to catch the deadline by Friday.",
      commonTrap: "Deadline normally collocates with meet, not catch or reach.",
    },
  ],
  "opinion-verbs": [
    {
      itemKey: "suggests",
      label: "suggests",
      kind: "word",
      gloss: "use this when evidence points in a direction without proving it",
      register: "academic",
      naturalPairings: ["the evidence suggests", "the result suggests"],
      goodExample: "The evidence suggests a more limited effect.",
      awkwardExample: "The evidence proves a more limited effect.",
      commonTrap: "Do not use prove when the evidence is still limited.",
    },
    {
      itemKey: "would-argue-that",
      label: "would argue that",
      kind: "phrase_frame",
      gloss: "use this to present a strong opinion with some control",
      register: "formal",
      naturalPairings: ["I would argue that", "we could argue that"],
      goodExample: "I would argue that short daily practice matters more.",
      awkwardExample: "I think that short daily practice matters more.",
      commonTrap: "Do not fall back on think when the task wants a stronger but still controlled opinion verb.",
    },
    {
      itemKey: "appears-to",
      label: "appears to",
      kind: "phrase_frame",
      gloss: "use this to describe a pattern that looks true but stays cautious",
      register: "academic",
      naturalPairings: ["appears to challenge", "appears to show"],
      goodExample: "This result appears to challenge the earlier assumption.",
      awkwardExample: "This result says against the earlier assumption.",
      commonTrap: "Do not build literal phrases like say against when English already has a natural frame.",
    },
  ],
  "word-families": [
    {
      itemKey: "improve-family",
      label: "improve / improvement / improved",
      kind: "word_family",
      gloss: "switch between action, result, and adjective form without losing the core meaning",
      register: "neutral",
      naturalPairings: ["clear improvement", "improved version"],
      goodExample: "The improvement in my writing is clear.",
      awkwardExample: "The improve in my writing is clear.",
      commonTrap: "This sentence slot needs a noun, not the verb form.",
      familyForms: ["improve", "improvement", "improved"],
      substitutions: ["improve steadily", "show improvement"],
    },
    {
      itemKey: "analysis-family",
      label: "analyze / analysis / analytical",
      kind: "word_family",
      gloss: "choose the form that fits report, process, or description",
      register: "academic",
      naturalPairings: ["analytical view", "careful analysis"],
      goodExample: "The report offers an analytical view of the problem.",
      awkwardExample: "The report offers an analysis view of the problem.",
      commonTrap: "A noun cannot always replace an adjective just because the root meaning is similar.",
      familyForms: ["analyze", "analysis", "analytical"],
      substitutions: ["carry out an analysis", "analytical approach"],
    },
    {
      itemKey: "decision-family",
      label: "decide / decision / decisive",
      kind: "word_family",
      gloss: "use the right family form for action, result, or quality",
      register: "formal",
      naturalPairings: ["reach a decision", "decisive action"],
      goodExample: "The team finally reached a decision.",
      awkwardExample: "The team finally reached a decide.",
      commonTrap: "After reach, this slot needs the noun form decision.",
      familyForms: ["decide", "decision", "decisive"],
      substitutions: ["make a decision", "take decisive action"],
    },
  ],
  "work-study-vocabulary": [
    {
      itemKey: "revise-draft",
      label: "revise a draft",
      kind: "collocation",
      gloss: "use this when you improve a text before the final version",
      register: "neutral",
      naturalPairings: ["revise the draft", "revise a first draft"],
      goodExample: "I need to revise the draft before class tomorrow.",
      awkwardExample: "I need to correct the draft before class tomorrow.",
      commonTrap: "Correct is too narrow here; revise covers improving the whole draft.",
    },
    {
      itemKey: "meet-deadline-work",
      label: "meet a deadline",
      kind: "collocation",
      gloss: "use this for delivering work on time",
      register: "neutral",
      naturalPairings: ["meet the deadline", "meet a tight deadline"],
      goodExample: "We still need to meet the deadline this week.",
      awkwardExample: "We still need to catch the deadline this week.",
      commonTrap: "Deadline takes meet, not catch.",
    },
    {
      itemKey: "fall-behind",
      label: "fall behind on the schedule",
      kind: "phrase_frame",
      gloss: "use this when work is moving too slowly and the plan slips",
      register: "neutral",
      naturalPairings: ["fall behind on the schedule", "fall behind with the work"],
      goodExample: "We started to fall behind on the schedule after the second week.",
      awkwardExample: "We started to stay back on the schedule after the second week.",
      commonTrap: "This idea is usually expressed with fall behind, not stay back.",
    },
  ],
  "academic-precision": [
    {
      itemKey: "limited-effect",
      label: "limited effect",
      kind: "collocation",
      gloss: "use this when the result exists but is smaller than expected",
      register: "academic",
      naturalPairings: ["a limited effect", "only a limited effect"],
      goodExample: "The intervention had a limited effect on the final outcome.",
      awkwardExample: "The intervention had a small effect on the final outcome.",
      commonTrap: "Small is understandable, but limited effect sounds more analytical here.",
    },
    {
      itemKey: "indicate-that",
      label: "indicate that",
      kind: "phrase_frame",
      gloss: "use this when data or results point to a conclusion in a formal register",
      register: "academic",
      naturalPairings: ["the data indicate that", "the findings indicate that"],
      goodExample: "The findings indicate that the shift was gradual.",
      awkwardExample: "The findings show that the shift was gradual.",
      commonTrap: "Show is fine, but indicate is often a better fit in analytical writing.",
    },
    {
      itemKey: "challenge-assumption",
      label: "challenge an assumption",
      kind: "collocation",
      gloss: "use this when new evidence questions an accepted idea",
      register: "academic",
      naturalPairings: ["challenge an assumption", "challenge the earlier assumption"],
      goodExample: "The result appears to challenge the earlier assumption.",
      awkwardExample: "The result says against the earlier assumption.",
      commonTrap: "Avoid literal wording when a more exact academic collocation already exists.",
    },
  ],
};

function uniqueTokens(value: string) {
  return tokenize(value).filter((token, index, list) => list.indexOf(token) === index);
}

function cleanRequiredTokens(item: VocabularyTargetItem) {
  const labelTokens = uniqueTokens(item.label).filter(
    (token) => !["a", "an", "the", "that", "to"].includes(token),
  );
  const pairingTokens = uniqueTokens(item.naturalPairings[0] ?? "").filter(
    (token) => !["a", "an", "the", "that", "to"].includes(token),
  );

  return [...new Set([...labelTokens, ...pairingTokens])].slice(0, 4);
}

function formatReviewPromptBody(item: VocabularyTargetItem) {
  if (item.kind === "word_family") {
    return `Use the correct form from "${item.label}" in one sentence so it sounds natural in context.`;
  }

  return `Use "${item.label}" naturally in one sentence.`;
}

function topicPairSentence(topicKey: string, items: VocabularyTargetItem[]) {
  const itemByKey = new Map(items.map((item) => [item.itemKey, item]));

  switch (topicKey) {
    case "collocations":
      if (itemByKey.has("pay-attention") && itemByKey.has("meet-deadline")) {
        return "We need to pay attention to the timeline if we want to meet the deadline.";
      }
      return "We need to pay attention to the weak points if we want to make progress quickly.";
    case "opinion-verbs":
      if (itemByKey.has("would-argue-that") && itemByKey.has("suggests")) {
        return "I would argue that the evidence suggests a more limited effect.";
      }
      return "The result appears to challenge the earlier assumption, and the evidence suggests a more limited effect.";
    case "word-families":
      if (itemByKey.has("improve-family") && itemByKey.has("analysis-family")) {
        return "The improvement was obvious because the report became more analytical.";
      }
      return "The more analytical report made the final decision easier.";
    case "work-study-vocabulary":
      if (itemByKey.has("revise-draft") && itemByKey.has("meet-deadline-work")) {
        return "We need to revise the draft if we want to meet the deadline this week.";
      }
      return "We started to fall behind on the schedule because nobody revised the draft early enough.";
    case "academic-precision":
      if (itemByKey.has("indicate-that") && itemByKey.has("limited-effect")) {
        return "The findings indicate that the intervention had a limited effect.";
      }
      return "The latest result appears to challenge the earlier assumption while still indicating a limited effect.";
    default:
      return items.slice(0, 2).map((item) => item.goodExample).join(" ");
  }
}

function topicPersonalSentence(topicKey: string, items: VocabularyTargetItem[]) {
  const itemByKey = new Map(items.map((item) => [item.itemKey, item]));

  switch (topicKey) {
    case "collocations":
      if (itemByKey.has("make-progress")) {
        return "I am trying to make progress by studying a little every day.";
      }
      if (itemByKey.has("pay-attention")) {
        return "I need to pay attention to the final details when I edit my own work.";
      }
      return "I am trying to meet the deadline by planning my week more carefully.";
    case "opinion-verbs":
      if (itemByKey.has("appears-to")) {
        return "This pattern appears to show why short daily practice works better for me.";
      }
      if (itemByKey.has("would-argue-that")) {
        return "I would argue that short daily practice keeps my English more active.";
      }
      return "The evidence suggests that shorter sessions fit my routine better.";
    case "word-families":
      return "The improved version of my paragraph sounds much clearer now.";
    case "work-study-vocabulary":
      if (itemByKey.has("fall-behind")) {
        return "I started to fall behind on the schedule when I stopped planning my week carefully.";
      }
      if (itemByKey.has("revise-draft")) {
        return "I still need to revise the draft before I send it to my tutor.";
      }
      return "I want to meet the deadline without rushing the final version.";
    case "academic-precision":
      if (itemByKey.has("challenge-assumption")) {
        return "The latest result may challenge an assumption I used to repeat too quickly.";
      }
      if (itemByKey.has("indicate-that")) {
        return "The latest data indicate that my progress is steady rather than dramatic.";
      }
      return "The change had only a limited effect on how confident I felt.";
    default:
      return items[0]?.goodExample ?? "";
  }
}

function lessonVerb(learningMode: LearningMode) {
  if (learningMode === "challenge") {
    return "Use";
  }

  if (learningMode === "review") {
    return "Bring back";
  }

  return "Use";
}

function stateRank(state?: VocabularyItemState) {
  switch (state) {
    case "strong":
      return 5;
    case "stable":
      return 4;
    case "usable":
      return 3;
    case "practising":
      return 2;
    case "new":
    default:
      return 1;
  }
}

function nextCheckLabel(item: VocabularyTargetItem) {
  if (item.kind === "word_family") {
    return "correct family form";
  }

  if (item.register === "formal" || item.register === "academic") {
    return "formal/academic fit";
  }

  if (item.kind === "collocation") {
    return "natural pairing";
  }

  return "reusable in your own sentence";
}

function confidenceLabel(progress?: Pick<
  VocabularyItemProgress,
  "state" | "timesUsed" | "reviewWins" | "independentUseWins"
>) {
  if (!progress || progress.timesUsed === 0) {
    return "Seen but not proven";
  }

  switch (progress.state) {
    case "strong":
      return "Reliable in real use";
    case "stable":
      return progress.reviewWins > 0 ? "Stable in review" : "Nearly stable";
    case "usable":
      return progress.independentUseWins > 0 ? "Works in open use" : "Works with support";
    case "practising":
      return "Usage not proven";
    case "new":
    default:
      return "Seen but not proven";
  }
}

function nextProofNeeded(
  item: VocabularyTargetItem,
  progress?: Pick<
    VocabularyItemProgress,
    | "timesUsed"
    | "recognitionWins"
    | "supportedUseWins"
    | "independentUseWins"
    | "reviewWins"
    | "reviewDue"
  >,
) {
  if (!progress || progress.timesUsed === 0) {
    return item.kind === "word_family"
      ? "Recognize the right family form first."
      : "Recognize the natural version first.";
  }

  if (progress.recognitionWins === 0) {
    return item.kind === "word_family"
      ? "Pick the right family form under light pressure."
      : "Recognize the more natural option first.";
  }

  if (progress.supportedUseWins === 0) {
    return item.kind === "word_family"
      ? "Use the right family form in one supported sentence."
      : `Use "${item.label}" in one supported sentence.`;
  }

  if (progress.independentUseWins === 0) {
    return item.kind === "word_family"
      ? "Use the right family form without support in one new sentence."
      : "Use this without support in one new sentence.";
  }

  if (progress.reviewDue || progress.reviewWins === 0) {
    return "Survive one review.";
  }

  if (item.kind === "word_family") {
    return "Switch forms cleanly in a harder sentence.";
  }

  if (item.register === "formal" || item.register === "academic") {
    return "Keep the register clean in harder contexts.";
  }

  return "Reuse it naturally in a harder sentence.";
}

function teachingWeight(progress?: Pick<VocabularyItemProgress, "state" | "timesUsed">) {
  if (!progress || progress.timesUsed === 0 || progress.state === "new") {
    return "high" as const;
  }

  if (progress.state === "practising" || progress.state === "usable") {
    return "medium" as const;
  }

  return "low" as const;
}

function strengthenRecognitionPrompt(item: VocabularyTargetItem) {
  if (item.kind === "word_family") {
    return `Choose the sentence that uses the right form from "${item.label}" more naturally, then rewrite only the better one exactly.`;
  }

  return `Choose the sentence that uses "${item.label}" more naturally in real use, then rewrite only the better one exactly.`;
}

function enrichTargetItems(
  items: VocabularyTargetItem[],
  progressMap: Map<string, VocabularyItemProgress>,
) {
  return items.map((item) => {
    const progress = progressMap.get(item.itemKey);
    const currentEvidenceLabel = progress?.stateLabel ?? "New";
    return {
      ...item,
      currentEvidenceState: progress?.state ?? "new",
      currentEvidenceLabel,
      confidenceLabel: confidenceLabel(progress),
      nextProofNeeded: nextProofNeeded(item, progress),
      nextCheck: nextCheckLabel(item),
      teachingWeight: teachingWeight(progress),
    };
  });
}

function buildVocabularyBlueprint(params: {
  topicKey: string;
  targetLevel: LevelBand;
  supportObjective: string;
  prompt: string;
  promptType: PracticeBlueprint["promptType"];
  interactionType?: PracticeBlueprint["interactionType"];
  choiceOptions?: PracticeBlueprint["choiceOptions"];
  correctChoiceId?: PracticeBlueprint["correctChoiceId"];
  choiceFeedbackByOption?: PracticeBlueprint["choiceFeedbackByOption"];
  followUpPrompt?: PracticeBlueprint["followUpPrompt"];
  followUpPromptType?: PracticeBlueprint["followUpPromptType"];
  followUpMode?: PracticeBlueprint["followUpMode"];
  followUpAcceptedAnswer?: PracticeBlueprint["followUpAcceptedAnswer"];
  followUpWhyItWorks?: PracticeBlueprint["followUpWhyItWorks"];
  followUpHint1?: PracticeBlueprint["followUpHint1"];
  followUpHint2?: PracticeBlueprint["followUpHint2"];
  followUpNaturalRewrite?: PracticeBlueprint["followUpNaturalRewrite"];
  followUpLevelUpVariants?: PracticeBlueprint["followUpLevelUpVariants"];
  followUpEvaluationRubric?: PracticeBlueprint["followUpEvaluationRubric"];
  acceptedAnswer: string;
  whyItWorks: string;
  hint1: string;
  hint2: string;
  naturalRewrite: string;
  levelUpVariants: PracticeBlueprint["levelUpVariants"];
  targetItems: VocabularyTargetItem[];
  focusTargetItem: VocabularyTargetItem;
  secondaryTargetItems?: VocabularyTargetItem[];
  errorTag: string;
  commonSlip: string;
  preferredPhrases?: string[];
}) {
  const secondaryTargetItems = params.secondaryTargetItems ?? [];

  return {
    prompt: params.prompt,
    promptType: params.promptType,
    interactionType: params.interactionType,
    choiceOptions: params.choiceOptions,
    correctChoiceId: params.correctChoiceId,
    choiceFeedbackByOption: params.choiceFeedbackByOption,
    followUpPrompt: params.followUpPrompt,
    followUpPromptType: params.followUpPromptType,
    followUpMode: params.followUpMode,
    followUpAcceptedAnswer: params.followUpAcceptedAnswer,
    followUpWhyItWorks: params.followUpWhyItWorks,
    followUpHint1: params.followUpHint1,
    followUpHint2: params.followUpHint2,
    followUpNaturalRewrite: params.followUpNaturalRewrite,
    followUpLevelUpVariants: params.followUpLevelUpVariants,
    followUpEvaluationRubric: params.followUpEvaluationRubric,
    structureKey: params.topicKey,
    levelBand: params.targetLevel,
    supportObjective: params.supportObjective,
    topic: "vocabulary in use",
    memoryAnchor: params.promptType === "memory_anchor",
    acceptedAnswer: params.acceptedAnswer,
    whyItWorks: params.whyItWorks,
    hint1: params.hint1,
    hint2: params.hint2,
    naturalRewrite: params.naturalRewrite,
    levelUpVariants: params.levelUpVariants,
    targetItems: params.targetItems,
    targetItemKeys: [
      params.focusTargetItem.itemKey,
      ...secondaryTargetItems.map((item) => item.itemKey),
    ],
    focusTargetItemKey: params.focusTargetItem.itemKey,
    focusTargetItemLabel: params.focusTargetItem.label,
    evaluationRubric: {
      requiredTokens: [
        ...cleanRequiredTokens(params.focusTargetItem),
        ...secondaryTargetItems.flatMap((item) => cleanRequiredTokens(item).slice(0, 2)),
      ].filter((token, index, list) => list.indexOf(token) === index),
      preferredPhrases: params.preferredPhrases,
      errorTag: params.errorTag,
      commonSlip: params.commonSlip,
      severity: "medium",
    },
  } satisfies PracticeBlueprint;
}

function reorderItems(items: VocabularyTargetItem[], cycle: number) {
  if (!items.length) {
    return [];
  }

  const offset = cycle % items.length;
  return Array.from({ length: items.length }, (_, index) => items[(offset + index) % items.length]);
}

function prioritizeDueItems(items: VocabularyTargetItem[], dueItemKeys: string[]) {
  if (!dueItemKeys.length) {
    return items;
  }

  const keyed = new Map(items.map((item) => [item.itemKey, item]));
  const prioritised = dueItemKeys
    .map((key) => keyed.get(key))
    .filter((item): item is VocabularyTargetItem => Boolean(item));
  const seen = new Set(prioritised.map((item) => item.itemKey));

  return [
    ...prioritised,
    ...items.filter((item) => !seen.has(item.itemKey)),
  ];
}

export function getVocabularyTargetItems(topicKey: string) {
  return vocabularyTargetBank[topicKey] ?? [];
}

export function formatVocabularyReviewPrompt(item: VocabularyTargetItem, prompt?: string) {
  return `${REVIEW_PROMPT_PREFIX}${item.itemKey}|${item.label}] ${prompt ?? formatReviewPromptBody(item)}`;
}

export function parseVocabularyReviewPrompt(prompt: string) {
  const match = prompt.match(/^\[vocab-card:([^|\]]+)\|([^\]]+)\]\s*(.*)$/);

  if (!match) {
    return null;
  }

  return {
    itemKey: match[1],
    label: match[2],
    prompt: match[3] || formatReviewPromptBody({
      itemKey: match[1],
      label: match[2],
      kind: "word",
      gloss: "",
      register: "neutral",
      naturalPairings: [],
      goodExample: "",
      awkwardExample: "",
      commonTrap: "",
    }),
  };
}

export function buildVocabularyLessonBlueprints(params: {
  topicKey: string;
  learningMode: LearningMode;
  targetLevel: LevelBand;
  cycle: number;
  dueItemKeys?: string[];
  itemProgress?: VocabularyItemProgress[];
}) {
  const unit = getStructureUnit(params.topicKey);
  const supportObjective = unit?.supportObjective ?? "Use new vocabulary with more control.";
  const progressMap = new Map(
    (params.itemProgress ?? []).map((item) => [item.itemKey, item]),
  );
  const items = prioritizeDueItems(
    reorderItems(getVocabularyTargetItems(params.topicKey), params.cycle),
    params.dueItemKeys ?? [],
  )
    .sort((left, right) => {
      const dueLeft = (params.dueItemKeys ?? []).includes(left.itemKey) ? 1 : 0;
      const dueRight = (params.dueItemKeys ?? []).includes(right.itemKey) ? 1 : 0;
      if (dueLeft !== dueRight) {
        return dueRight - dueLeft;
      }

      return stateRank(progressMap.get(left.itemKey)?.state) - stateRank(progressMap.get(right.itemKey)?.state);
    })
    .slice(0, 3);

  if (!unit || items.length < 3) {
    return [];
  }

  const [first, second, third] = items;
  const enrichedItems = enrichTargetItems(items, progressMap);
  const firstProgress = progressMap.get(first.itemKey);
  const secondProgress = progressMap.get(second.itemKey);
  const thirdProgress = progressMap.get(third.itemKey);
  const recognitionNaturalFirst = params.cycle % 2 === 0;
  const optionA = recognitionNaturalFirst ? first.goodExample : first.awkwardExample;
  const optionB = recognitionNaturalFirst ? first.awkwardExample : first.goodExample;
  const correctChoiceId = recognitionNaturalFirst ? "A" : "B";
  const actionVerb = lessonVerb(params.learningMode);
  const allHighEvidence = items.every((item) => stateRank(progressMap.get(item.itemKey)?.state) >= 4);
  const recognitionPrompt =
    stateRank(firstProgress?.state) >= 4
      ? strengthenRecognitionPrompt(first)
      : `Which sentence uses "${first.label}" more naturally?`;
  const secondPrompt =
    stateRank(secondProgress?.state) >= 4
      ? second.kind === "word_family"
        ? `Write one sentence that uses the right form from "${second.label}" and adds a reason, contrast, or result.`
        : `Write one sentence that uses "${second.label}" naturally and adds a reason, contrast, or result.`
      : second.kind === "word_family"
        ? `${actionVerb} the correct form from "${second.label}" in one sentence about study, work, or daily communication.`
        : `${actionVerb} "${second.label}" in one sentence about study, work, or daily communication.`;
  const openPrompt =
    allHighEvidence
      ? `Write one natural sentence that uses both "${first.label}" and "${second.label}" and makes the relationship between them clear.`
      : `Write one sentence that uses both "${first.label}" and "${second.label}" naturally.`;
  const personalPrompt =
    stateRank(thirdProgress?.state) >= 4
      ? third.kind === "word_family"
        ? `Write one sentence from your own experience using the right form from "${third.label}" and one extra detail that proves the context.`
        : `Write one sentence from your own experience using "${third.label}" naturally and one extra detail that makes it sound real.`
      : params.learningMode === "challenge"
        ? third.kind === "word_family"
          ? `Write one sentence from your own experience using the right form from "${third.label}" without copying the example wording.`
          : `Write one sentence from your own experience using "${third.label}" without copying the example wording.`
        : third.kind === "word_family"
          ? `Write one sentence from your own study, work, or daily life using the right form from "${third.label}".`
          : `Write one sentence from your own study, work, or daily life using "${third.label}" naturally.`;

  const recognition = buildVocabularyBlueprint({
    topicKey: params.topicKey,
    targetLevel: params.targetLevel,
    supportObjective,
    prompt: recognitionPrompt,
    promptType: "rewrite",
    interactionType: "hybrid_choice_text",
    choiceOptions: [
      { id: "A", text: optionA },
      { id: "B", text: optionB },
    ],
    correctChoiceId,
    choiceFeedbackByOption: {
      [correctChoiceId === "A" ? "B" : "A"]: {
        whatWentWrong:
          first.kind === "word_family"
            ? "This sentence keeps the wrong family form in the key sentence slot."
            : `This version still sounds less natural with "${first.label}".`,
        why:
          first.kind === "word_family"
            ? first.commonTrap
            : `The target item needs a more natural pairing like "${first.naturalPairings[0]}".`,
        whatFitsInstead: `Choose the version that lands "${first.label}" cleanly before you rewrite it.`,
      },
    },
    followUpPrompt: "Rewrite only the better sentence exactly before you continue.",
    followUpPromptType: "rewrite",
    followUpMode: "exact_rewrite",
    followUpAcceptedAnswer: first.goodExample,
    followUpWhyItWorks: `The sentence keeps ${first.label} in the cleaner, more natural slot.`,
    followUpHint1: `Keep "${first.label}" in the natural version and rewrite only that sentence.`,
    followUpHint2: `Use the cleaner wording that matches a pairing like "${first.naturalPairings[0]}".`,
    followUpNaturalRewrite: first.goodExample,
    followUpLevelUpVariants: [
      { level: params.targetLevel, text: first.goodExample },
      { level: "B2", text: first.goodExample },
      { level: "C1", text: first.goodExample },
    ],
    followUpEvaluationRubric: {
      requiredTokens: cleanRequiredTokens(first),
      preferredPhrases: first.naturalPairings.slice(0, 1),
      errorTag: "vocabulary_recognition",
      commonSlip: `You picked wording that keeps ${first.label} sounding less natural.`,
      severity: "medium",
    },
    acceptedAnswer: first.goodExample,
    whyItWorks: `The better option uses ${first.label} in a more natural way and avoids ${first.commonTrap.toLowerCase()}.`,
    hint1:
      stateRank(firstProgress?.state) >= 4
        ? `Look for the version that lands ${first.label} more cleanly in context.`
        : `One option already sounds natural with "${first.label}". Rewrite the better one exactly first.`,
    hint2:
      stateRank(firstProgress?.state) >= 4
        ? `This check is about precision, not just recognition. Match a natural pairing such as "${first.naturalPairings[0]}".`
        : `Look for the sentence that matches a natural pairing such as "${first.naturalPairings[0]}".`,
    naturalRewrite: first.goodExample,
    levelUpVariants: [
      { level: params.targetLevel, text: first.goodExample },
      { level: "B2", text: first.goodExample },
      { level: "C1", text: first.goodExample },
    ],
    targetItems: enrichedItems,
    focusTargetItem: first,
    errorTag: "vocabulary_recognition",
    commonSlip: `You picked wording that keeps ${first.label} sounding less natural.`,
    preferredPhrases: first.naturalPairings.slice(0, 1),
  });

  const controlled = buildVocabularyBlueprint({
    topicKey: params.topicKey,
    targetLevel: params.targetLevel,
    supportObjective,
    prompt: secondPrompt,
    promptType:
      params.learningMode === "challenge" || stateRank(secondProgress?.state) >= 4
        ? "free_production"
        : "guided_generation",
    acceptedAnswer: second.goodExample,
    whyItWorks: `The sentence uses ${second.label} in a natural slot and keeps the register ${second.register}.`,
    hint1:
      stateRank(secondProgress?.state) >= 4
        ? `Use "${second.label}" naturally, then add one small extension so it proves real control.`
        : `Keep "${second.label}" visible in the sentence and let the rest stay simple.`,
    hint2:
      stateRank(secondProgress?.state) >= 4
        ? `Do not stop at the target item. Show why it fits the sentence.`
        : `A natural pairing here would sound like "${second.naturalPairings[0]}".`,
    naturalRewrite: second.goodExample,
    levelUpVariants: [
      { level: params.targetLevel, text: second.goodExample },
      { level: "B2", text: second.goodExample },
      { level: "C1", text: second.goodExample },
    ],
    targetItems: enrichedItems,
    focusTargetItem: second,
    errorTag: "vocabulary_use",
    commonSlip: `The target item is present, but the wording around ${second.label} still feels off.`,
    preferredPhrases: second.naturalPairings.slice(0, 2),
  });

  const repair = buildVocabularyBlueprint({
    topicKey: params.topicKey,
    targetLevel: params.targetLevel,
    supportObjective,
    prompt: `Repair the awkward wording so "${third.label}" sounds natural: ${third.awkwardExample}`,
    promptType: "error_correction",
    acceptedAnswer: third.goodExample,
    whyItWorks: `The sentence keeps the same idea but replaces the awkward phrase with a natural use of ${third.label}.`,
    hint1: `Keep the idea, but fix the part that blocks "${third.label}" from sounding natural.`,
    hint2: `Aim for a pairing such as "${third.naturalPairings[0]}".`,
    naturalRewrite: third.goodExample,
    levelUpVariants: [
      { level: params.targetLevel, text: third.goodExample },
      { level: "B2", text: third.goodExample },
      { level: "C1", text: third.goodExample },
    ],
    targetItems: enrichedItems,
    focusTargetItem: third,
    errorTag: "vocabulary_repair",
    commonSlip: `You kept the idea, but the collocation or phrase around ${third.label} is still awkward.`,
    preferredPhrases: third.naturalPairings.slice(0, 2),
  });

  const openSentence = topicPairSentence(params.topicKey, items);
  const open = buildVocabularyBlueprint({
    topicKey: params.topicKey,
    targetLevel: params.targetLevel,
    supportObjective,
    prompt: openPrompt,
    promptType: params.learningMode === "review" && !allHighEvidence ? "guided_generation" : "free_production",
    acceptedAnswer: openSentence,
    whyItWorks: `The sentence keeps both target items in natural positions instead of forcing them together mechanically.`,
    hint1: `Keep one idea as the main claim and let the second target item support it naturally.`,
    hint2: `Do not write two separate sentences. Keep both target items inside one clean sentence.`,
    naturalRewrite: openSentence,
    levelUpVariants: [
      { level: params.targetLevel, text: openSentence },
      { level: "B2", text: openSentence },
      { level: "C1", text: openSentence },
    ],
    targetItems: enrichedItems,
    focusTargetItem: first,
    secondaryTargetItems: [second],
    errorTag: "vocabulary_combination",
    commonSlip: `The sentence still does not combine ${first.label} and ${second.label} in a natural way.`,
    preferredPhrases: [
      ...first.naturalPairings.slice(0, 1),
      ...second.naturalPairings.slice(0, 1),
    ],
  });

  const personalSentence = topicPersonalSentence(params.topicKey, items);
  const personal = buildVocabularyBlueprint({
    topicKey: params.topicKey,
    targetLevel: params.targetLevel,
    supportObjective,
    prompt: personalPrompt,
    promptType: "memory_anchor",
    acceptedAnswer: personalSentence,
    whyItWorks: `The target item stays usable in a personal sentence instead of only inside a model example.`,
    hint1:
      stateRank(thirdProgress?.state) >= 4
        ? `Make the sentence personal, but prove that "${third.label}" still sounds natural without support.`
        : `Keep the sentence personal, but make sure "${third.label}" still sounds natural in context.`,
    hint2:
      stateRank(thirdProgress?.state) >= 4
        ? `Add one extra detail that shows the item can survive outside the model example.`
        : `Use the target item first, then add one short detail from your own routine or experience.`,
    naturalRewrite: personalSentence,
    levelUpVariants: [
      { level: params.targetLevel, text: personalSentence },
      { level: "B2", text: personalSentence },
      { level: "C1", text: personalSentence },
    ],
    targetItems: enrichedItems,
    focusTargetItem: third,
    errorTag: "vocabulary_personal_use",
    commonSlip: `The target item is close, but it still does not sound fully usable in a personal sentence.`,
    preferredPhrases: third.naturalPairings.slice(0, 1),
  });

  return [recognition, controlled, repair, open, personal];
}
