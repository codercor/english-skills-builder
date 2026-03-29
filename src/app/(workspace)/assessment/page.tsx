import { AssessmentHandoff } from "@/components/assessment-handoff";
import { AssessmentClient } from "@/components/assessment-client";
import { SetupState } from "@/components/setup-state";
import { getPersistedOnboardingProfile } from "@/lib/onboarding-store";
import { getAssessmentQuestions } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";

export default async function AssessmentPage() {
  const viewer = await getViewer();
  const persistedProfile = await getPersistedOnboardingProfile(viewer.id);

  if (!persistedProfile || persistedProfile.completionState === "draft") {
    return (
      <SetupState
        badge="onboarding required"
        title="Finish onboarding before you take placement"
        body="Placement can stand on its own, but it feels much more helpful when we already know your goal, rhythm, and the kind of coaching you want."
        actionHref="/onboarding"
        actionLabel="Complete onboarding"
      />
    );
  }

  const questions = await getAssessmentQuestions();

  return (
    <div className="space-y-5">
      <AssessmentHandoff profile={persistedProfile} />
      <section className="space-y-4 px-1">
        <p className="inline-flex rounded-full bg-[color:var(--color-coach-highlight)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-ink)]">
          quick placement
        </p>
        <div>
          <h1 className="max-w-3xl text-4xl font-semibold text-[color:var(--color-ink)]">
            A short placement, then your first real practice lane.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            These 10 prompts mix completion, repair, and open production. The result
            sets your starting level and sharpens what home recommends next.
          </p>
        </div>
      </section>
      <AssessmentClient questions={questions} />
    </div>
  );
}
