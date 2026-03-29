import type { MasteryRecord, MasteryStage, ProgressionState } from "@/lib/types";
import { clamp, round, stddev } from "@/lib/utils";

interface MasterySeed {
  userId: string;
  structureKey: string;
  title: string;
  supportObjective: string;
  currentLevelBand: MasteryRecord["currentLevelBand"];
  attemptCountTotal: number;
  attemptCountRecent: number;
  firstTrySuccessRate14d: number;
  repairSuccessRate14d: number;
  reviewSuccessRate30d: number;
  repeatedErrorRate14d: number;
  hintDependenceRate14d: number;
  promptTypes: readonly MasteryRecord["promptTypes"][number][];
  lastAttemptAt: string;
  lastReviewAt: string;
  nextReviewDueAt: string;
  masteryDelta7d: number;
  recentScores: number[];
}

export function getMasteryStage(score: number): MasteryStage {
  if (score < 0.4) {
    return "fragile";
  }

  if (score < 0.6) {
    return "emerging";
  }

  if (score < 0.8) {
    return "developing";
  }

  return "stable";
}

export function getProgressionState(record: Pick<
  MasteryRecord,
  | "masteryScore"
  | "attemptCountRecent"
  | "reviewSuccessRate30d"
  | "repeatedErrorRate14d"
  | "hintDependenceRate14d"
>): ProgressionState {
  if (record.attemptCountRecent < 3) {
    return "diagnosing";
  }

  if (record.masteryScore < 0.45) {
    return "active_controlled";
  }

  if (record.repeatedErrorRate14d > 0.28 || record.hintDependenceRate14d > 0.26) {
    return "review_required";
  }

  if (record.masteryScore >= 0.8 && record.reviewSuccessRate30d >= 0.7) {
    return "promotion_candidate";
  }

  if (record.masteryScore >= 0.62) {
    return "active_flexible";
  }

  return "active_controlled";
}

export function buildMasteryRecord(seed: MasterySeed): MasteryRecord {
  const stabilityScore = clamp(1 - stddev(seed.recentScores));
  const promptTypeCoverage = clamp(seed.promptTypes.length / 4);
  const masteryScore = clamp(
    seed.firstTrySuccessRate14d * 0.35 +
      seed.repairSuccessRate14d * 0.2 +
      seed.reviewSuccessRate30d * 0.2 +
      stabilityScore * 0.15 +
      promptTypeCoverage * 0.1 -
      seed.repeatedErrorRate14d * 0.1 -
      seed.hintDependenceRate14d * 0.1,
  );
  const masteryStage = getMasteryStage(masteryScore);
  const promotionEligible =
    masteryScore >= 0.8 &&
    seed.attemptCountRecent >= 12 &&
    seed.promptTypes.length >= 2 &&
    seed.reviewSuccessRate30d >= 0.7 &&
    seed.repeatedErrorRate14d < 0.15 &&
    seed.hintDependenceRate14d < 0.2;

  const demotionRisk =
    seed.repeatedErrorRate14d > 0.3 || seed.hintDependenceRate14d > 0.3;

  return {
    userId: seed.userId,
    structureKey: seed.structureKey,
    currentLevelBand: seed.currentLevelBand,
    masteryScore: round(masteryScore),
    masteryStage,
    masteryConfidence: round(clamp((seed.attemptCountRecent / 12) * 0.6 + stabilityScore * 0.4)),
    attemptCountTotal: seed.attemptCountTotal,
    attemptCountRecent: seed.attemptCountRecent,
    firstTrySuccessRate14d: seed.firstTrySuccessRate14d,
    repairSuccessRate14d: seed.repairSuccessRate14d,
    reviewSuccessRate30d: seed.reviewSuccessRate30d,
    repeatedErrorRate14d: seed.repeatedErrorRate14d,
    hintDependenceRate14d: seed.hintDependenceRate14d,
    promptTypeCoverage: round(promptTypeCoverage),
    promptTypes: [...seed.promptTypes],
    stabilityScore: round(stabilityScore),
    lastAttemptAt: seed.lastAttemptAt,
    lastReviewAt: seed.lastReviewAt,
    nextReviewDueAt: seed.nextReviewDueAt,
    promotionEligible,
    demotionRisk,
    progressionState: getProgressionState({
      masteryScore,
      attemptCountRecent: seed.attemptCountRecent,
      reviewSuccessRate30d: seed.reviewSuccessRate30d,
      repeatedErrorRate14d: seed.repeatedErrorRate14d,
      hintDependenceRate14d: seed.hintDependenceRate14d,
    }),
    masteryDelta7d: seed.masteryDelta7d,
    title: seed.title,
    supportObjective: seed.supportObjective,
  };
}
