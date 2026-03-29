import type { MasteryRecord, ProgressionDecisionPayload, ProgressionState } from "@/lib/types";
import { clamp, round } from "@/lib/utils";

function nextStateForPromotion(state: ProgressionState): ProgressionState {
  if (state === "promotion_candidate") {
    return "promoted_watch";
  }

  if (state === "promoted_watch") {
    return "stable_mastery";
  }

  return "active_flexible";
}

export function buildProgressionDecision(
  record: MasteryRecord,
): ProgressionDecisionPayload {
  if (record.promotionEligible) {
    return {
      decisionType: "promote",
      previousState: record.progressionState,
      newState: nextStateForPromotion(record.progressionState),
      targetLevelBand: record.currentLevelBand,
      confidence: round(clamp(record.masteryConfidence + 0.12)),
      reasonCodes: [
        "high_recent_accuracy",
        "stable_review_performance",
        "low_repeated_errors",
      ],
      expectedEffect: "User should handle more open production with lower hint dependence.",
    };
  }

  if (record.demotionRisk) {
    return {
      decisionType: "assign_review",
      previousState: record.progressionState,
      newState: "review_required",
      targetLevelBand: record.currentLevelBand,
      confidence: round(clamp(record.masteryConfidence)),
      reasonCodes: ["high_hint_dependence", "overdue_review", "unstable_scores"],
      expectedEffect: "User should regain control through targeted review before new difficulty.",
    };
  }

  return {
    decisionType: "hold",
    previousState: record.progressionState,
    newState:
      record.progressionState === "diagnosing"
        ? "active_controlled"
        : record.progressionState,
    targetLevelBand: record.currentLevelBand,
    confidence: round(clamp(record.masteryConfidence - 0.06)),
    reasonCodes: ["insufficient_evidence", "maintain_stretch_zone"],
    expectedEffect: "User stays in the current lane until more evidence accumulates.",
  };
}
