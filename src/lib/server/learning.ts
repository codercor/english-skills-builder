import {
  addDays,
  endOfWeek,
  format,
  startOfDay,
  startOfWeek,
  subDays,
} from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  lte,
  sql,
} from "drizzle-orm";
import { rankRecommendationsWithLLM } from "@/lib/ai/service";
import { assessmentQuestions } from "@/lib/data/assessment";
import {
  getPracticeBlueprints,
  type PracticeBlueprint,
} from "@/lib/data/practice-bank";
import {
  getBuilderKinds,
  getBuilderMeta,
  getStructureUnit,
  structureCatalog,
} from "@/lib/catalog";
import { db } from "@/lib/db/client";
import {
  achievements,
  assessmentAttempts,
  bossSessions,
  feedbackEvents,
  leagueMemberships,
  leagueScores,
  leagueWeeks,
  masteryRecords,
  practiceItems,
  practiceSessions,
  profiles,
  progressionDecisions,
  recommendationEvents,
  reviewItems,
  skillProfiles,
  structureCatalog as structureCatalogTable,
  structureCups,
  userResponses,
  users,
  errorEvents,
} from "@/lib/db/schema";
import {
  buildMasteryRecord,
} from "@/lib/engine/mastery";
import { evaluateAssessment, summarizeSession } from "@/lib/engine/evaluator";
import { buildAchievements, buildWeeklyLearningScore } from "@/lib/engine/gamification";
import { buildStrengths, buildGrowthAreas, toUserFacingStage } from "@/lib/engine/profile";
import { buildProgressionDecision } from "@/lib/engine/progression";
import {
  buildCandidateActions,
  buildRecommendationPayload,
} from "@/lib/engine/recommendations";
import type {
  AssessmentResult,
  BuilderKind,
  DashboardSnapshot,
  DecisionLog,
  LeagueEntry,
  LeagueSnapshot,
  LevelBand,
  MasteryRecord,
  OpsSnapshot,
  PracticeSession,
  PromptType,
  ProfileSnapshot,
  ProgressSnapshot,
  RecommendationPayload,
  ReviewItem,
  SkillArea,
  SkillSnapshot,
  UserFacingStage,
  Viewer,
} from "@/lib/types";
import {
  average,
  clamp,
  formatDateShort,
  round,
  titleCase,
} from "@/lib/utils";
import type { OnboardingProfile } from "@/lib/onboarding";
import { getBuildersHubSnapshot } from "@/lib/server/topic-views";

type Db = NonNullable<typeof db>;

const LEVELS: LevelBand[] = ["A2", "B1", "B2", "C1"];

function requireDb(): Db {
  if (!db) {
    throw new Error("Database is not configured.");
  }

  return db;
}

function getLevelRank(level: LevelBand | string | null | undefined) {
  const index = LEVELS.indexOf((level ?? "A2") as LevelBand);
  return index === -1 ? 0 : index;
}

function levelFromScore(score: number): LevelBand {
  if (score >= 0.8) {
    return "C1";
  }

  if (score >= 0.62) {
    return "B2";
  }

  if (score >= 0.42) {
    return "B1";
  }

  return "A2";
}

function mapTimeBudget(value: OnboardingProfile["timeCommitment"]) {
  if (value === "immersive") {
    return "30+ minutes, 5x a week";
  }

  if (value === "steady") {
    return "20 minutes, 4x a week";
  }

  return "10 minutes, 3x a week";
}

function mapGoal(value: OnboardingProfile["goal"]) {
  if (value === "write_clearly") {
    return "Write with more control";
  }

  if (value === "reduce_grammar_mistakes") {
    return "Reduce grammar mistakes";
  }

  return "Speak more naturally";
}

function mapSelfRating(value: OnboardingProfile["confidence"]) {
  if (value === "stretch") {
    return "Push me";
  }

  if (value === "steady") {
    return "I can handle the basics";
  }

  return "I need support";
}

function levelFromProfile(profile: {
  overallLevel?: string | null;
  grammarControl?: string | null;
  vocabularyUsage?: string | null;
  sentenceBuilding?: string | null;
}) {
  return {
    overallLevel: (profile.overallLevel ?? "A2") as LevelBand,
    grammarControl: (profile.grammarControl ?? "A2") as LevelBand,
    vocabularyUsage: (profile.vocabularyUsage ?? "A2") as LevelBand,
    sentenceBuilding: (profile.sentenceBuilding ?? "A2") as LevelBand,
  };
}

function currentWeekWindow(date = new Date()) {
  const startsAt = startOfWeek(date, { weekStartsOn: 1 });
  const endsAt = endOfWeek(date, { weekStartsOn: 1 });

  return { startsAt, endsAt };
}

function currentWeekLabel(date = new Date()) {
  const { startsAt } = currentWeekWindow(date);
  return `Week of ${format(startsAt, "MMMM d")}`;
}

function ensureSentence(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function formatSignedPoints(value: number) {
  const rounded = Math.round(value * 100);
  return `${rounded > 0 ? "+" : ""}${rounded} pts`;
}

function formatAverageHintDelta(value: number) {
  return `${round(value, 1)} fewer hints`;
}

function humanizeStructureKey(structureKey: string) {
  return getStructureUnit(structureKey)?.title ?? titleCase(structureKey);
}

function missionModeLabel(kind: RecommendationPayload["selected"]["kind"]) {
  if (kind === "due_review") {
    return "Review";
  }

  if (kind === "weakness_repair") {
    return "Weakness repair";
  }

  return "Recommended practice";
}

function missionTitle(
  action: RecommendationPayload["selected"],
  unit: ReturnType<typeof getStructureUnit> | undefined,
) {
  if (action.kind === "due_review") {
    return unit
      ? `Bring ${unit.title} back before it fades`
      : "Recover a weak structure before it fades";
  }

  if (unit) {
    return ensureSentence(unit.description);
  }

  return "Practice the next move that strengthens your English.";
}

function missionSuccessDefinition(
  action: RecommendationPayload["selected"],
  unit: ReturnType<typeof getStructureUnit> | undefined,
) {
  const structureTitle = unit?.title ?? "this focus";

  if (action.kind === "due_review") {
    return `Clear 5 review prompts so ${structureTitle} stays available when you need it.`;
  }

  if (action.kind === "weakness_repair") {
    return `Finish 5 prompts with fewer hints and fewer repeated slips in ${structureTitle}.`;
  }

  if (action.kind === "new_practice") {
    return `Keep ${structureTitle} stable across 5 more open prompts.`;
  }

  return `Use 5 prompts to build cleaner control in ${structureTitle}.`;
}

function missionNote(
  action: RecommendationPayload["selected"],
  unit: ReturnType<typeof getStructureUnit> | undefined,
  dueReviewCount: number,
) {
  if (action.kind === "due_review") {
    return dueReviewCount
      ? `${dueReviewCount} review item${dueReviewCount === 1 ? "" : "s"} are already due, so recovery gives the fastest return today.`
      : "Review will protect recent gains before new load is added.";
  }

  if (action.kind === "weakness_repair") {
    return unit
      ? `${unit.title} is the clearest bottleneck in your recent answers.`
      : "This is the weakest part of your current map.";
  }

  return unit
    ? `${unit.title} is close enough to move, but still needs one more clean push.`
    : "This is the best next session for steady momentum.";
}

function buildWhyNowCopy(
  record: MasteryRecord,
  reviewQueue: ReviewItem[],
  unit: ReturnType<typeof getStructureUnit> | undefined,
) {
  const reviewDueForStructure = reviewQueue.some(
    (item) => item.structureKey === record.structureKey,
  );

  const whatKeepsSlipping = reviewDueForStructure
    ? `${record.title} is due for review, and the same weakness still shows up when you revisit it.`
    : record.repeatedErrorRate14d > 0.22
      ? `The same ${record.title.toLowerCase()} slip keeps returning when prompts get more open.`
      : record.hintDependenceRate14d > 0.2
        ? `You can repair ${record.title.toLowerCase()}, but you still need support before it holds on its own.`
        : record.reviewSuccessRate30d < 0.65
          ? `${record.title} lands in practice, but it is not staying stable in review yet.`
          : `${record.title} is the clearest place where one strong session can improve your next sentences.`;

  const whatThisImproves = unit
    ? ensureSentence(unit.description)
    : "This practice sharpens a weak point that still slows sentence quality.";

  const support =
    record.progressionState === "promotion_candidate"
      ? "A clean session here should move this structure closer to stable control."
      : record.progressionState === "review_required"
        ? "Recovering this first will make new practice more likely to stick."
        : "A focused session here should lower repeated errors and make first tries cleaner.";

  return {
    whatKeepsSlipping,
    whatThisImproves,
    support,
  };
}

function collapseToLatestAttempts(
  rows: (typeof userResponses.$inferSelect)[],
) {
  const latestByItem = new Map<string, (typeof userResponses.$inferSelect)>();

  for (const row of rows) {
    const current = latestByItem.get(row.itemId);
    if (!current || row.attemptNumber > current.attemptNumber) {
      latestByItem.set(row.itemId, row);
    }
  }

  return [...latestByItem.values()];
}

function buildProgressProof(
  mastery: MasteryRecord[],
  latestAttempts14d: (typeof userResponses.$inferSelect)[],
  sessionModeById: Map<string, PracticeSession["mode"]>,
  repeatedByResponseId: Map<string, boolean>,
): DashboardSnapshot["progressProof"] {
  const now = new Date();
  const recentStart = subDays(now, 7);
  const previousStart = subDays(now, 14);

  const recentAttempts = latestAttempts14d.filter(
    (row) => row.createdAt >= recentStart,
  );
  const previousAttempts = latestAttempts14d.filter(
    (row) => row.createdAt >= previousStart && row.createdAt < recentStart,
  );

  const recentReviewAttempts = recentAttempts.filter(
    (row) => sessionModeById.get(row.sessionId) === "review",
  );
  const previousReviewAttempts = previousAttempts.filter(
    (row) => sessionModeById.get(row.sessionId) === "review",
  );

  const proofCards: Array<DashboardSnapshot["progressProof"]["items"][number] & { weight: number }> = [];

  const firstTryDelta =
    average(recentAttempts.map((row) => (row.firstTrySuccess ? 1 : 0))) -
    average(previousAttempts.map((row) => (row.firstTrySuccess ? 1 : 0)));
  if (recentAttempts.length >= 3 && previousAttempts.length >= 3 && firstTryDelta >= 0.08) {
    proofCards.push({
      id: "first-try",
      label: "Cleaner first tries",
      value: formatSignedPoints(firstTryDelta),
      note: "You are landing more sentences without having to repair them first.",
      weight: firstTryDelta,
    });
  }

  const hintDelta =
    average(previousAttempts.map((row) => row.hintCount)) -
    average(recentAttempts.map((row) => row.hintCount));
  if (recentAttempts.length >= 3 && previousAttempts.length >= 3 && hintDelta >= 0.25) {
    proofCards.push({
      id: "hints",
      label: "Fewer hints needed",
      value: formatAverageHintDelta(hintDelta),
      note: "You are correcting yourself earlier instead of waiting for more support.",
      weight: hintDelta / 2,
    });
  }

  const recentRepeatedRate = average(
    recentAttempts.map((row) => (repeatedByResponseId.get(row.id) ? 1 : 0)),
  );
  const previousRepeatedRate = average(
    previousAttempts.map((row) => (repeatedByResponseId.get(row.id) ? 1 : 0)),
  );
  const repeatedDelta = previousRepeatedRate - recentRepeatedRate;
  if (recentAttempts.length >= 3 && previousAttempts.length >= 3 && repeatedDelta >= 0.08) {
    proofCards.push({
      id: "repeated-errors",
      label: "Repeated mistakes are down",
      value: formatSignedPoints(repeatedDelta),
      note: "The same grammar slip is showing up less often in your recent work.",
      weight: repeatedDelta,
    });
  }

  const recentReviewWins = recentReviewAttempts.filter((row) => row.responseScore >= 0.72).length;
  const previousReviewWins = previousReviewAttempts.filter((row) => row.responseScore >= 0.72).length;
  if (recentReviewAttempts.length && recentReviewWins > previousReviewWins) {
    proofCards.push({
      id: "review-wins",
      label: "Review is sticking",
      value: `+${recentReviewWins - previousReviewWins} wins`,
      note: "You are bringing weak structures back with more control before they fade.",
      weight: recentReviewWins - previousReviewWins,
    });
  }

  const movedStructure = [...mastery]
    .sort((left, right) => right.masteryDelta7d - left.masteryDelta7d)
    .find((record) => record.masteryDelta7d >= 0.05);
  if (movedStructure) {
    proofCards.push({
      id: "structure-move",
      label: "Structure moving forward",
      value: movedStructure.title,
      note: `${movedStructure.title} is now ${toUserFacingStage(movedStructure).toLowerCase()} because recent practice is translating into cleaner attempts.`,
      weight: movedStructure.masteryDelta7d,
    });
  }

  const items = proofCards
    .sort((left, right) => right.weight - left.weight)
    .slice(0, 3)
    .map((card) => ({
      id: card.id,
      label: card.label,
      value: card.value,
      note: card.note,
    }));

  if (items.length) {
    return { items };
  }

  return {
    items: [],
    fallbackTitle: "Build your first proof",
    fallbackBody:
      "Complete a few clean sessions or one strong review block and this space will start showing evidence from your own learning history.",
  };
}

function buildPracticeCoverage(
  weekSessions: (typeof practiceSessions.$inferSelect)[],
  weekAttempts: (typeof userResponses.$inferSelect)[],
  sessionById: Map<string, typeof practiceSessions.$inferSelect>,
): DashboardSnapshot["practiceCoverage"] {
  const completedSessions = weekSessions.filter((session) => session.learningScore !== null);
  const latestWeekAttempts = collapseToLatestAttempts(weekAttempts);
  const completedReviewItems = latestWeekAttempts.filter(
    (row) => sessionById.get(row.sessionId)?.mode === "review",
  );

  const touchedStructures = [...new Set(completedSessions.map((session) => session.primaryStructure))];
  const builderCounts = getBuilderKinds().map((builderKind) => ({
    builderKind,
    label: getBuilderMeta(builderKind).shortTitle,
    count: completedSessions.filter((session) => {
      const unit = getStructureUnit(session.primaryStructure);
      return unit?.builderKind === builderKind;
    }).length,
  }));

  return {
    practiceSessions: completedSessions.filter((session) => session.mode === "practice").length,
    reviewItems: completedReviewItems.length,
    topicsTouched: touchedStructures.length,
    recentTopics: touchedStructures
      .slice(0, 5)
      .map((structureKey) => humanizeStructureKey(structureKey)),
    builderCounts,
  };
}

function buildLearningMapSummary(
  mastery: MasteryRecord[],
  reviewQueue: ReviewItem[],
  reviewHref: string,
  bestNextPracticeHref: string,
): DashboardSnapshot["learningMapSummary"] {
  const strongest = [...mastery].sort((left, right) => right.masteryScore - left.masteryScore)[0];
  const weakest = mastery[0];
  const middleCandidates = mastery.filter(
    (record) =>
      record.structureKey !== weakest.structureKey &&
      record.structureKey !== strongest.structureKey,
  );
  const improving =
    [...middleCandidates].sort((left, right) => {
      const leftPriority =
        (left.progressionState === "promotion_candidate" ? 1 : 0) + left.masteryDelta7d;
      const rightPriority =
        (right.progressionState === "promotion_candidate" ? 1 : 0) + right.masteryDelta7d;
      return rightPriority - leftPriority;
    })[0] ?? strongest;
  const dueKeys = new Set(reviewQueue.map((item) => item.structureKey));

  return [
    {
      label: "Needs attention" as const,
      structureTitle: weakest.title,
      stageLabel: toUserFacingStage(weakest),
      note: dueKeys.has(weakest.structureKey)
        ? "Review is already due here, and the same slip still shows up in open answers."
        : weakest.repeatedErrorRate14d > 0.2
          ? "Repeated slips still pull this structure down when prompts get less controlled."
          : "This is the clearest place where one focused session can improve accuracy.",
      actionLabel:
        dueKeys.has(weakest.structureKey) || weakest.progressionState === "review_required"
          ? "Review"
          : "Practice",
      actionHref:
        dueKeys.has(weakest.structureKey) || weakest.progressionState === "review_required"
          ? reviewHref
          : "/practice/weakest-area",
    },
    {
      label: "Improving now" as const,
      structureTitle: improving.title,
      stageLabel: toUserFacingStage(improving),
      note:
        improving.progressionState === "promotion_candidate"
          ? "One more strong session could push this structure into a safer range."
          : improving.masteryDelta7d > 0
            ? "Recent sessions are translating into cleaner first tries here."
            : "This structure is steady enough to reward another clean push.",
      actionLabel:
        dueKeys.has(improving.structureKey) || improving.progressionState === "review_required"
          ? "Review"
          : "Practice",
      actionHref:
        dueKeys.has(improving.structureKey) || improving.progressionState === "review_required"
          ? reviewHref
          : improving.structureKey === weakest.structureKey
            ? "/practice/weakest-area"
            : bestNextPracticeHref,
    },
    {
      label: "Strongest area" as const,
      structureTitle: strongest.title,
      stageLabel: toUserFacingStage(strongest),
      note: "This is your most stable structure right now, even when prompts open up.",
      actionLabel: "Keep warm",
      actionHref: "/practice/momentum-lab",
    },
  ];
}

function nextUserFacingStage(record: MasteryRecord): UserFacingStage {
  const current = toUserFacingStage(record);

  if (current === "Needs work") {
    return "Improving";
  }

  if (current === "Improving") {
    return "Nearly stable";
  }

  if (current === "Needs review") {
    return record.masteryStage === "fragile" ? "Improving" : "Nearly stable";
  }

  return "Strong";
}

function buildNextUnlock(
  mastery: MasteryRecord[],
  reviewQueue: ReviewItem[],
  reviewHref: string,
  bestNextPracticeHref: string,
): DashboardSnapshot["nextUnlock"] {
  const candidates = mastery.filter(
    (record) => toUserFacingStage(record) !== "Strong",
  );
  const target =
    [...candidates].sort((left, right) => {
      const leftPriority =
        (left.promotionEligible ? 1 : 0) +
        left.masteryScore +
        left.masteryDelta7d -
        left.repeatedErrorRate14d * 0.4 -
        left.hintDependenceRate14d * 0.3;
      const rightPriority =
        (right.promotionEligible ? 1 : 0) +
        right.masteryScore +
        right.masteryDelta7d -
        right.repeatedErrorRate14d * 0.4 -
        right.hintDependenceRate14d * 0.3;
      return rightPriority - leftPriority;
    })[0] ?? mastery[0];

  const requirementParts: string[] = [];
  if (
    target.repeatedErrorRate14d > 0.15 ||
    target.masteryStage === "fragile"
  ) {
    requirementParts.push("2 clean practice sessions");
  }
  if (
    target.reviewSuccessRate30d < 0.7 ||
    reviewQueue.some((item) => item.structureKey === target.structureKey)
  ) {
    requirementParts.push("1 successful review");
  }
  if (target.hintDependenceRate14d > 0.2) {
    requirementParts.push("1 low-hint session");
  }
  if (target.promptTypeCoverage < 0.5) {
    requirementParts.push("1 mixed-prompt session");
  }

  const actionHref =
    reviewQueue.some((item) => item.structureKey === target.structureKey) ||
    target.progressionState === "review_required"
      ? reviewHref
      : target.structureKey === mastery[0]?.structureKey
        ? "/practice/weakest-area"
        : bestNextPracticeHref;

  return {
    structureTitle: target.title,
    currentStageLabel: toUserFacingStage(target),
    nextStageLabel: nextUserFacingStage(target),
    requirement:
      requirementParts.slice(0, 3).join(" + ") || "1 strong session to confirm the move",
    note:
      target.progressionState === "promotion_candidate"
        ? "This structure is closest to a visible step up if you can keep it clean."
        : "This is the next realistic step on your map, not a vague long-term goal.",
    actionLabel:
      reviewQueue.some((item) => item.structureKey === target.structureKey) ||
      target.progressionState === "review_required"
        ? "Open review"
        : "Work on it",
    actionHref,
  };
}

function buildReviewPressure(
  reviewQueue: ReviewItem[],
  mastery: MasteryRecord[],
): DashboardSnapshot["reviewPressure"] {
  const today = startOfDay(new Date());
  const overdueCount = reviewQueue.filter(
    (item) => new Date(item.dueAt) < today,
  ).length;
  const nextDue =
    reviewQueue[0] ??
    [...mastery]
      .sort(
        (left, right) =>
          new Date(left.nextReviewDueAt).getTime() -
          new Date(right.nextReviewDueAt).getTime(),
      )
      .map((record) => ({
        structureKey: record.structureKey,
      }))[0];
  const nextStructureTitle = nextDue
    ? humanizeStructureKey(nextDue.structureKey)
    : null;

  return {
    dueCount: reviewQueue.length,
    overdueCount,
    nextStructureTitle,
    note: reviewQueue.length
      ? `${nextStructureTitle ?? "A weak structure"} is ready for recovery now, which makes today’s next session more likely to stick.`
      : nextStructureTitle
        ? `No reviews are due right now. ${nextStructureTitle} is the next structure to keep warm.`
        : "No reviews are due right now.",
    actionLabel: reviewQueue.length ? "Open due review" : "Open review hub",
    actionHref: reviewQueue.length ? "/practice/review-due" : "/review",
  };
}

function leagueMovementLabel(status: LeagueEntry["leagueStatus"]) {
  if (status === "promote") {
    return "Rising";
  }

  if (status === "watch") {
    return "Watch zone";
  }

  return "Holding";
}

function buildTodayMission(
  action: RecommendationPayload["selected"],
  unit: ReturnType<typeof getStructureUnit> | undefined,
  dueReviewCount: number,
  completedToday: boolean,
  alternateAction?: RecommendationPayload["selected"],
): DashboardSnapshot["todayMission"] {
  const primaryAction =
    completedToday && alternateAction
      ? {
          label: "Choose another focus",
          href:
            alternateAction.kind === "due_review"
              ? "/practice/review-due"
              : alternateAction.href,
        }
      : {
          label: "Start today’s practice",
          href: action.kind === "due_review" ? "/practice/review-due" : action.href,
        };

  return {
    title: missionTitle(action, unit),
    technicalLabel: unit ? `Target structure: ${unit.title}` : "Target structure: Review queue",
    modeLabel: missionModeLabel(action.kind),
    targetLevel: action.levelBand ?? unit?.baseLevel ?? "B1",
    promptCount: action.kind === "due_review" ? 5 : pickBlueprints(action.structureKey ?? unit?.key ?? "articles").length,
    successDefinition: missionSuccessDefinition(action, unit),
    note: completedToday
      ? `You already completed today’s recommended session on ${unit?.title ?? "this focus"}. Keep momentum by opening another focus or clearing review next.`
      : missionNote(action, unit, dueReviewCount),
    primaryAction,
    secondaryActions: [
      {
        label: completedToday ? "Open review" : "Choose another focus",
        href: completedToday
          ? dueReviewCount
            ? "/practice/review-due"
            : "/review"
          : "/practice/momentum-lab",
      },
      {
        label: completedToday ? "Open learning map" : "Open review",
        href: completedToday
          ? "/profile?tab=map"
          : dueReviewCount
            ? "/practice/review-due"
            : "/review",
      },
    ],
  };
}

function buildRecentWin(
  latestAttempts14d: (typeof userResponses.$inferSelect)[],
  sessionById: Map<string, typeof practiceSessions.$inferSelect>,
  feedbackByResponseId: Map<string, typeof feedbackEvents.$inferSelect>,
): DashboardSnapshot["recentWin"] {
  const candidate = [...latestAttempts14d]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .find((row) => {
      const feedback = feedbackByResponseId.get(row.id);
      return (
        feedback &&
        (!row.firstTrySuccess || row.hintCount > 0 || row.retryCount > 0) &&
        row.rawUserResponse.trim().toLowerCase() !==
          feedback.naturalRewrite.trim().toLowerCase()
      );
    });

  if (!candidate) {
    return null;
  }

  const feedback = feedbackByResponseId.get(candidate.id);
  const session = sessionById.get(candidate.sessionId);
  if (!feedback || !session) {
    return null;
  }

  return {
    structureTitle: humanizeStructureKey(session.primaryStructure),
    beforeText: candidate.rawUserResponse,
    afterText: feedback.naturalRewrite,
    note: feedback.whyItWorks,
  };
}

function buildLeagueMini(league: LeagueSnapshot): DashboardSnapshot["leagueMini"] {
  const viewerEntry =
    league.entries.find((entry) => entry.isViewer) ??
    league.entries[0] ?? {
      rank: league.viewerRank,
      learner: "You",
      levelBand: "B1" as LevelBand,
      weeklyLearningScore: 0,
      masteryDelta: 0,
      leagueStatus: "stay" as const,
      isViewer: true,
    };

  return {
    viewerRank: league.viewerRank,
    totalMembers: league.totalMembers,
    weeklyLearningScore: viewerEntry.weeklyLearningScore,
    movementLabel: leagueMovementLabel(viewerEntry.leagueStatus),
    href: "/league",
  };
}

function bracketFromLevel(level: LevelBand) {
  if (level === "C1") {
    return "B2 / C1 production league";
  }

  if (level === "B2") {
    return "B1 / B2 production league";
  }

  return "A2 / B1 production league";
}

function getReviewDelayDays(responseScore: number) {
  if (responseScore < 0.45) {
    return 1;
  }

  if (responseScore < 0.7) {
    return 3;
  }

  return 7;
}

function buildBaselineValue(areaLevel: LevelBand, structureLevel: LevelBand) {
  const difference = getLevelRank(areaLevel) - getLevelRank(structureLevel);

  if (difference >= 2) {
    return 0.74;
  }

  if (difference === 1) {
    return 0.65;
  }

  if (difference === 0) {
    return 0.54;
  }

  if (difference === -1) {
    return 0.41;
  }

  return 0.32;
}

function toMetadata(blueprint: PracticeBlueprint) {
  return {
    levelBand: blueprint.levelBand,
    supportObjective: blueprint.supportObjective,
    topic: blueprint.topic,
    memoryAnchor: blueprint.memoryAnchor,
    whyItWorks: blueprint.whyItWorks,
    hint1: blueprint.hint1,
    hint2: blueprint.hint2,
    naturalRewrite: blueprint.naturalRewrite,
    levelUpVariants: blueprint.levelUpVariants,
    evaluationRubric: blueprint.evaluationRubric,
  };
}

function mapPracticeRowsToSession(
  sessionRow: typeof practiceSessions.$inferSelect,
  itemRows: typeof practiceItems.$inferSelect[],
): PracticeSession {
  const unit = getStructureUnit(sessionRow.primaryStructure) ?? structureCatalog[0];
  const learningMode =
    sessionRow.mode === "review"
      ? "review"
      : sessionRow.title.includes("Challenge")
        ? "challenge"
        : sessionRow.title.includes("Lesson")
          ? "learn"
          : "practice";
  const items = itemRows.map((row) => {
    const metadata = row.metadata as {
      levelBand: LevelBand;
      supportObjective: string;
      topic: string;
      memoryAnchor: boolean;
      whyItWorks: string;
      hint1: string;
      hint2: string;
      naturalRewrite: string;
      levelUpVariants: Array<{ level: LevelBand; text: string }>;
      evaluationRubric: PracticeSession["items"][number]["evaluationRubric"];
    };

    return {
      id: row.id,
      prompt: row.prompt,
      promptType: row.promptType as PracticeSession["items"][number]["promptType"],
      structureKey: row.structureKey,
      levelBand: metadata.levelBand,
      supportObjective: metadata.supportObjective,
      topic: metadata.topic,
      memoryAnchor: metadata.memoryAnchor,
      acceptedAnswer: row.acceptedAnswer,
      whyItWorks: metadata.whyItWorks,
      hint1: metadata.hint1,
      hint2: metadata.hint2,
      naturalRewrite: metadata.naturalRewrite,
      levelUpVariants: metadata.levelUpVariants,
      evaluationRubric: metadata.evaluationRubric,
    };
  });

  return {
    id: sessionRow.id,
    title: sessionRow.title,
    description:
      sessionRow.mode === "review"
        ? "Recover weak structures before they fade."
        : learningMode === "learn"
          ? "Recall the pattern, see it in context, then use it across five guided prompts."
          : learningMode === "challenge"
            ? "Push this topic into more open production without losing control."
        : "Build clean control through correction, not passive reading.",
    mode: sessionRow.mode as PracticeSession["mode"],
    learningMode,
    builderKind: unit.builderKind,
    topicKey: sessionRow.primaryStructure,
    primaryStructure: titleCase(sessionRow.primaryStructure),
    supportObjective: sessionRow.supportObjective,
    targetLevel: sessionRow.targetLevel as LevelBand,
    lane: sessionRow.lane as PracticeSession["lane"],
    focusReason:
      sessionRow.mode === "review"
        ? "These items are due now, so review gives the fastest return."
        : learningMode === "learn"
          ? "This session teaches the pattern briefly, then makes you use it before you move on."
          : learningMode === "challenge"
            ? "This topic is ready for a harder version that checks whether it really holds in open production."
        : "This session targets the structure most likely to improve your next sentence fastest.",
    items,
  };
}

function pickBlueprints(structureKey: string) {
  const blueprints = getPracticeBlueprints(structureKey);
  return blueprints.slice(0, 5);
}

async function getCompletedPracticeSessionsSince(userId: string, since: Date) {
  const database = requireDb();

  return database
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.mode, "practice"),
        gte(practiceSessions.createdAt, since),
        isNotNull(practiceSessions.learningScore),
      ),
    );
}

async function pickBlueprintsForUser(
  userId: string,
  structureKey: string,
  mode: PracticeSession["mode"],
) {
  const blueprints = getPracticeBlueprints(structureKey);
  if (blueprints.length <= 5) {
    return blueprints;
  }

  const database = requireDb();
  const priorSessions = await database
    .select({ id: practiceSessions.id })
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.userId, userId),
        eq(practiceSessions.primaryStructure, structureKey),
        eq(practiceSessions.mode, mode),
        isNotNull(practiceSessions.learningScore),
      ),
    );

  const offset = priorSessions.length % blueprints.length;
  return Array.from({ length: 5 }, (_, index) => {
    return blueprints[(offset + index) % blueprints.length];
  });
}

function chooseNextCandidateAction(
  ranked: RecommendationPayload["ranked"],
  completedTodayStructureKeys: Set<string>,
  options?: {
    allowDueReview?: boolean;
    allowCustomStructure?: boolean;
  },
) {
  const allowDueReview = options?.allowDueReview ?? false;
  const allowCustomStructure = options?.allowCustomStructure ?? false;

  return (
    ranked.find((action) => {
      if (action.kind === "due_review") {
        return allowDueReview;
      }

      if (action.kind === "custom_structure") {
        return allowCustomStructure;
      }

      if (!action.structureKey) {
        return false;
      }

      return !completedTodayStructureKeys.has(action.structureKey);
    }) ??
    ranked.find((action) => action.kind === "new_practice") ??
    ranked.find((action) => action.kind === "weakness_repair") ??
    ranked.find((action) => action.kind === "due_review" && allowDueReview) ??
    ranked.find((action) => action.kind === "custom_structure" && allowCustomStructure) ??
    ranked[0]
  );
}

async function ensureStructureCatalogSeeded() {
  const database = requireDb();
  const existing = await database
    .select({ key: structureCatalogTable.key })
    .from(structureCatalogTable);

  const known = new Set(existing.map((row) => row.key));
  const missing = structureCatalog.filter((unit) => !known.has(unit.key));

  if (!missing.length) {
    return;
  }

  await database.insert(structureCatalogTable).values(
    missing.map((unit) => ({
      key: unit.key,
      title: unit.title,
      family: unit.family,
      description: unit.description,
      skillArea: unit.skillArea,
      baseLevel: unit.baseLevel,
      supportObjective: unit.supportObjective,
    })),
  );
}

async function getProfileRow(userId: string) {
  const database = requireDb();
  const [profile] = await database
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);

  return profile ?? null;
}

async function getLatestAssessment(userId: string) {
  const database = requireDb();
  const [attempt] = await database
    .select()
    .from(assessmentAttempts)
    .where(eq(assessmentAttempts.userId, userId))
    .orderBy(desc(assessmentAttempts.createdAt))
    .limit(1);

  return attempt ?? null;
}

function buildSkillSnapshotsFromMastery(records: MasteryRecord[]): SkillSnapshot[] {
  const byArea = new Map<SkillArea, MasteryRecord[]>();

  for (const record of records) {
    const unit = getStructureUnit(record.structureKey);
    if (!unit) {
      continue;
    }

    const list = byArea.get(unit.skillArea) ?? [];
    list.push(record);
    byArea.set(unit.skillArea, list);
  }

  return (["grammar", "vocabulary", "sentence_building"] as SkillArea[]).map((area) => {
    const list = byArea.get(area) ?? [];
    const score = list.length
      ? round(average(list.map((record) => record.masteryScore)))
      : 0;
    const label =
      area === "grammar"
        ? "Grammar control"
        : area === "vocabulary"
          ? "Vocabulary usage"
          : "Sentence building";

    return {
      area,
      label,
      levelBand: levelFromScore(score || 0.3),
      score,
      trend: [
        clamp(score - 0.15),
        clamp(score - 0.12),
        clamp(score - 0.08),
        clamp(score - 0.05),
        clamp(score - 0.02),
        clamp(score),
      ].map((value) => Math.round(value * 100)),
    };
  });
}

async function upsertSkillProfiles(userId: string, records: MasteryRecord[]) {
  const database = requireDb();
  const snapshots = buildSkillSnapshotsFromMastery(records);

  for (const snapshot of snapshots) {
    await database
      .insert(skillProfiles)
      .values({
        id: `${userId}:${snapshot.area}`,
        userId,
        area: snapshot.area,
        label: snapshot.label,
        levelBand: snapshot.levelBand,
        score: snapshot.score,
        trend: snapshot.trend,
      })
      .onConflictDoUpdate({
        target: skillProfiles.id,
        set: {
          levelBand: snapshot.levelBand,
          score: snapshot.score,
          trend: snapshot.trend,
        },
      });
  }

  return snapshots;
}

async function upsertAchievements(userId: string, records: MasteryRecord[]) {
  const database = requireDb();
  const built = buildAchievements(records);

  for (const achievement of built) {
    await database
      .insert(achievements)
      .values({
        id: `${userId}:${achievement.id}`,
        userId,
        title: achievement.title,
        description: achievement.description,
        status: achievement.status,
        progress: achievement.progress,
      })
      .onConflictDoUpdate({
        target: achievements.id,
        set: {
          status: achievement.status,
          progress: achievement.progress,
        },
      });
  }

  return built;
}

async function ensureLeagueWeek(bracket: string) {
  const database = requireDb();
  const { startsAt, endsAt } = currentWeekWindow();
  const id = `${format(startsAt, "yyyy-MM-dd")}:${bracket}`;

  await database
    .insert(leagueWeeks)
    .values({
      id,
      label: currentWeekLabel(),
      bracket,
      startsAt,
      endsAt,
    })
    .onConflictDoNothing();

  return id;
}

function currentCupFamily() {
  const families = [...new Set(structureCatalog.map((item) => item.family))];
  const index = startOfWeek(new Date(), { weekStartsOn: 1 }).getDate() % families.length;
  return families[index] ?? "Accuracy";
}

async function upsertLeagueState(
  userId: string,
  viewerName: string,
  records: MasteryRecord[],
  overallLevel: LevelBand,
) {
  const database = requireDb();
  const bracket = bracketFromLevel(overallLevel);
  const leagueWeekId = await ensureLeagueWeek(bracket);
  const weeklyLearningScore = buildWeeklyLearningScore(records);
  const masteryDelta = round(
    average(records.map((record) => clamp(record.masteryDelta7d, 0, 0.25))),
  );

  await database
    .insert(leagueMemberships)
    .values({
      id: `${leagueWeekId}:${userId}`,
      leagueWeekId,
      userId,
      levelBand: overallLevel,
    })
    .onConflictDoNothing();

  await database
    .insert(leagueScores)
    .values({
      id: `${leagueWeekId}:${userId}`,
      leagueWeekId,
      userId,
      weeklyLearningScore,
      masteryDelta,
      normalizedScore: round((weeklyLearningScore / 100) * (0.8 + masteryDelta)),
    })
    .onConflictDoUpdate({
      target: leagueScores.id,
      set: {
        weeklyLearningScore,
        masteryDelta,
        normalizedScore: round((weeklyLearningScore / 100) * (0.8 + masteryDelta)),
      },
    });

  const family = currentCupFamily();

  await database
    .insert(structureCups)
    .values({
      id: `${leagueWeekId}:cup`,
      leagueWeekId,
      structureFamily: family,
      metadata: {
        label: `${family} Cup`,
      },
    })
    .onConflictDoNothing();

  const stableFamilies = new Map<string, number>();
  for (const record of records) {
    if (record.masteryStage !== "stable") {
      continue;
    }

    const familyName = getStructureUnit(record.structureKey)?.family;
    if (!familyName) {
      continue;
    }

    stableFamilies.set(familyName, (stableFamilies.get(familyName) ?? 0) + 1);
  }

  const bossFamily = [...stableFamilies.entries()].sort((a, b) => b[1] - a[1])[0];

  await database
    .insert(bossSessions)
    .values({
      id: `${userId}:${leagueWeekId}`,
      userId,
      structureFamily: bossFamily?.[0] ?? family,
      status: bossFamily ? "ready" : "locked",
      bonusScore: bossFamily ? 8 : 0,
    })
    .onConflictDoUpdate({
      target: bossSessions.id,
      set: {
        structureFamily: bossFamily?.[0] ?? family,
        status: bossFamily ? "ready" : "locked",
        bonusScore: bossFamily ? 8 : 0,
      },
    });

  return {
    viewerName,
    weeklyLearningScore,
    masteryDelta,
    leagueWeekId,
    bracket,
  };
}

async function buildMasterySeedFromHistory(userId: string, structureKey: string) {
  const database = requireDb();
  const unit = getStructureUnit(structureKey);
  if (!unit) {
    return null;
  }

  const [existingRow] = await database
    .select()
    .from(masteryRecords)
    .where(
      and(
        eq(masteryRecords.userId, userId),
        eq(masteryRecords.structureKey, structureKey),
      ),
    )
    .limit(1);

  const since14 = subDays(new Date(), 14);
  const since30 = subDays(new Date(), 30);
  const since7 = subDays(new Date(), 7);
  const previous7 = subDays(new Date(), 14);

  const itemRows = await database
    .select()
    .from(practiceItems)
    .where(eq(practiceItems.structureKey, structureKey));

  if (!itemRows.length && existingRow) {
    return {
      userId,
      structureKey,
      currentLevelBand: existingRow.currentLevelBand as LevelBand,
      masteryScore: existingRow.masteryScore,
      masteryStage: existingRow.masteryStage as MasteryRecord["masteryStage"],
      masteryConfidence: existingRow.masteryConfidence,
      attemptCountTotal: 2,
      attemptCountRecent: 2,
      firstTrySuccessRate14d: existingRow.firstTrySuccessRate14d,
      repairSuccessRate14d: existingRow.repairSuccessRate14d,
      reviewSuccessRate30d: existingRow.reviewSuccessRate30d,
      repeatedErrorRate14d: existingRow.repeatedErrorRate14d,
      hintDependenceRate14d: existingRow.hintDependenceRate14d,
      promptTypeCoverage: existingRow.promptTypeCoverage,
      promptTypes: ["completion", "rewrite"] as PromptType[],
      stabilityScore: existingRow.stabilityScore,
      lastAttemptAt: new Date().toISOString(),
      lastReviewAt: subDays(new Date(), 2).toISOString(),
      nextReviewDueAt: existingRow.nextReviewDueAt.toISOString(),
      promotionEligible: existingRow.promotionEligible,
      demotionRisk: existingRow.demotionRisk,
      progressionState: existingRow.progressionState as MasteryRecord["progressionState"],
      masteryDelta7d: 0,
      title: unit.title,
      supportObjective: unit.supportObjective,
    };
  }

  if (!itemRows.length) {
    return null;
  }

  const itemIds = itemRows.map((item) => item.id);
  const sessionIds = [...new Set(itemRows.map((item) => item.sessionId))];

  const sessionRows = sessionIds.length
    ? await database
        .select()
        .from(practiceSessions)
        .where(inArray(practiceSessions.id, sessionIds))
    : [];
  const sessionModeById = new Map(sessionRows.map((row) => [row.id, row.mode]));

  const responseRows = await database
    .select()
    .from(userResponses)
    .where(
      and(
        eq(userResponses.userId, userId),
        inArray(userResponses.itemId, itemIds),
      ),
    )
    .orderBy(asc(userResponses.createdAt));

  const recentResponses14 = responseRows.filter(
    (row) => row.createdAt >= since14,
  );
  const recentResponses30 = responseRows.filter(
    (row) => row.createdAt >= since30,
  );
  const recentResponses7 = responseRows.filter((row) => row.createdAt >= since7);
  const previousResponses7 = responseRows.filter(
    (row) => row.createdAt < since7 && row.createdAt >= previous7,
  );

  const responseIds = responseRows.map((row) => row.id);
  const errorRows = responseIds.length
    ? await database
        .select()
        .from(errorEvents)
        .where(inArray(errorEvents.responseId, responseIds))
    : [];
  const errorByResponseId = new Map(errorRows.map((row) => [row.responseId, row]));

  const attemptCountTotal = responseRows.length;
  const attemptCountRecent = recentResponses14.length;

  if (!attemptCountTotal && !existingRow) {
    return null;
  }

  const firstTrySuccessRate14d = attemptCountRecent
    ? average(
        recentResponses14.map((row) => (row.firstTrySuccess ? 1 : 0)),
      )
    : existingRow?.firstTrySuccessRate14d ?? 0.2;
  const repairSuccessRate14d = attemptCountRecent
    ? average(recentResponses14.map((row) => (row.repairSuccess ? 1 : 0)))
    : existingRow?.repairSuccessRate14d ?? 0.3;
  const reviewResponseRows30 = recentResponses30.filter(
    (row) => sessionModeById.get(row.sessionId) === "review",
  );
  const reviewSuccessRate30d = reviewResponseRows30.length
    ? average(reviewResponseRows30.map((row) => (row.responseScore >= 0.65 ? 1 : 0)))
    : existingRow?.reviewSuccessRate30d ?? 0.18;
  const repeatedErrorRate14d = attemptCountRecent
    ? average(
        recentResponses14.map((row) =>
          errorByResponseId.get(row.id)?.repeatedError ? 1 : 0,
        ),
      )
    : existingRow?.repeatedErrorRate14d ?? 0;
  const hintDependenceRate14d = attemptCountRecent
    ? average(recentResponses14.map((row) => clamp(row.hintCount / 2)))
    : existingRow?.hintDependenceRate14d ?? 0.1;
  const promptTypes = [
    ...new Set(
      itemRows
        .filter((row) => responseRows.some((response) => response.itemId === row.id))
        .map((row) => row.promptType as MasteryRecord["promptTypes"][number]),
    ),
  ];
  const lastAttemptAt =
    responseRows.at(-1)?.createdAt?.toISOString() ??
    new Date().toISOString();
  const lastReviewAt =
    reviewResponseRows30.at(-1)?.createdAt?.toISOString() ??
    existingRow?.nextReviewDueAt?.toISOString() ??
    new Date().toISOString();
  const nextDue =
    (
      await database
        .select()
        .from(reviewItems)
        .where(
          and(
            eq(reviewItems.userId, userId),
            eq(reviewItems.structureKey, structureKey),
            eq(reviewItems.status, "due"),
          ),
        )
        .orderBy(asc(reviewItems.dueAt))
        .limit(1)
    )[0]?.dueAt ??
    existingRow?.nextReviewDueAt ??
    addDays(new Date(), 3);

  const recentScores =
    recentResponses14.length >= 3
      ? recentResponses14.slice(-6).map((row) => row.responseScore)
      : [
          clamp((existingRow?.masteryScore ?? 0.38) - 0.04),
          existingRow?.masteryScore ?? 0.38,
          clamp((existingRow?.masteryScore ?? 0.38) + 0.04),
        ];
  const currentAvg = recentResponses7.length
    ? average(recentResponses7.map((row) => row.responseScore))
    : existingRow?.masteryScore ?? 0.38;
  const previousAvg = previousResponses7.length
    ? average(previousResponses7.map((row) => row.responseScore))
    : currentAvg - 0.04;

  return buildMasteryRecord({
    userId,
    structureKey,
    title: unit.title,
    supportObjective: unit.supportObjective,
    currentLevelBand: (existingRow?.currentLevelBand ?? unit.baseLevel) as LevelBand,
    attemptCountTotal: attemptCountTotal || 1,
    attemptCountRecent: attemptCountRecent || 1,
    firstTrySuccessRate14d: round(firstTrySuccessRate14d),
    repairSuccessRate14d: round(repairSuccessRate14d),
    reviewSuccessRate30d: round(reviewSuccessRate30d),
    repeatedErrorRate14d: round(repeatedErrorRate14d),
    hintDependenceRate14d: round(hintDependenceRate14d),
    promptTypes:
      promptTypes.length > 0
        ? promptTypes
        : (["guided_generation"] as const),
    lastAttemptAt,
    lastReviewAt,
    nextReviewDueAt: nextDue.toISOString(),
    masteryDelta7d: round(clamp(currentAvg - previousAvg, -0.25, 0.25)),
    recentScores,
  });
}

async function persistMasteryRecord(record: MasteryRecord) {
  const database = requireDb();
  await database
    .insert(masteryRecords)
    .values({
      id: `${record.userId}:${record.structureKey}`,
      userId: record.userId,
      structureKey: record.structureKey,
      currentLevelBand: record.currentLevelBand,
      masteryScore: record.masteryScore,
      masteryStage: record.masteryStage,
      masteryConfidence: record.masteryConfidence,
      firstTrySuccessRate14d: record.firstTrySuccessRate14d,
      repairSuccessRate14d: record.repairSuccessRate14d,
      reviewSuccessRate30d: record.reviewSuccessRate30d,
      repeatedErrorRate14d: record.repeatedErrorRate14d,
      hintDependenceRate14d: record.hintDependenceRate14d,
      promptTypeCoverage: record.promptTypeCoverage,
      stabilityScore: record.stabilityScore,
      progressionState: record.progressionState,
      promotionEligible: record.promotionEligible,
      demotionRisk: record.demotionRisk,
      nextReviewDueAt: new Date(record.nextReviewDueAt),
    })
    .onConflictDoUpdate({
      target: masteryRecords.id,
      set: {
        currentLevelBand: record.currentLevelBand,
        masteryScore: record.masteryScore,
        masteryStage: record.masteryStage,
        masteryConfidence: record.masteryConfidence,
        firstTrySuccessRate14d: record.firstTrySuccessRate14d,
        repairSuccessRate14d: record.repairSuccessRate14d,
        reviewSuccessRate30d: record.reviewSuccessRate30d,
        repeatedErrorRate14d: record.repeatedErrorRate14d,
        hintDependenceRate14d: record.hintDependenceRate14d,
        promptTypeCoverage: record.promptTypeCoverage,
        stabilityScore: record.stabilityScore,
        progressionState: record.progressionState,
        promotionEligible: record.promotionEligible,
        demotionRisk: record.demotionRisk,
        nextReviewDueAt: new Date(record.nextReviewDueAt),
      },
    });
}

async function seedMasteryFromAssessment(
  userId: string,
  result: AssessmentResult,
) {
  const records: MasteryRecord[] = [];

  for (const unit of structureCatalog) {
    const areaLevel =
      unit.skillArea === "grammar"
        ? result.grammarControl
        : unit.skillArea === "vocabulary"
          ? result.vocabularyUsage
          : result.sentenceBuilding;
    const baseline = buildBaselineValue(areaLevel, unit.baseLevel);
    const record = buildMasteryRecord({
      userId,
      structureKey: unit.key,
      title: unit.title,
      supportObjective: unit.supportObjective,
      currentLevelBand: areaLevel,
      attemptCountTotal: 2,
      attemptCountRecent: 2,
      firstTrySuccessRate14d: round(clamp(baseline - 0.04)),
      repairSuccessRate14d: round(clamp(baseline + 0.12)),
      reviewSuccessRate30d: round(clamp(baseline - 0.1)),
      repeatedErrorRate14d: round(clamp(0.34 - baseline / 4, 0.05, 0.35)),
      hintDependenceRate14d: round(clamp(0.3 - baseline / 5, 0.06, 0.3)),
      promptTypes: ["completion", "rewrite"],
      lastAttemptAt: new Date().toISOString(),
      lastReviewAt: subDays(new Date(), 2).toISOString(),
      nextReviewDueAt: addDays(new Date(), 3).toISOString(),
      masteryDelta7d: 0,
      recentScores: [
        clamp(baseline - 0.05),
        baseline,
        clamp(baseline + 0.04),
      ],
    });

    await persistMasteryRecord(record);
    records.push(record);
  }

  return records;
}

async function getMasteryRecordsForUser(userId: string) {
  const database = requireDb();
  const stored = await database
    .select()
    .from(masteryRecords)
    .where(eq(masteryRecords.userId, userId));

  const records: MasteryRecord[] = [];

  for (const row of stored) {
    const hydrated = await buildMasterySeedFromHistory(userId, row.structureKey);
    if (!hydrated) {
      continue;
    }

    await persistMasteryRecord(hydrated);
    records.push(hydrated);
  }

  return records.sort((left, right) => left.masteryScore - right.masteryScore);
}

async function ensureProgressionDecision(
  userId: string,
  sessionId: string,
  record: MasteryRecord,
) {
  const database = requireDb();
  const decision = buildProgressionDecision(record);

  await database
    .insert(progressionDecisions)
    .values({
      id: `${sessionId}:${record.structureKey}`,
      userId,
      sessionId,
      structureKey: record.structureKey,
      decisionType: decision.decisionType,
      previousState: decision.previousState,
      newState: decision.newState,
      currentLevelBand: record.currentLevelBand,
      targetLevelBand: decision.targetLevelBand,
      decisionConfidence: decision.confidence,
      reasonCodes: decision.reasonCodes,
      inputSnapshot: {
        masteryScore: record.masteryScore,
        firstTrySuccessRate14d: record.firstTrySuccessRate14d,
        repairSuccessRate14d: record.repairSuccessRate14d,
        reviewSuccessRate30d: record.reviewSuccessRate30d,
        repeatedErrorRate14d: record.repeatedErrorRate14d,
        hintDependenceRate14d: record.hintDependenceRate14d,
      },
      llmUsed: false,
      llmModel: "",
      llmRationale: "",
      expectedEffect: decision.expectedEffect,
      observedEffect: "insufficient_data",
      decisionQuality: "pending",
      overriddenByRule: false,
    })
    .onConflictDoUpdate({
      target: progressionDecisions.id,
      set: {
        decisionType: decision.decisionType,
        previousState: decision.previousState,
        newState: decision.newState,
        currentLevelBand: record.currentLevelBand,
        targetLevelBand: decision.targetLevelBand,
        decisionConfidence: decision.confidence,
        reasonCodes: decision.reasonCodes,
        inputSnapshot: {
          masteryScore: record.masteryScore,
          firstTrySuccessRate14d: record.firstTrySuccessRate14d,
          repairSuccessRate14d: record.repairSuccessRate14d,
          reviewSuccessRate30d: record.reviewSuccessRate30d,
          repeatedErrorRate14d: record.repeatedErrorRate14d,
          hintDependenceRate14d: record.hintDependenceRate14d,
        },
        expectedEffect: decision.expectedEffect,
      },
    });

  return decision;
}

async function buildRecommendationForUser(userId: string) {
  const database = requireDb();
  const mastery = await getMasteryRecordsForUser(userId);
  const queue = await getDueReviewItems(userId);
  const fallback = buildRecommendationPayload({
    masteryRecords: mastery,
    reviewQueue: queue,
  });
  const ranked = buildCandidateActions({
    masteryRecords: mastery,
    reviewQueue: queue,
  });
  const llm = await rankRecommendationsWithLLM(ranked);
  const recommendation = llm ?? fallback;

  await database
    .insert(recommendationEvents)
    .values({
      id: crypto.randomUUID(),
      userId,
      selectedAction: recommendation.selected,
      candidateActions: recommendation.ranked,
      rationale: recommendation.rationale,
      accepted: false,
      upliftScore: null,
    });

  return recommendation;
}

export async function saveOnboardingProfile(
  viewer: Viewer,
  profile: OnboardingProfile,
) {
  const database = requireDb();
  await ensureStructureCatalogSeeded();

  await database
    .insert(profiles)
    .values({
      userId: viewer.id,
      goal: mapGoal(profile.goal),
      weeklyTimeBudget: mapTimeBudget(profile.timeCommitment),
      selfRating: mapSelfRating(profile.confidence),
      supportLevel: mapSelfRating(profile.confidence),
      frustrationPattern:
        profile.frustration ? titleCase(profile.frustration) : null,
      preferredThemes: profile.themes,
      wantsIelts: profile.ieltsIntent,
      overallLevel: "A2",
      grammarControl: "A2",
      vocabularyUsage: "A2",
      sentenceBuilding: "A2",
      onboardingCompletedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        goal: mapGoal(profile.goal),
        weeklyTimeBudget: mapTimeBudget(profile.timeCommitment),
        selfRating: mapSelfRating(profile.confidence),
        supportLevel: mapSelfRating(profile.confidence),
        frustrationPattern:
          profile.frustration ? titleCase(profile.frustration) : null,
        preferredThemes: profile.themes,
        wantsIelts: profile.ieltsIntent,
        onboardingCompletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
}

export async function getAssessmentQuestions() {
  await ensureStructureCatalogSeeded();
  return assessmentQuestions;
}

export async function evaluateAndPersistAssessment(
  viewer: Viewer,
  answers: Array<{ questionId: string; value: string }>,
  mode: "placement" | "recalibration" = "placement",
) {
  const database = requireDb();
  await ensureStructureCatalogSeeded();

  if (!(await getProfileRow(viewer.id))) {
    await saveOnboardingProfile(viewer, {
      goal: "reduce_grammar_mistakes",
      timeCommitment: "steady",
      confidence: "supported",
      ieltsIntent: false,
      frustration: "articles_prepositions",
      themes: ["daily_life"],
      completionState: "completed",
      updatedAt: new Date().toISOString(),
    });
  }

  const result = evaluateAssessment(assessmentQuestions, answers);

  await database.insert(assessmentAttempts).values({
    id: crypto.randomUUID(),
    userId: viewer.id,
    mode,
    overallLevel: result.overallLevel,
    grammarControl: result.grammarControl,
    vocabularyUsage: result.vocabularyUsage,
    sentenceBuilding: result.sentenceBuilding,
    topGrowthAreas: result.topGrowthAreas,
    initialLane: result.initialLane,
    confidence: result.confidence,
  });

  await database
    .update(profiles)
    .set({
      overallLevel: result.overallLevel,
      grammarControl: result.grammarControl,
      vocabularyUsage: result.vocabularyUsage,
      sentenceBuilding: result.sentenceBuilding,
      updatedAt: new Date(),
    })
    .where(eq(profiles.userId, viewer.id));

  const existing = await database
    .select({ id: masteryRecords.id })
    .from(masteryRecords)
    .where(eq(masteryRecords.userId, viewer.id))
    .limit(1);

  const records = existing.length
    ? await getMasteryRecordsForUser(viewer.id)
    : await seedMasteryFromAssessment(viewer.id, result);

  await upsertSkillProfiles(viewer.id, records);
  await upsertAchievements(viewer.id, records);
  await upsertLeagueState(viewer.id, viewer.name, records, result.overallLevel);

  return result;
}

async function createPracticeSessionRecord(
  viewer: Viewer,
  slug: string,
  mode: "practice" | "review",
  structureKey: string,
  targetLevel: LevelBand,
  title: string,
  supportObjective: string,
  lane: PracticeSession["lane"],
  blueprints: PracticeBlueprint[],
) {
  const database = requireDb();
  const sessionId = crypto.randomUUID();

  await database.insert(practiceSessions).values({
    id: sessionId,
    userId: viewer.id,
    mode,
    title,
    primaryStructure: structureKey,
    supportObjective,
    targetLevel,
    lane,
    learningScore: null,
  });

  await database.insert(practiceItems).values(
    blueprints.map((blueprint, index) => ({
      id: `${sessionId}:${index + 1}`,
      sessionId,
      structureKey: blueprint.structureKey,
      promptType: blueprint.promptType,
      prompt: blueprint.prompt,
      acceptedAnswer: blueprint.acceptedAnswer,
      metadata: toMetadata(blueprint),
    })),
  );

  const [sessionRow] = await database
    .select()
    .from(practiceSessions)
    .where(eq(practiceSessions.id, sessionId))
    .limit(1);
  const itemRows = await database
    .select()
    .from(practiceItems)
    .where(eq(practiceItems.sessionId, sessionId));

  const session = mapPracticeRowsToSession(sessionRow, itemRows);

  const [latestRecommendation] = await database
    .select()
    .from(recommendationEvents)
    .where(eq(recommendationEvents.userId, viewer.id))
    .orderBy(desc(recommendationEvents.createdAt))
    .limit(1);

  if (
    latestRecommendation &&
    typeof latestRecommendation.selectedAction === "object" &&
    (latestRecommendation.selectedAction as { href?: string }).href?.includes(slug)
  ) {
    await database
      .update(recommendationEvents)
      .set({ accepted: true })
      .where(eq(recommendationEvents.id, latestRecommendation.id));
  }

  return session;
}

function chooseCustomStructure(records: MasteryRecord[]) {
  const promotionCandidate = records.find(
    (record) => record.progressionState === "promotion_candidate",
  );
  return promotionCandidate ?? [...records].sort((a, b) => b.masteryScore - a.masteryScore)[0];
}

function parseTopicSessionSlug(sessionIdOrSlug: string) {
  const parts = sessionIdOrSlug.split("--");
  if (parts.length !== 4 || parts[0] !== "topic") {
    return null;
  }

  const builderKind = parts[1] as BuilderKind;
  const topicKey = parts[2];
  const learningMode = parts[3] as PracticeSession["learningMode"];
  const topic = getStructureUnit(topicKey);

  if (!topic || topic.builderKind !== builderKind) {
    return null;
  }

  return {
    builderKind,
    topicKey,
    learningMode,
    topic,
  };
}

function orderBlueprintsForLearningMode(
  blueprints: PracticeBlueprint[],
  learningMode: PracticeSession["learningMode"],
) {
  const weights: Record<string, number> =
    learningMode === "challenge"
      ? {
          free_production: 0,
          guided_generation: 1,
          memory_anchor: 2,
          constraint_based: 3,
          rewrite: 4,
          completion: 5,
          error_correction: 6,
        }
      : learningMode === "review"
        ? {
            error_correction: 0,
            completion: 1,
            rewrite: 2,
            guided_generation: 3,
            constraint_based: 4,
            free_production: 5,
            memory_anchor: 6,
          }
        : {
            memory_anchor: 0,
            rewrite: 1,
            guided_generation: 2,
            completion: 3,
            constraint_based: 4,
            free_production: 5,
            error_correction: 6,
          };

  return [...blueprints].sort((left, right) => {
    return (weights[left.promptType] ?? 99) - (weights[right.promptType] ?? 99);
  });
}

export async function getOrCreatePracticeSession(
  viewer: Viewer,
  sessionIdOrSlug: string,
) {
  const database = requireDb();
  const [existing] = await database
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.id, sessionIdOrSlug),
        eq(practiceSessions.userId, viewer.id),
      ),
    )
    .limit(1);

  if (existing) {
    const itemRows = await database
      .select()
      .from(practiceItems)
      .where(eq(practiceItems.sessionId, existing.id));

    return mapPracticeRowsToSession(existing, itemRows);
  }

  const profile = await getProfileRow(viewer.id);
  const assessment = await getLatestAssessment(viewer.id);
  if (!profile || !assessment) {
    return null;
  }

  const manualTopicRequest = parseTopicSessionSlug(sessionIdOrSlug);
  if (manualTopicRequest) {
    const targetLevel =
      manualTopicRequest.topic.skillArea === "grammar"
        ? (profile.grammarControl as LevelBand)
        : manualTopicRequest.topic.skillArea === "vocabulary"
          ? (profile.vocabularyUsage as LevelBand)
          : (profile.sentenceBuilding as LevelBand);
    const baseBlueprints = await pickBlueprintsForUser(
      viewer.id,
      manualTopicRequest.topicKey,
      manualTopicRequest.learningMode === "review" ? "review" : "practice",
    );
    const orderedBlueprints = orderBlueprintsForLearningMode(
      baseBlueprints,
      manualTopicRequest.learningMode,
    );
    const dueItems = manualTopicRequest.learningMode === "review"
      ? (await getDueReviewItems(viewer.id)).filter(
          (item) => item.structureKey === manualTopicRequest.topicKey,
        )
      : [];
    const blueprints = orderedBlueprints.map((blueprint, index) => ({
      ...blueprint,
      prompt: dueItems[index]?.prompt ?? blueprint.prompt,
    }));
    const sessionTitle =
      manualTopicRequest.learningMode === "learn"
        ? `${manualTopicRequest.topic.title} Builder Lesson`
        : manualTopicRequest.learningMode === "challenge"
          ? `${manualTopicRequest.topic.title} Challenge`
          : manualTopicRequest.learningMode === "review"
            ? `${manualTopicRequest.topic.title} Review Lab`
            : `${manualTopicRequest.topic.title} Practice Sprint`;
    const lane =
      manualTopicRequest.learningMode === "challenge"
        ? "Advanced Expression"
        : manualTopicRequest.learningMode === "review"
          ? "Controlled Production"
          : manualTopicRequest.topic.baseLevel === "A2"
            ? "Foundation"
            : "Controlled Production";

    return createPracticeSessionRecord(
      viewer,
      sessionIdOrSlug,
      manualTopicRequest.learningMode === "review" ? "review" : "practice",
      manualTopicRequest.topicKey,
      targetLevel,
      sessionTitle,
      manualTopicRequest.topic.supportObjective,
      lane,
      blueprints,
    );
  }

  const records = await getMasteryRecordsForUser(viewer.id);
  const recommendation = buildRecommendationPayload({
    masteryRecords: records,
    reviewQueue: await getDueReviewItems(viewer.id),
  });

  if (sessionIdOrSlug === "review-due") {
    const dueItems = await getDueReviewItems(viewer.id);
    if (!dueItems.length) {
      return null;
    }

    const structureKey = dueItems[0].structureKey;
    const blueprints = (await pickBlueprintsForUser(viewer.id, structureKey, "review")).map((blueprint, index) => ({
      ...blueprint,
      prompt: dueItems[index]?.prompt ?? blueprint.prompt,
    }));

    return createPracticeSessionRecord(
      viewer,
      sessionIdOrSlug,
      "review",
      structureKey,
      dueItems[0].targetLevel,
      "Review Recovery Queue",
      "Recover weak points before they slide backward.",
      "Controlled Production",
      blueprints,
    );
  }

  let effectiveRecommendation = recommendation;
  if (sessionIdOrSlug === "best-next" && recommendation.selected.kind !== "due_review") {
    const completedTodaySessions = await getCompletedPracticeSessionsSince(
      viewer.id,
      startOfDay(new Date()),
    );
    const completedTodayStructureKeys = new Set(
      completedTodaySessions.map((row) => row.primaryStructure),
    );

    if (
      recommendation.selected.structureKey &&
      completedTodayStructureKeys.has(recommendation.selected.structureKey)
    ) {
      const nextAction = chooseNextCandidateAction(
        recommendation.ranked.filter(
          (action) => action.href !== recommendation.selected.href,
        ),
        completedTodayStructureKeys,
        {
          allowDueReview: (await getDueReviewItems(viewer.id)).length > 0,
          allowCustomStructure: false,
        },
      );

      effectiveRecommendation = {
        ...recommendation,
        selected: nextAction,
      };
    }
  }

  const targetRecord =
    sessionIdOrSlug === "momentum-lab"
      ? chooseCustomStructure(records)
      : sessionIdOrSlug === "weakest-area"
        ? records[0]
        : effectiveRecommendation.selected.kind === "due_review"
          ? null
          : records.find(
              (record) =>
                record.structureKey === effectiveRecommendation.selected.structureKey,
            ) ?? records[0];

  if (!targetRecord) {
    return getOrCreatePracticeSession(viewer, "review-due");
  }

  const unit = getStructureUnit(targetRecord.structureKey) ?? structureCatalog[0];
  const blueprints = await pickBlueprintsForUser(
    viewer.id,
    targetRecord.structureKey,
    "practice",
  );
  const title =
    sessionIdOrSlug === "momentum-lab"
      ? `${unit.title} Lift`
      : `${unit.title} Practice Sprint`;

  return createPracticeSessionRecord(
    viewer,
    sessionIdOrSlug,
    "practice",
    targetRecord.structureKey,
    targetRecord.currentLevelBand,
    title,
    unit.supportObjective,
    targetRecord.progressionState === "promotion_candidate"
      ? "Flexible Production"
      : targetRecord.masteryStage === "fragile"
        ? "Controlled Production"
        : "Flexible Production",
    blueprints,
  );
}

export async function storePracticeFeedback(params: {
  viewer: Viewer;
  sessionId: string;
  itemId: string;
  attemptNumber: number;
  response: string;
  feedback: Awaited<ReturnType<typeof import("@/lib/engine/evaluator").evaluatePracticeItem>>;
  responseLatencyMs?: number;
}) {
  const database = requireDb();
  const normalized = params.response.trim().toLowerCase();
  const responseId = crypto.randomUUID();
  const [itemRow] = await database
    .select()
    .from(practiceItems)
    .where(eq(practiceItems.id, params.itemId))
    .limit(1);

  if (!itemRow) {
    return;
  }

  const previousSameTag = await database
    .select({ id: errorEvents.id })
    .from(errorEvents)
    .innerJoin(userResponses, eq(errorEvents.responseId, userResponses.id))
    .where(
      and(
        eq(userResponses.userId, params.viewer.id),
        eq(errorEvents.structureKey, itemRow.structureKey),
      ),
    )
    .limit(1);

  await database.insert(userResponses).values({
    id: responseId,
    userId: params.viewer.id,
    sessionId: params.sessionId,
    itemId: params.itemId,
    rawUserResponse: params.response,
    normalizedResponse: normalized,
    attemptNumber: params.attemptNumber,
    hintCount: params.attemptNumber > 1 ? params.attemptNumber - 1 : 0,
    retryCount: params.attemptNumber - 1,
    responseLatencyMs: params.responseLatencyMs ?? 0,
    firstTrySuccess: params.attemptNumber === 1 && params.feedback.isAccepted,
    repairSuccess: params.attemptNumber > 1 && params.feedback.isAccepted,
    acceptedAnswerShown: false,
    qualityScore: params.feedback.qualityScore,
    responseScore: params.feedback.responseScore,
  });

  await database.insert(feedbackEvents).values({
    id: crypto.randomUUID(),
    responseId,
    highlightedSpans: params.feedback.highlightedSpans,
    hint1: params.feedback.hint1,
    hint2: params.feedback.hint2,
    naturalRewrite: params.feedback.naturalRewrite,
    levelUpVariants: params.feedback.levelUpVariants,
    whyItWorks: params.feedback.whyItWorks,
  });

  if (!params.feedback.isAccepted) {
    await database.insert(errorEvents).values({
      id: crypto.randomUUID(),
      responseId,
      structureKey: itemRow.structureKey,
      errorTags: params.feedback.errorTags,
      severity: params.feedback.highlightedSpans[0]?.severity ?? "medium",
      repeatedError: previousSameTag.length > 0,
    });
  }
}

async function getAffectedStructureKeys(sessionId: string) {
  const database = requireDb();
  const rows = await database
    .select({ structureKey: practiceItems.structureKey })
    .from(practiceItems)
    .where(eq(practiceItems.sessionId, sessionId));

  return [...new Set(rows.map((row) => row.structureKey))];
}

export async function completePracticeSession(params: {
  viewer: Viewer;
  sessionId: string;
  items: Array<{
    itemId: string;
    responseScore: number;
    qualityScore: number;
    revealedAnswer: boolean;
  }>;
}) {
  const database = requireDb();
  const [session] = await database
    .select()
    .from(practiceSessions)
    .where(
      and(
        eq(practiceSessions.id, params.sessionId),
        eq(practiceSessions.userId, params.viewer.id),
      ),
    )
    .limit(1);

  if (!session) {
    throw new Error("Session not found.");
  }

  const reviewCount = params.items.filter((item) => item.responseScore < 0.7).length;
  const latestResponses = await database
    .select({
      id: userResponses.id,
      itemId: userResponses.itemId,
      createdAt: userResponses.createdAt,
    })
    .from(userResponses)
    .where(
      and(
        eq(userResponses.userId, params.viewer.id),
        eq(userResponses.sessionId, params.sessionId),
      ),
    )
    .orderBy(desc(userResponses.createdAt));
  const latestResponseByItem = new Map<string, string>();

  for (const responseRow of latestResponses) {
    if (!latestResponseByItem.has(responseRow.itemId)) {
      latestResponseByItem.set(responseRow.itemId, responseRow.id);
    }
  }

  for (const item of params.items) {
    if (item.revealedAnswer) {
      const responseId = latestResponseByItem.get(item.itemId);

      if (responseId) {
        await database
          .update(userResponses)
          .set({ acceptedAnswerShown: true })
          .where(eq(userResponses.id, responseId));
      }
    }

    if (item.responseScore >= 0.7) {
      continue;
    }

    const [practiceItemRow] = await database
      .select()
      .from(practiceItems)
      .where(eq(practiceItems.id, item.itemId))
      .limit(1);

    if (!practiceItemRow) {
      continue;
    }

    await database.insert(reviewItems).values({
      id: crypto.randomUUID(),
      userId: params.viewer.id,
      structureKey: practiceItemRow.structureKey,
      source:
        item.responseScore < 0.45 ? "failed_structure" : "repeated_mistake",
      prompt: practiceItemRow.prompt,
      dueAt: addDays(new Date(), getReviewDelayDays(item.responseScore)),
      status: "due",
    });
  }

  if (session.mode === "review") {
    const due = await database
      .select()
      .from(reviewItems)
      .where(
        and(
          eq(reviewItems.userId, params.viewer.id),
          eq(reviewItems.status, "due"),
        ),
      );

    const byStructure = new Set(
      (
        await database
          .select({ structureKey: practiceItems.structureKey })
          .from(practiceItems)
          .where(eq(practiceItems.sessionId, params.sessionId))
      ).map((row) => row.structureKey),
    );

    for (const reviewItem of due.filter((item) => byStructure.has(item.structureKey))) {
      await database
        .update(reviewItems)
        .set({ status: "completed" })
        .where(eq(reviewItems.id, reviewItem.id));
    }
  }

  const affectedKeys = await getAffectedStructureKeys(params.sessionId);
  const updatedRecords: MasteryRecord[] = [];

  for (const structureKey of affectedKeys) {
    const record = await buildMasterySeedFromHistory(params.viewer.id, structureKey);
    if (!record) {
      continue;
    }

    await persistMasteryRecord(record);
    await ensureProgressionDecision(params.viewer.id, params.sessionId, record);
    updatedRecords.push(record);
  }

  const allRecords = await getMasteryRecordsForUser(params.viewer.id);
  const [profileRow] = await requireDb()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, params.viewer.id))
    .limit(1);
  const levels = levelFromProfile(profileRow ?? {});
  await upsertSkillProfiles(params.viewer.id, allRecords);
  await upsertAchievements(params.viewer.id, allRecords);
  const leagueState = await upsertLeagueState(
    params.viewer.id,
    params.viewer.name,
    allRecords,
    levels.overallLevel,
  );
  const recommendation = await buildRecommendationForUser(params.viewer.id);

  const summary = summarizeSession(params.sessionId, params.items, recommendation);

  await database
    .update(practiceSessions)
    .set({ learningScore: summary.learningScore })
    .where(eq(practiceSessions.id, params.sessionId));

  return {
    ...summary,
    reviewItemsCreated: reviewCount,
    leagueImpact: `+${Math.max(6, Math.round(leagueState.weeklyLearningScore / 10))} weekly score`,
  };
}

export async function getDueReviewItems(userId: string): Promise<ReviewItem[]> {
  const database = requireDb();
  const rows = await database
    .select()
    .from(reviewItems)
    .where(
      and(
        eq(reviewItems.userId, userId),
        eq(reviewItems.status, "due"),
        lte(reviewItems.dueAt, new Date()),
      ),
    )
    .orderBy(asc(reviewItems.dueAt));

  const mastery = await getMasteryRecordsForUser(userId);
  const masteryByKey = new Map(
    mastery.map((record) => [record.structureKey, record.currentLevelBand]),
  );

  return rows.map((row) => ({
    id: row.id,
    structureKey: row.structureKey,
    topicTitle: humanizeStructureKey(row.structureKey),
    builderKind: getStructureUnit(row.structureKey)?.builderKind ?? "grammar",
    prompt: row.prompt,
    targetLevel: masteryByKey.get(row.structureKey) ?? "B1",
    dueAt: row.dueAt.toISOString(),
    source: row.source as ReviewItem["source"],
    note: `Scheduled for ${formatDateShort(row.dueAt)} because ${titleCase(row.source).toLowerCase()} still needs reinforcement.`,
  }));
}

function buildDecisionLogFromRecord(
  viewer: Viewer,
  record: MasteryRecord,
  recommendation: RecommendationPayload,
): DecisionLog {
  const decision = buildProgressionDecision(record);
  return {
    decisionId: `${viewer.id}:${record.structureKey}`,
    userId: viewer.id,
    sessionId: "latest",
    structureKey: record.structureKey,
    decisionType: decision.decisionType,
    previousState: decision.previousState,
    newState: decision.newState,
    currentLevelBand: record.currentLevelBand,
    targetLevelBand: decision.targetLevelBand,
    decisionTimestamp: new Date().toISOString(),
    decisionConfidence: decision.confidence,
    reasonCodes: decision.reasonCodes,
    inputSnapshot: {
      masteryScore: record.masteryScore,
      firstTrySuccessRate14d: record.firstTrySuccessRate14d,
      repairSuccessRate14d: record.repairSuccessRate14d,
      reviewSuccessRate30d: record.reviewSuccessRate30d,
      repeatedErrorRate14d: record.repeatedErrorRate14d,
      hintDependenceRate14d: record.hintDependenceRate14d,
    },
    candidateActions: recommendation.ranked,
    selectedAction: recommendation.selected,
    llmUsed: false,
    llmModel: "",
    llmRationale: recommendation.rationale,
    expectedEffect: decision.expectedEffect,
    evaluationWindowEnd: addDays(new Date(), 7).toISOString(),
    observedEffect: "insufficient_data",
    decisionQuality: "pending",
    overriddenByRule: false,
  };
}

async function getLatestDecisionLog(
  viewer: Viewer,
  weakestRecord: MasteryRecord,
  recommendation: RecommendationPayload,
) {
  const database = requireDb();
  const [decision] = await database
    .select()
    .from(progressionDecisions)
    .where(eq(progressionDecisions.userId, viewer.id))
    .orderBy(desc(progressionDecisions.createdAt))
    .limit(1);

  if (!decision) {
    return buildDecisionLogFromRecord(viewer, weakestRecord, recommendation);
  }

  return {
    decisionId: decision.id,
    userId: viewer.id,
    sessionId: decision.sessionId,
    structureKey: decision.structureKey,
    decisionType: decision.decisionType as DecisionLog["decisionType"],
    previousState: decision.previousState as DecisionLog["previousState"],
    newState: decision.newState as DecisionLog["newState"],
    currentLevelBand: decision.currentLevelBand as LevelBand,
    targetLevelBand: decision.targetLevelBand as LevelBand,
    decisionTimestamp: decision.createdAt.toISOString(),
    decisionConfidence: decision.decisionConfidence,
    reasonCodes: decision.reasonCodes as string[],
    inputSnapshot: decision.inputSnapshot as Record<string, number>,
    candidateActions: recommendation.ranked,
    selectedAction: recommendation.selected,
    llmUsed: decision.llmUsed,
    llmModel: decision.llmModel,
    llmRationale: decision.llmRationale,
    expectedEffect: decision.expectedEffect,
    evaluationWindowEnd: addDays(decision.createdAt, 7).toISOString(),
    observedEffect: decision.observedEffect as DecisionLog["observedEffect"],
    decisionQuality: decision.decisionQuality as DecisionLog["decisionQuality"],
    overriddenByRule: decision.overriddenByRule,
  };
}

export async function getDashboardSnapshot(
  viewer: Viewer,
): Promise<DashboardSnapshot | null> {
  const database = requireDb();
  const profile = await getProfileRow(viewer.id);
  const assessment = await getLatestAssessment(viewer.id);
  if (!profile || !assessment) {
    return null;
  }

  const mastery = await getMasteryRecordsForUser(viewer.id);
  if (!mastery.length) {
    return null;
  }

  const reviewQueue = await getDueReviewItems(viewer.id);
  const recommendation = buildRecommendationPayload({
    masteryRecords: mastery,
    reviewQueue,
  });
  const skillSnapshots = await upsertSkillProfiles(viewer.id, mastery);
  const weakestStructure = mastery[0];
  const strongestStructure = [...mastery].sort(
    (left, right) => right.masteryScore - left.masteryScore,
  )[0];
  const decisionLog = await getLatestDecisionLog(
    viewer,
    weakestStructure,
    recommendation,
  );
  const league = await getLeagueSnapshot(viewer);
  const levels = levelFromProfile(profile);
  const now = new Date();
  const week = currentWeekWindow(now);
  const lookbackStart = subDays(now, 14);
  const recommendedStructureKey =
    recommendation.selected.structureKey ??
    reviewQueue[0]?.structureKey ??
    weakestStructure.structureKey;
  const focusRecord =
    mastery.find((record) => record.structureKey === recommendedStructureKey) ??
    weakestStructure;
  const focusUnit =
    getStructureUnit(recommendedStructureKey) ??
    getStructureUnit(focusRecord.structureKey) ??
    structureCatalog[0];

  const [weekSessions, responseRows14, todayCompletedSessions] = await Promise.all([
    database
      .select()
      .from(practiceSessions)
      .where(
        and(
          eq(practiceSessions.userId, viewer.id),
          gte(practiceSessions.createdAt, week.startsAt),
          lte(practiceSessions.createdAt, week.endsAt),
        ),
      ),
    database
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.userId, viewer.id),
          gte(userResponses.createdAt, lookbackStart),
        ),
      ),
    getCompletedPracticeSessionsSince(viewer.id, startOfDay(now)),
  ]);

  const latestAttempts14d = collapseToLatestAttempts(responseRows14);
  const responseIds = latestAttempts14d.map((row) => row.id);
  const responseSessionIds = [...new Set(latestAttempts14d.map((row) => row.sessionId))];
  const [responseSessions, errorRows14, feedbackRows14] = await Promise.all([
    responseSessionIds.length
      ? database
          .select()
          .from(practiceSessions)
          .where(inArray(practiceSessions.id, responseSessionIds))
      : Promise.resolve([]),
    responseIds.length
      ? database
          .select()
          .from(errorEvents)
          .where(inArray(errorEvents.responseId, responseIds))
      : Promise.resolve([]),
    responseIds.length
      ? database
          .select()
          .from(feedbackEvents)
          .where(inArray(feedbackEvents.responseId, responseIds))
      : Promise.resolve([]),
  ]);

  const sessionById = new Map(
    [...weekSessions, ...responseSessions].map((row) => [row.id, row]),
  );
  const sessionModeById = new Map(
    responseSessions.map((row) => [row.id, row.mode as PracticeSession["mode"]]),
  );
  const repeatedByResponseId = new Map<string, boolean>();
  for (const row of errorRows14) {
    repeatedByResponseId.set(
      row.responseId,
      (repeatedByResponseId.get(row.responseId) ?? false) || row.repeatedError,
    );
  }
  const feedbackByResponseId = new Map(
    feedbackRows14.map((row) => [row.responseId, row]),
  );
  const weekAttempts = latestAttempts14d.filter(
    (row) => row.createdAt >= week.startsAt && row.createdAt <= week.endsAt,
  );
  const todayCompletedStructureKeys = new Set(
    todayCompletedSessions.map((session) => session.primaryStructure),
  );
  const selectedStructureKey = recommendation.selected.structureKey;
  const missionAlreadyCompletedToday =
    recommendation.selected.kind !== "due_review" &&
    (selectedStructureKey
      ? todayCompletedStructureKeys.has(selectedStructureKey)
      : false);
  const alternateMissionAction = missionAlreadyCompletedToday
    ? chooseNextCandidateAction(
        recommendation.ranked.filter(
          (action) => action.href !== recommendation.selected.href,
        ),
        todayCompletedStructureKeys,
        {
          allowDueReview: reviewQueue.length > 0,
          allowCustomStructure: false,
        },
      )
    : undefined;
  const reviewHref = reviewQueue.length ? "/practice/review-due" : "/review";
  const todayMission = buildTodayMission(
    recommendation.selected,
    focusUnit,
    reviewQueue.length,
    missionAlreadyCompletedToday,
    alternateMissionAction,
  );
  const whyNow = buildWhyNowCopy(focusRecord, reviewQueue, focusUnit);
  const progressProof = buildProgressProof(
    mastery,
    latestAttempts14d,
    sessionModeById,
    repeatedByResponseId,
  );
  const recentWin = buildRecentWin(
    latestAttempts14d,
    sessionById,
    feedbackByResponseId,
  );
  const practiceCoverage = buildPracticeCoverage(
    weekSessions,
    weekAttempts,
    sessionById,
  );
  const learningMapSummary = buildLearningMapSummary(
    mastery,
    reviewQueue,
    reviewHref,
    recommendation.selected.kind === "due_review"
      ? "/practice/review-due"
      : recommendation.selected.href,
  );
  const nextUnlock = buildNextUnlock(
    mastery,
    reviewQueue,
    reviewHref,
    recommendation.selected.kind === "due_review"
      ? "/practice/review-due"
      : recommendation.selected.href,
  );
  const reviewPressure = buildReviewPressure(reviewQueue, mastery);
  const leagueMini = buildLeagueMini(league);
  const buildersHub = await getBuildersHubSnapshot(viewer);

  return {
    viewer,
    overallLevel: levels.overallLevel,
    currentFocus: focusRecord.title,
    currentFocusReason: whyNow.support,
    dueReviewCount: reviewQueue.length,
    weeklyLearningScore: buildWeeklyLearningScore(mastery),
    mostImprovedArea:
      [...mastery].sort((a, b) => b.masteryDelta7d - a.masteryDelta7d)[0]?.title ??
      weakestStructure.title,
    momentumLabel:
      weakestStructure.progressionState === "promotion_candidate"
        ? "Close to moving up"
        : reviewQueue.length
          ? "Review pressure active"
          : "Steady momentum",
    bestNextPractice: recommendation.selected,
    weakestStructure,
    strongestStructure,
    masteryRecords: mastery,
    reviewQueue,
    skillSnapshots,
    decisionLog,
    league,
    todayMission,
    whyNow,
    progressProof,
    recentWin,
    practiceCoverage,
    learningMapSummary,
    nextUnlock,
    reviewPressure,
    leagueMini,
    builderQuickAccess: buildersHub.builderCards,
    underPracticedAreas: buildersHub.underPracticedAreas,
    continueLearning: buildersHub.continueLearning,
    recentlyLearnedTopics: buildersHub.recentlyLearnedTopics,
  };
}

export async function getProfileSnapshot(
  viewer: Viewer,
): Promise<ProfileSnapshot | null> {
  const dashboard = await getDashboardSnapshot(viewer);
  if (!dashboard) {
    return null;
  }

  const profile = await getProfileRow(viewer.id);
  const levels = levelFromProfile(profile ?? {});
  const recommendation = buildRecommendationPayload({
    masteryRecords: dashboard.masteryRecords,
    reviewQueue: dashboard.reviewQueue,
  });
  const builtAchievements = await upsertAchievements(
    viewer.id,
    dashboard.masteryRecords,
  );

  return {
    viewer: dashboard.viewer,
    overallLevel: levels.overallLevel,
    grammarControl: levels.grammarControl,
    vocabularyUsage: levels.vocabularyUsage,
    sentenceBuilding: levels.sentenceBuilding,
    strengths: buildStrengths(dashboard.masteryRecords),
    growthAreas: buildGrowthAreas(dashboard.masteryRecords),
    structureMap: [...dashboard.masteryRecords].sort(
      (left, right) => right.masteryScore - left.masteryScore,
    ),
    achievements: builtAchievements,
    readinessSignals: [
      dashboard.weakestStructure.progressionState === "review_required"
        ? `${dashboard.weakestStructure.title} needs review before it becomes stable.`
        : `${dashboard.weakestStructure.title} is the clearest growth lever right now.`,
      `${dashboard.strongestStructure.title} is your strongest structure this week.`,
      `${dashboard.mostImprovedArea} is improving fastest over the last seven days.`,
    ],
    repeatedMistake:
      dashboard.reviewQueue[0]?.structureKey
        ? titleCase(dashboard.reviewQueue[0].structureKey)
        : dashboard.weakestStructure.title,
    recommendation,
  };
}

function buildSyntheticMetricTrend(current: number, spread = 0.16) {
  return [
    clamp(current - spread),
    clamp(current - spread * 0.82),
    clamp(current - spread * 0.58),
    clamp(current - spread * 0.36),
    clamp(current - spread * 0.18),
    clamp(current),
  ].map((value) => Math.round(value * 100));
}

export async function getProgressSnapshot(
  viewer: Viewer,
): Promise<ProgressSnapshot | null> {
  const dashboard = await getDashboardSnapshot(viewer);
  if (!dashboard) {
    return null;
  }

  const trendLength = Math.max(
    0,
    ...dashboard.skillSnapshots.map((skill) => skill.trend.length),
  );
  const overallTrend = Array.from({ length: trendLength }, (_, index) =>
    Math.round(
      average(
        dashboard.skillSnapshots.map((skill) => (skill.trend[index] ?? 0) / 100),
      ) * 100,
    ),
  );

  return {
    overallTrend,
    accuracyTrend: buildSyntheticMetricTrend(
      average(
        dashboard.masteryRecords.map((record) => record.firstTrySuccessRate14d),
      ),
      0.18,
    ),
    repairTrend: buildSyntheticMetricTrend(
      average(
        dashboard.masteryRecords.map((record) => record.repairSuccessRate14d),
      ),
      0.16,
    ),
    reviewTrend: buildSyntheticMetricTrend(
      average(
        dashboard.masteryRecords.map((record) => record.reviewSuccessRate30d),
      ),
      0.14,
    ),
    repeatedErrorTrend: buildSyntheticMetricTrend(
      average(
        dashboard.masteryRecords.map((record) =>
          clamp(1 - record.repeatedErrorRate14d),
        ),
      ),
      0.12,
    ),
    structureMap: [...dashboard.masteryRecords].sort(
      (left, right) => right.masteryDelta7d - left.masteryDelta7d,
    ),
  };
}

export async function getLeagueSnapshot(
  viewer: Viewer,
): Promise<LeagueSnapshot> {
  const database = requireDb();
  const profile = await getProfileRow(viewer.id);
  const levels = levelFromProfile(profile ?? {});
  const records = await getMasteryRecordsForUser(viewer.id);
  const leagueState = await upsertLeagueState(
    viewer.id,
    viewer.name,
    records,
    levels.overallLevel,
  );

  const membershipRows = await database
    .select()
    .from(leagueMemberships)
    .where(eq(leagueMemberships.leagueWeekId, leagueState.leagueWeekId));
  const userIds = membershipRows.map((row) => row.userId);
  const scoreRows = userIds.length
    ? await database
        .select()
        .from(leagueScores)
        .where(eq(leagueScores.leagueWeekId, leagueState.leagueWeekId))
    : [];
  const usersRows = userIds.length
    ? await database.select().from(users).where(inArray(users.id, userIds))
    : [];

  const scoreByUserId = new Map(scoreRows.map((row) => [row.userId, row]));
  const userById = new Map(usersRows.map((row) => [row.id, row]));
  const entries: LeagueEntry[] = membershipRows
    .map((membership) => {
      const score = scoreByUserId.get(membership.userId);
      const user = userById.get(membership.userId);
      return {
        rank: 0,
        learner: user?.name ?? user?.email ?? "Learner",
        levelBand: membership.levelBand as LevelBand,
        weeklyLearningScore: round(score?.weeklyLearningScore ?? 0),
        masteryDelta: round(score?.masteryDelta ?? 0),
        leagueStatus: "stay" as const,
        isViewer: membership.userId === viewer.id,
      };
    })
    .sort((left, right) => right.weeklyLearningScore - left.weeklyLearningScore)
    .map((entry, index, list) => ({
      ...entry,
      rank: index + 1,
      leagueStatus:
        index < 5
          ? "promote"
          : index >= Math.max(list.length - 5, 0)
            ? "watch"
            : "stay",
    }));

  const [week] = await database
    .select()
    .from(leagueWeeks)
    .where(eq(leagueWeeks.id, leagueState.leagueWeekId))
    .limit(1);
  const [cup] = await database
    .select()
    .from(structureCups)
    .where(eq(structureCups.leagueWeekId, leagueState.leagueWeekId))
    .limit(1);
  const [boss] = await database
    .select()
    .from(bossSessions)
    .where(eq(bossSessions.id, `${viewer.id}:${leagueState.leagueWeekId}`))
    .limit(1);

  return {
    name: "Weekly League",
    weekLabel: week?.label ?? currentWeekLabel(),
    bracket: leagueState.bracket,
    viewerRank: entries.find((entry) => entry.isViewer)?.rank ?? 1,
    totalMembers: entries.length || 1,
    entries: entries.length
      ? entries
      : [
          {
            rank: 1,
            learner: viewer.name,
            levelBand: levels.overallLevel,
            weeklyLearningScore: leagueState.weeklyLearningScore,
            masteryDelta: leagueState.masteryDelta,
            leagueStatus: "stay",
            isViewer: true,
          },
        ],
    improvementBoard: [...entries].sort(
      (left, right) => right.masteryDelta - left.masteryDelta,
    ),
    structureCup: {
      structureFamily: `${cup?.structureFamily ?? currentCupFamily()} Cup`,
      entries: [...entries].sort(
        (left, right) => right.masteryDelta - left.masteryDelta,
      ),
    },
    bossSessionReady: boss?.status === "ready",
  };
}

export async function getOpsSnapshot(): Promise<OpsSnapshot> {
  const database = requireDb();
  const [{ totalUsers }] = await database
    .select({ totalUsers: sql<number>`count(*)` })
    .from(users);
  const [{ totalSessions }] = await database
    .select({ totalSessions: sql<number>`count(*)` })
    .from(practiceSessions);
  const [{ totalResponses }] = await database
    .select({ totalResponses: sql<number>`count(*)` })
    .from(userResponses);
  const [{ totalReviews }] = await database
    .select({ totalReviews: sql<number>`count(*)` })
    .from(reviewItems);
  const [{ dueReviews }] = await database
    .select({ dueReviews: sql<number>`count(*)` })
    .from(reviewItems)
    .where(and(eq(reviewItems.status, "due"), lte(reviewItems.dueAt, new Date())));
  const [{ totalRecommendations }] = await database
    .select({ totalRecommendations: sql<number>`count(*)` })
    .from(recommendationEvents);
  const [{ acceptedRecommendations }] = await database
    .select({ acceptedRecommendations: sql<number>`count(*)` })
    .from(recommendationEvents)
    .where(eq(recommendationEvents.accepted, true));
  const [{ avgResponseScore }] = await database
    .select({ avgResponseScore: sql<number>`coalesce(avg(${userResponses.responseScore}), 0)` })
    .from(userResponses);

  return {
    learningHealth: [
      {
        label: "Users",
        value: String(totalUsers),
        direction: "flat",
        note: "Authenticated learner accounts in the database.",
      },
      {
        label: "Practice sessions",
        value: String(totalSessions),
        direction: "up",
        note: "Persisted learner sessions tracked in the production database.",
      },
      {
        label: "Average response score",
        value: `${Math.round((avgResponseScore ?? 0) * 100)}%`,
        direction: "flat",
        note: "Current mean response quality across all attempts.",
      },
    ],
    engineQuality: [
      {
        label: "Responses tracked",
        value: String(totalResponses),
        direction: "up",
        note: "Attempts feeding mastery and progression.",
      },
      {
        label: "Due reviews",
        value: String(dueReviews),
        direction: dueReviews > 0 ? "down" : "flat",
        note: "Learners currently needing retention work.",
      },
      {
        label: "Review items",
        value: String(totalReviews),
        direction: "flat",
        note: "Scheduled review inventory created by weak performance.",
      },
    ],
    retentionAndMotivation: [
      {
        label: "League members",
        value: String(totalUsers),
        direction: "flat",
        note: "Users who can appear in real weekly brackets.",
      },
      {
        label: "Recommendations accepted",
        value: String(acceptedRecommendations),
        direction: "up",
        note: "Recommendations that turned into an actual session start.",
      },
      {
        label: "Recommendations served",
        value: String(totalRecommendations),
        direction: "flat",
        note: "Total bounded recommendation events logged so far.",
      },
    ],
    personalizationQuality: [
      {
        label: "Acceptance rate",
        value:
          totalRecommendations > 0
            ? `${Math.round((acceptedRecommendations / totalRecommendations) * 100)}%`
            : "0%",
        direction: acceptedRecommendations > 0 ? "up" : "flat",
        note: "How often the next-action engine turns into real user action.",
      },
      {
        label: "Assessment attempts",
        value: String(
          (
            await database
              .select({ count: sql<number>`count(*)` })
              .from(assessmentAttempts)
          )[0]?.count ?? 0,
        ),
        direction: "flat",
        note: "Placement and recalibration runs stored in production.",
      },
      {
        label: "Live catalog units",
        value: String(
          (
            await database
              .select({ count: sql<number>`count(*)` })
              .from(structureCatalogTable)
          )[0]?.count ?? 0,
        ),
        direction: "flat",
        note: "App-owned structure catalog seeded in the real database.",
      },
    ],
  };
}

export async function getWorkspaceStatus(viewer: Viewer) {
  const profile = await getProfileRow(viewer.id);
  const assessment = await getLatestAssessment(viewer.id);

  return {
    hasOnboarding: Boolean(profile),
    hasAssessment: Boolean(assessment),
    profile,
    assessment,
  };
}
