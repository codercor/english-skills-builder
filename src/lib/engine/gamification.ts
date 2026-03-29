import type { Achievement, LeagueEntry, MasteryRecord } from "@/lib/types";
import { calculateWeeklyLearningScore } from "@/lib/engine/scoring";

export function buildAchievements(records: MasteryRecord[]): Achievement[] {
  const stableCount = records.filter((record) => record.masteryStage === "stable").length;
  const reviewRescues = records.filter(
    (record) => record.progressionState === "review_required",
  ).length;

  return [
    {
      id: "repair-streak",
      title: "Repair Streak",
      description: "Repair 12 answers in a row without revealing the model answer.",
      status: "earned",
      progress: 1,
    },
    {
      id: "structure-climber",
      title: "Structure Climber",
      description: "Move one structure into promotion range.",
      status: stableCount > 0 ? "earned" : "in_progress",
      progress: stableCount > 0 ? 1 : 0.7,
    },
    {
      id: "review-save",
      title: "Review Save",
      description: "Recover three structures before they drift backward.",
      status: reviewRescues >= 2 ? "earned" : "in_progress",
      progress: reviewRescues >= 2 ? 1 : 0.66,
    },
  ];
}

export function buildWeeklyLearningScore(records: MasteryRecord[]) {
  const firstTrySuccess =
    records.reduce((sum, record) => sum + record.firstTrySuccessRate14d, 0) /
    records.length;
  const repairSuccess =
    records.reduce((sum, record) => sum + record.repairSuccessRate14d, 0) /
    records.length;
  const reviewWins =
    records.reduce((sum, record) => sum + record.reviewSuccessRate30d, 0) /
    records.length;
  const difficultyMultiplier =
    records.reduce(
      (sum, record) =>
        sum +
        (record.currentLevelBand === "C1"
          ? 1
          : record.currentLevelBand === "B2"
            ? 0.82
            : 0.68),
      0,
    ) / records.length;
  const consistencyBonus =
    records.reduce((sum, record) => sum + record.stabilityScore, 0) / records.length;

  return calculateWeeklyLearningScore({
    firstTrySuccess,
    repairSuccess,
    reviewWins,
    difficultyMultiplier,
    consistencyBonus,
  });
}

export function buildLeagueEntries(
  viewerName: string,
  viewerScore: number,
): LeagueEntry[] {
  const base: Omit<LeagueEntry, "rank" | "isViewer">[] = [
    { learner: "Nora T.", levelBand: "B2", weeklyLearningScore: 88.4, masteryDelta: 0.15, leagueStatus: "promote" },
    { learner: "Mateo R.", levelBand: "B2", weeklyLearningScore: 84.6, masteryDelta: 0.12, leagueStatus: "promote" },
    { learner: viewerName, levelBand: "B1", weeklyLearningScore: viewerScore, masteryDelta: 0.11, leagueStatus: "promote" },
    { learner: "Ivy L.", levelBand: "B1", weeklyLearningScore: 74.1, masteryDelta: 0.09, leagueStatus: "stay" },
    { learner: "Saeed A.", levelBand: "B1", weeklyLearningScore: 72.8, masteryDelta: 0.08, leagueStatus: "stay" },
    { learner: "Lina K.", levelBand: "B1", weeklyLearningScore: 69.3, masteryDelta: 0.06, leagueStatus: "stay" },
    { learner: "Jon B.", levelBand: "B1", weeklyLearningScore: 66.1, masteryDelta: 0.04, leagueStatus: "stay" },
    { learner: "Mina S.", levelBand: "B1", weeklyLearningScore: 61.9, masteryDelta: 0.03, leagueStatus: "watch" },
  ];

  return base.map((entry, index) => ({
    ...entry,
    rank: index + 1,
    isViewer: entry.learner === viewerName,
  }));
}
