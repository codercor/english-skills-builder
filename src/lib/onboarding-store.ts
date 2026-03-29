import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { onboardingProfiles } from "@/lib/db/schema";
import {
  hydrateOnboardingProfile,
  normalizeOnboardingProfile,
  type OnboardingConfidence,
  type OnboardingFrustration,
  type OnboardingGoal,
  type OnboardingProfile,
  type OnboardingProfileInput,
  type OnboardingTimeCommitment,
  type OnboardingTheme,
} from "@/lib/onboarding";

function mapRowToProfile(
  row: typeof onboardingProfiles.$inferSelect,
): OnboardingProfile {
  return hydrateOnboardingProfile({
    goal: row.goal as OnboardingGoal | null,
    timeCommitment: row.timeCommitment as OnboardingTimeCommitment | null,
    confidence: row.confidence as OnboardingConfidence | null,
    frustration: row.frustration as OnboardingFrustration | null,
    ieltsIntent: row.ieltsIntent,
    themes: row.themes as OnboardingTheme[],
    completionState:
      row.completionState as OnboardingProfile["completionState"],
    updatedAt: row.updatedAt.toISOString(),
  });
}

export async function getPersistedOnboardingProfile(userId: string) {
  if (!db) {
    return null;
  }

  const [row] = await db
    .select()
    .from(onboardingProfiles)
    .where(eq(onboardingProfiles.userId, userId))
    .limit(1);

  return row ? mapRowToProfile(row) : null;
}

export async function upsertPersistedOnboardingProfile(
  userId: string,
  input: OnboardingProfileInput,
) {
  if (!db) {
    return null;
  }

  const nextProfile = normalizeOnboardingProfile(input);
  const now = new Date();

  const [row] = await db
    .insert(onboardingProfiles)
    .values({
      userId,
      goal: nextProfile.goal,
      timeCommitment: nextProfile.timeCommitment,
      confidence: nextProfile.confidence,
      frustration: nextProfile.frustration,
      ieltsIntent: nextProfile.ieltsIntent,
      themes: nextProfile.themes,
      completionState: nextProfile.completionState,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: onboardingProfiles.userId,
      set: {
        goal: nextProfile.goal,
        timeCommitment: nextProfile.timeCommitment,
        confidence: nextProfile.confidence,
        frustration: nextProfile.frustration,
        ieltsIntent: nextProfile.ieltsIntent,
        themes: nextProfile.themes,
        completionState: nextProfile.completionState,
        updatedAt: now,
      },
    })
    .returning();

  return row ? mapRowToProfile(row) : null;
}
