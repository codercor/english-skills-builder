import { average, clamp, round } from "@/lib/utils";

export interface ResponseScoreInput {
  firstTryAccuracy: number;
  repairSuccess: number;
  lowHintDependence: number;
  lowErrorSeverity: number;
  naturalnessQuality: number;
}

export type SpeedProfile = "recognition" | "controlled";

export function calculateResponseScore(input: ResponseScoreInput) {
  return round(
    clamp(
      input.firstTryAccuracy * 0.4 +
        input.repairSuccess * 0.25 +
        input.lowHintDependence * 0.15 +
        input.lowErrorSeverity * 0.1 +
        input.naturalnessQuality * 0.1,
    ),
  );
}

export function calculateSpeedBonus(
  latencyMs: number,
  profile: SpeedProfile,
) {
  const seconds = latencyMs / 1000;

  if (profile === "recognition") {
    if (seconds <= 8) {
      return 0.06;
    }

    if (seconds <= 14) {
      return 0.04;
    }

    if (seconds <= 22) {
      return 0.02;
    }

    return 0;
  }

  if (seconds <= 14) {
    return 0.05;
  }

  if (seconds <= 24) {
    return 0.03;
  }

  if (seconds <= 36) {
    return 0.01;
  }

  return 0;
}

export function calculateSessionScore(
  responseScores: number[],
  completionBonus: number,
  repeatedErrorPenalty: number,
) {
  return round(
    clamp(average(responseScores) + completionBonus - repeatedErrorPenalty),
  );
}

export function calculateWeeklyLearningScore(input: {
  firstTrySuccess: number;
  repairSuccess: number;
  reviewWins: number;
  difficultyMultiplier: number;
  consistencyBonus: number;
}) {
  return round(
    clamp(
      input.firstTrySuccess * 0.35 +
        input.repairSuccess * 0.25 +
        input.reviewWins * 0.2 +
        input.difficultyMultiplier * 0.1 +
        input.consistencyBonus * 0.1,
    ) * 100,
    1,
  );
}
