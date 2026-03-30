import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LearningMapGraph } from "@/components/learning-map-graph";
import { ProfileProgressInsights } from "@/components/profile-progress-insights";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { toUserFacingStage } from "@/lib/engine/profile";
import {
  getProfileSnapshot,
  getProgressSnapshot,
  getWorkspaceStatus,
} from "@/lib/server/learning";
import { getLearningMapSnapshot } from "@/lib/server/topic-views";
import { getViewer } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

type ProfileTab = "overview" | "map" | "progress";

function normalizeProfileTab(value?: string): ProfileTab {
  if (value === "map" || value === "progress") {
    return value;
  }

  return "overview";
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);
  const { tab } = await searchParams;
  const activeTab = normalizeProfileTab(tab);

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

  const [snapshot, learningMapSnapshot, progressSnapshot] = await Promise.all([
    getProfileSnapshot(viewer),
    getLearningMapSnapshot(viewer),
    getProgressSnapshot(viewer),
  ]);

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
      <Surface className="space-y-5 tonal-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
              learner profile
            </Badge>
            <h1 className="mt-4 text-[clamp(2.4rem,5vw,4rem)] font-semibold text-[color:var(--color-ink)]">
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
            <div
              key={card.label}
              className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
            >
              <p className="editorial-kicker">
                {card.label}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold text-[color:var(--color-ink)]">
                {card.value}
              </p>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "overview", label: "Overview" },
            { key: "map", label: "Learning map" },
            { key: "progress", label: "Progress insights" },
          ].map((item) => {
            const isActive = activeTab === item.key;
            return (
              <Link
                key={item.key}
                href={item.key === "overview" ? "/profile" : `/profile?tab=${item.key}`}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.05rem] transition ${
                  isActive
                    ? "bg-[color:var(--color-primary)] !text-white hover:!text-white"
                    : "bg-[color:var(--color-panel)] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </Surface>

      {activeTab === "overview" ? (
        <>
          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <Surface className="space-y-4 tonal-card">
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
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                  >
                    {strength}
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="space-y-4 tonal-card">
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
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                  >
                    {area}
                  </div>
                ))}
              </div>
            </Surface>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <Surface className="space-y-4 tonal-card">
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
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
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
              <Surface className="space-y-4 tonal-card">
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
                      className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
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

              <Surface className="space-y-4 tonal-card">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    Recommendations
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                    What the engine would do next
                  </h2>
                </div>
                <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] p-5 text-white shadow-[0_24px_52px_rgba(25,28,29,0.1)]">
                  <p className="text-sm font-semibold">{snapshot.recommendation.selected.title}</p>
                  <p className="mt-2 text-sm leading-7 text-white/78">
                    {snapshot.recommendation.rationale}
                  </p>
                </div>
                <div className="grid gap-2">
                  {snapshot.readinessSignals.map((signal) => (
                    <div
                      key={signal}
                      className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-3 text-sm leading-7 text-[color:var(--color-ink)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
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
        </>
      ) : null}

      {activeTab === "map" ? (
        <section className="space-y-4">
          <Surface className="space-y-4 tonal-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  Learning map
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                  The full topic graph now lives inside your profile
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                  This view connects builders, topics, prerequisites, review pressure, and current mastery in one place. Use it to see what you have touched, what is fading, and exactly where to jump back into practice.
                </p>
              </div>
              <Link href="/builders" className="inline-flex">
                <Button variant="secondary">
                  Open builders
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </Surface>

          <LearningMapGraph snapshot={learningMapSnapshot} />
        </section>
      ) : null}

      {activeTab === "progress" ? (
        <section className="space-y-4">
          <Surface className="space-y-4 tonal-card">
            <div>
              <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
                progress intelligence
              </Badge>
              <h2 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold text-[color:var(--color-ink)]">
                See improvement as skill movement, not just as activity
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                These charts turn engine signals into a clearer learning picture: stronger first tries, better repairs, more stable reviews, and the structures currently moving fastest.
              </p>
            </div>
          </Surface>

          {progressSnapshot ? (
            <ProfileProgressInsights snapshot={progressSnapshot} />
          ) : (
            <Surface className="space-y-3 tonal-card">
              <p className="editorial-kicker">Progress unavailable</p>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                Finish placement and complete at least one session so the profile can build live trend lines for this tab.
              </p>
              <Link href="/home" className="inline-flex">
                <Button>Go to home</Button>
              </Link>
            </Surface>
          )}
        </section>
      ) : null}
    </div>
  );
}
