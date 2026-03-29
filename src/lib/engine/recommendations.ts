import type { CandidateAction, DashboardSnapshot, MasteryRecord, RecommendationPayload } from "@/lib/types";

function scoreWeaknessRepair(record: MasteryRecord) {
  return (
    (1 - record.masteryScore) * 0.55 +
    record.repeatedErrorRate14d * 0.25 +
    record.hintDependenceRate14d * 0.2
  );
}

export function buildCandidateActions(
  snapshot: Pick<DashboardSnapshot, "masteryRecords" | "reviewQueue">,
) {
  const weakest = [...snapshot.masteryRecords].sort(
    (left, right) => scoreWeaknessRepair(right) - scoreWeaknessRepair(left),
  )[0];
  const strongest = [...snapshot.masteryRecords].sort(
    (left, right) => right.masteryDelta7d - left.masteryDelta7d,
  )[0];

  const candidates: CandidateAction[] = [
    {
      kind: "weakness_repair",
      title: `Repair ${weakest.title}`,
      structureKey: weakest.structureKey,
      levelBand: weakest.currentLevelBand,
      reason: "This structure is blocking accuracy and keeping repeated errors alive.",
      score: scoreWeaknessRepair(weakest),
      promptType: "guided_generation",
      memoryAnchor: false,
      href: "/practice/best-next",
    },
    {
      kind: "new_practice",
      title: `Build momentum with ${strongest.title}`,
      structureKey: strongest.structureKey,
      levelBand: strongest.currentLevelBand,
      reason: "This structure is close to promotion and can raise your confidence quickly.",
      score: strongest.masteryScore * 0.78,
      promptType: "memory_anchor",
      memoryAnchor: true,
      href: "/practice/momentum-lab",
    },
    {
      kind: "due_review",
      title: "Clear due review",
      reason: "Your review queue is the fastest way to turn short-term wins into stable memory.",
      score: snapshot.reviewQueue.length ? 0.84 : 0.3,
      href: "/practice/review-due",
    },
    {
      kind: "custom_structure",
      title: "Pick a structure manually",
      reason: "Use this when you already know what you want to push.",
      score: 0.42,
      href: "/home#custom-structure",
    },
  ];

  return candidates.sort((left, right) => right.score - left.score);
}

export function buildRecommendationPayload(
  snapshot: Pick<DashboardSnapshot, "masteryRecords" | "reviewQueue">,
): RecommendationPayload {
  const ranked = buildCandidateActions(snapshot);
  const selected = ranked[0];

  return {
    selected,
    ranked,
    rationale:
      selected.kind === "due_review"
        ? "Review is due now, so the fastest path to retention is to recover forgotten patterns before adding new load."
        : "The engine picked the practice that should improve your weakest bottleneck without pushing you out of stretch zone.",
  };
}
