import { headers } from "next/headers";
import { PracticeSessionClient } from "@/components/practice-session-client";
import { SetupState } from "@/components/setup-state";
import {
  getOrCreatePracticeSession,
  getPracticeNavSnapshot,
  getWorkspaceStatus,
} from "@/lib/server/learning";
import { getViewer } from "@/lib/session";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);
  const { sessionId } = await params;

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Set up your profile before you open a practice session"
        body="The practice engine needs your direction, pressure level, and focus pattern before it can choose the right structure lane."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Placement must happen before live practice"
        body="The app does not guess your lane anymore. Finish placement first, then every session will be tied to real level and mastery data."
        actionHref="/assessment"
        actionLabel="Start placement"
      />
    );
  }

  const session = await getOrCreatePracticeSession(viewer, sessionId);
  const referrerHref = (await headers()).get("referer");

  if (!session) {
    return (
      <SetupState
        badge="session unavailable"
        title="There is no session ready for this route yet"
        body="This usually means you do not have due review items or the recommendation engine still needs one more completed assessment."
        actionHref="/home"
        actionLabel="Back to home"
      />
    );
  }

  const nav = await getPracticeNavSnapshot(viewer, session, referrerHref);

  return <PracticeSessionClient nav={nav} session={session} />;
}
