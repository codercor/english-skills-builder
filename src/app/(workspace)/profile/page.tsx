import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { toUserFacingStage } from "@/lib/engine/profile";
import { getProfileSnapshot, getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

export default async function ProfilePage() {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Profile insights start after onboarding"
        body="The profile view translates internal engine state into readable learner signals. It needs your goal settings first."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Profile insights start after placement"
        body="The profile only becomes meaningful once the first assessment creates your real level, weak areas, and baseline mastery map."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const snapshot = await getProfileSnapshot(viewer);

  if (!snapshot) {
    return (
      <SetupState
        badge="profile unavailable"
        title="We could not build your profile snapshot yet"
        body="Your account is connected, but the learner profile needs one complete assessment and at least one generated snapshot."
        actionHref="/home"
        actionLabel="Back to home"
      />
    );
  }

  return (
    <div className="space-y-5">
      <Surface className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
              learner profile
            </Badge>
            <h1 className="mt-3 text-4xl font-semibold text-[color:var(--color-ink)]">
              Progress you can actually read
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
              Internal engine telemetry stays hidden. What you see here is the learner-facing dashboard: levels, strengths, weaknesses, readiness signals, and the next action that matters.
            </p>
          </div>
          <Link href="/profile/recalibrate">
            <Button size="lg" variant="secondary">
              Recalibrate
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Overall", value: snapshot.overallLevel },
            { label: "Grammar control", value: snapshot.grammarControl },
            { label: "Vocabulary usage", value: snapshot.vocabularyUsage },
            { label: "Sentence building", value: snapshot.sentenceBuilding },
          ].map((card) => (
            <Surface key={card.label} className="rounded-3xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-semibold">{card.value}</p>
            </Surface>
          ))}
        </div>
      </Surface>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Strengths
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              What is already working
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.strengths.map((strength) => (
              <div
                key={strength}
                className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)]"
              >
                {strength}
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Growth areas
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              What still needs pressure
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.growthAreas.map((area) => (
              <div
                key={area}
                className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)]"
              >
                {area}
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Structure map
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              Mastery translated into plain language
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.structureMap.map((record) => (
              <div
                key={record.structureKey}
                className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {record.title}
                    </p>
                    <p className="text-xs text-[color:var(--color-muted)]">
                      {toUserFacingStage(record)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--color-teal)]">
                    {formatPercent(record.masteryScore)}
                  </p>
                </div>
                <Meter className="mt-3" value={record.masteryScore} />
              </div>
            ))}
          </div>
        </Surface>

        <div className="grid gap-5">
          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Achievements
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                Quality-based game layer
              </h2>
            </div>
            <div className="grid gap-3">
              {snapshot.achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                        {achievement.title}
                      </p>
                      <p className="text-xs text-[color:var(--color-muted)]">
                        {achievement.description}
                      </p>
                    </div>
                    <Badge>{achievement.status.replace("_", " ")}</Badge>
                  </div>
                  <Meter className="mt-3" value={achievement.progress} />
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Recommendations
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                What the engine would do next
              </h2>
            </div>
            <Surface className="rounded-3xl bg-[linear-gradient(135deg,#102133,#163451)] p-5 text-white">
              <p className="text-sm font-semibold">{snapshot.recommendation.selected.title}</p>
              <p className="mt-2 text-sm leading-7 text-white/78">
                {snapshot.recommendation.rationale}
              </p>
            </Surface>
            <div className="grid gap-2">
              {snapshot.readinessSignals.map((signal) => (
                <div
                  key={signal}
                  className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-3 text-sm leading-7 text-[color:var(--color-ink)]"
                >
                  {signal}
                </div>
              ))}
            </div>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              Most repeated mistake: {snapshot.repeatedMistake}
            </p>
          </Surface>
        </div>
      </section>
    </div>
  );
}
