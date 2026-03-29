import type { MasteryRecord, UserFacingStage } from "@/lib/types";

export function toUserFacingStage(record: MasteryRecord): UserFacingStage {
  if (record.progressionState === "review_required") {
    return "Needs review";
  }

  if (record.progressionState === "promotion_candidate") {
    return "Close to moving up";
  }

  if (record.masteryStage === "fragile") {
    return "Needs work";
  }

  if (record.masteryStage === "emerging") {
    return "Improving";
  }

  if (record.masteryStage === "developing") {
    return "Nearly stable";
  }

  return "Strong";
}

export function buildStrengths(records: MasteryRecord[]) {
  const strongest = [...records]
    .filter((record) => record.masteryScore >= 0.72)
    .sort((left, right) => right.masteryScore - left.masteryScore)
    .slice(0, 3);

  return strongest.map(
    (record) =>
      `${record.title} is working well. You keep control even when prompts become more open.`,
  );
}

export function buildGrowthAreas(records: MasteryRecord[]) {
  const weakest = [...records]
    .sort((left, right) => left.masteryScore - right.masteryScore)
    .slice(0, 3);

  return weakest.map((record) => {
    if (record.structureKey === "articles") {
      return "Articles still break your sentence accuracy and slow your promotion path.";
    }

    if (record.structureKey === "sentence-combining") {
      return "You still rely on short sentence patterns when ideas get longer.";
    }

    return `${record.title} needs reinforcement before it becomes stable.`;
  });
}
