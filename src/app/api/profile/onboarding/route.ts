import { NextRequest, NextResponse } from "next/server";
import { onboardingProfileInputSchema } from "@/lib/onboarding";
import { upsertPersistedOnboardingProfile } from "@/lib/onboarding-store";
import { getAuthenticatedUser } from "@/lib/session";
import { saveOnboardingProfile } from "@/lib/server/learning";

export async function PUT(request: NextRequest) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const json = await request.json();
  const parsed = onboardingProfileInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid onboarding payload." },
      { status: 400 },
    );
  }

  const profile = await upsertPersistedOnboardingProfile(user.id, parsed.data);
  await saveOnboardingProfile(
    user,
    {
      ...parsed.data,
      updatedAt: new Date().toISOString(),
    },
  );

  return NextResponse.json({ profile });
}
