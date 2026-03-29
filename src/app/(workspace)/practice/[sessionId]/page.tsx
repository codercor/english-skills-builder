import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { PracticeSessionClient } from "@/components/practice-session-client";
import { SetupState } from "@/components/setup-state";
import { getOrCreatePracticeSession, getWorkspaceStatus } from "@/lib/server/learning";
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

  return (
    <div className="space-y-5">
      <Surface className="hidden space-y-3 sm:block">
        <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
          connected practice loop
        </Badge>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
          Every answer in this session updates the same production system: scoring, mastery, progression, review creation, recommendation ranking, and weekly learning score.
        </p>
      </Surface>
      <p className="px-1 text-sm leading-7 text-[color:var(--color-muted)] sm:hidden">
        Each answer updates scoring, mastery, review, and the next recommendation.
      </p>
      <PracticeSessionClient session={session} />
    </div>
  );
}
