import { OnboardingClient } from "@/components/onboarding-client";
import { getPersistedOnboardingProfile } from "@/lib/onboarding-store";
import { getViewer } from "@/lib/session";

export default async function OnboardingPage() {
  const viewer = await getViewer();
  const initialPersistedProfile = await getPersistedOnboardingProfile(viewer.id);

  return (
    <OnboardingClient
      initialProfile={initialPersistedProfile ?? undefined}
      viewerId={viewer.id || "demo"}
    />
  );
}
