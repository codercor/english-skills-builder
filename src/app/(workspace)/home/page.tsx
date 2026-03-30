import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { getDashboardSnapshot, getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

function skillCommentary(
  skill: { area: string; label: string },
  strongestArea: string,
  weakestArea: string,
) {
  if (skill.area === strongestArea) {
    return "Strongest right now";
  }

  if (skill.area === weakestArea) {
    return "Best next lift";
  }

  return "Steady growth";
}

export default async function HomePage() {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Set your direction before practice starts making assumptions"
        body="Your goal, rhythm, and coach style help the first recommendations feel like guidance instead of guesses. Finish onboarding, then take placement so home can respond to something real."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Take placement before the coaching starts adapting"
        body="Home, review, mastery, and league all depend on a real starting level. Finish the 10-item placement so the next recommendation reflects your actual English."
        actionHref="/assessment"
        actionLabel="Start placement"
      />
    );
  }

  const snapshot = await getDashboardSnapshot(viewer);

  if (!snapshot) {
    return (
      <SetupState
        badge="snapshot unavailable"
        title="We need one more moment to build your live workspace"
        body="Your account is connected, but the learning snapshot is not ready yet. Try placement again or refresh after a few seconds."
        actionHref="/assessment"
        actionLabel="Re-open placement"
      />
    );
  }

  const strongestSkill = [...snapshot.skillSnapshots].sort(
    (left, right) => right.score - left.score,
  )[0];
  const weakestSkill = [...snapshot.skillSnapshots].sort(
    (left, right) => left.score - right.score,
  )[0];

  return (
    <div className="space-y-6">
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
        <Surface className="bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_78%)] px-5 py-6 text-white shadow-[0_32px_96px_rgba(25,28,29,0.14)] sm:px-7 sm:py-7">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-0 bg-white/10 text-white shadow-none">
              {snapshot.overallLevel} overall
            </Badge>
            <Badge className="border-0 bg-white/10 text-white shadow-none">
              {snapshot.todayMission.modeLabel}
            </Badge>
          </div>
          <p className="editorial-kicker mt-5 text-white/60">Today’s mission</p>
          <h1 className="mt-3 max-w-4xl text-[clamp(2.35rem,5.4vw,4.1rem)] font-semibold leading-[0.96] tracking-[-0.05em]">
            {snapshot.todayMission.title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-white/72">
            {snapshot.todayMission.technicalLabel}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge className="border-0 bg-white/10 text-white shadow-none">
              {snapshot.todayMission.targetLevel}
            </Badge>
            <Badge className="border-0 bg-white/10 text-white shadow-none">
              {snapshot.todayMission.promptCount} prompts
            </Badge>
            <Badge className="border-0 bg-white/10 text-white shadow-none">
              {snapshot.momentumLabel}
            </Badge>
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-8 text-white/78">
            {snapshot.todayMission.note}
          </p>
          <div className="mt-6 rounded-[1.8rem] bg-white/10 px-4 py-4">
            <p className="editorial-kicker text-white/58">Success today</p>
            <p className="mt-3 text-sm leading-7 text-white">
              {snapshot.todayMission.successDefinition}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={snapshot.todayMission.primaryAction.href}>
              <Button size="lg">{snapshot.todayMission.primaryAction.label}</Button>
            </Link>
            {snapshot.todayMission.secondaryActions.map((action) => (
              <Link href={action.href} key={action.label}>
                <Button
                  className="bg-white/14 text-white shadow-none hover:bg-white/20 hover:text-white"
                  size="lg"
                  variant="secondary"
                >
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </Surface>

        <div className="grid gap-5">
          <Surface className="tonal-card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="editorial-kicker">Why this now</p>
                <h2 className="mt-3 text-[1.55rem] font-semibold text-[color:var(--color-ink)]">
                  {snapshot.currentFocus}
                </h2>
              </div>
              <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
                {snapshot.todayMission.modeLabel}
              </Badge>
            </div>
            <div className="space-y-4 text-sm leading-7 text-[color:var(--color-ink)]">
              <div className="rounded-[1.6rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">What keeps slipping</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                  {snapshot.whyNow.whatKeepsSlipping}
                </p>
              </div>
              <div className="rounded-[1.6rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">What this practice will improve</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                  {snapshot.whyNow.whatThisImproves}
                </p>
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                {snapshot.whyNow.support}
              </p>
            </div>
          </Surface>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
            <Surface className="tonal-card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="editorial-kicker">Review pressure</p>
                  <h2 className="mt-3 text-[1.45rem] font-semibold text-[color:var(--color-ink)]">
                    {snapshot.reviewPressure.dueCount
                      ? `${snapshot.reviewPressure.dueCount} due now`
                      : "Nothing due right now"}
                  </h2>
                </div>
                <Badge>{snapshot.reviewPressure.overdueCount} overdue</Badge>
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                {snapshot.reviewPressure.note}
              </p>
              <Link href={snapshot.reviewPressure.actionHref} className="inline-flex">
                <Button variant="ghost">
                  {snapshot.reviewPressure.actionLabel}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </Surface>

            <Surface className="tonal-card space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="editorial-kicker">Next unlock</p>
                  <h2 className="mt-3 text-[1.45rem] font-semibold text-[color:var(--color-ink)]">
                    {snapshot.nextUnlock.structureTitle}
                  </h2>
                </div>
                <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
                  {snapshot.nextUnlock.currentStageLabel}
                </Badge>
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-ink)]">
                Move from{" "}
                <span className="font-semibold">{snapshot.nextUnlock.currentStageLabel}</span> to{" "}
                <span className="font-semibold">{snapshot.nextUnlock.nextStageLabel}</span>.
              </p>
              <div className="rounded-[1.6rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">Requirement</p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                  {snapshot.nextUnlock.requirement}
                </p>
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                {snapshot.nextUnlock.note}
              </p>
              <Link href={snapshot.nextUnlock.actionHref} className="inline-flex">
                <Button variant="ghost">
                  {snapshot.nextUnlock.actionLabel}
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </Surface>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="editorial-kicker">Proof you’re improving</p>
          <h2 className="mt-3 text-[1.95rem] font-semibold text-[color:var(--color-ink)]">
            Real evidence from your last two weeks
          </h2>
        </div>
        {snapshot.progressProof.items.length ? (
          <div className="grid gap-5 lg:grid-cols-3">
            {snapshot.progressProof.items.map((item) => (
              <Surface className="tonal-card space-y-4" key={item.id}>
                <p className="editorial-kicker">{item.label}</p>
                <p className="font-display text-[2.6rem] font-semibold leading-none text-[color:var(--color-ink)]">
                  {item.value}
                </p>
                <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                  {item.note}
                </p>
              </Surface>
            ))}
          </div>
        ) : (
          <Surface className="tonal-card">
            <p className="editorial-kicker">{snapshot.progressProof.fallbackTitle}</p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
              {snapshot.progressProof.fallbackBody}
            </p>
          </Surface>
        )}
      </section>

      {snapshot.recentWin ? (
        <Surface className="tonal-card space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="editorial-kicker">Recent win</p>
              <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
                A sentence that got stronger
              </h2>
            </div>
            <Badge>{snapshot.recentWin.structureTitle}</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.8rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">Before</p>
              <p className="mt-3 text-base leading-8 text-[color:var(--color-ink)]">
                {snapshot.recentWin.beforeText}
              </p>
            </div>
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#f1e4c8,#f8efe0)] px-4 py-4">
              <p className="editorial-kicker text-[color:var(--color-hint-ink)]">After</p>
              <p className="mt-3 text-base leading-8 text-[color:var(--color-hint-ink)]">
                {snapshot.recentWin.afterText}
              </p>
            </div>
          </div>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            {snapshot.recentWin.note}
          </p>
        </Surface>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <Surface className="tonal-card space-y-5">
          <div>
            <p className="editorial-kicker">This week’s practice coverage</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
              What you actually worked on
            </h2>
          </div>
          {snapshot.practiceCoverage.practiceSessions || snapshot.practiceCoverage.reviewItems ? (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  <p className="editorial-kicker">Practice sessions</p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
                    {snapshot.practiceCoverage.practiceSessions}
                  </p>
                </div>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  <p className="editorial-kicker">Review items</p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
                    {snapshot.practiceCoverage.reviewItems}
                  </p>
                </div>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  <p className="editorial-kicker">Topics touched</p>
                  <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
                    {snapshot.practiceCoverage.topicsTouched}
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {snapshot.practiceCoverage.builderCounts.map((area) => (
                  <div
                    key={area.builderKind}
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                        {area.label}
                      </p>
                      <p className="text-sm font-semibold text-[color:var(--color-primary)]">
                        {area.count}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshot.practiceCoverage.recentTopics.map((structure) => (
                  <Badge key={structure}>{structure}</Badge>
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              Your coverage map will fill in after your first completed session this week.
            </p>
          )}
        </Surface>

        <Surface className="tonal-card space-y-5">
          <div>
            <p className="editorial-kicker">Builders at a glance</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
              Open practice by builder, not only by recommendation
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.builderQuickAccess.map((item) => (
              <div
                key={item.builderKind}
                className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="editorial-kicker">{item.title}</p>
                    <p className="mt-2 text-base font-semibold text-[color:var(--color-ink)]">
                      {item.learnedTopics} topics touched · {item.activeTopics} active
                    </p>
                    <p className="text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                      {item.dueReviews} due review · {item.weakestTopicTitle ?? "ready to explore"}
                    </p>
                  </div>
                  <Link href={item.href}>
                    <Button variant="ghost">
                      Browse topics
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted)]">
                  {item.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={item.recommendedHref}>
                    <Button size="sm">Start recommended</Button>
                  </Link>
                  <Link href={item.continueHref}>
                    <Button size="sm" variant="secondary">
                      Continue topic
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Link href="/builders" className="inline-flex">
            <Button variant="ghost">
              Open all builders
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </Surface>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Surface className="tonal-card space-y-5">
          <div>
            <p className="editorial-kicker">Practice more where it is thin</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
              What you have not touched enough yet
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.underPracticedAreas.map((item) => (
              <div
                key={`${item.builderKind}-${item.title}`}
                className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="editorial-kicker">{item.title}</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                      {item.note}
                    </p>
                  </div>
                  <Link href={item.href}>
                    <Button variant="ghost">
                      Open
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#f1e4c8,#f8efe0)] px-4 py-4">
            <p className="editorial-kicker text-[color:var(--color-hint-ink)]">Recently learned</p>
            {snapshot.recentlyLearnedTopics.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.recentlyLearnedTopics.map((topic) => (
                  <Link href={topic.href} key={topic.topicKey}>
                    <Badge className="bg-white/70 text-[color:var(--color-hint-ink)] shadow-none">
                      {topic.title} · {topic.stateLabel}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[color:var(--color-hint-ink)]">
                Your first completed builder lesson will begin filling this strip with real learned topics.
              </p>
            )}
          </div>
        </Surface>

        <Surface className="tonal-card space-y-5">
          <div>
            <p className="editorial-kicker">Learning map</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
              What needs attention and what is holding
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.learningMapSummary.map((item) => (
              <div
                key={`${item.label}-${item.structureTitle}`}
                className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="editorial-kicker">{item.label}</p>
                    <p className="mt-2 text-base font-semibold text-[color:var(--color-ink)]">
                      {item.structureTitle}
                    </p>
                    <p className="text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                      {item.stageLabel}
                    </p>
                  </div>
                  <Link href={item.actionHref}>
                    <Button variant="ghost">
                      {item.actionLabel}
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted)]">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
          <Link href="/profile?tab=map" className="inline-flex">
            <Button variant="ghost">
              Open full learning map
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </Surface>
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.98fr_1.02fr]">
        <Surface className="tonal-card space-y-5">
          <div>
            <p className="editorial-kicker">Current profile</p>
            <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
              Where you are strongest and where the lift is next
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.skillSnapshots.map((skill) => (
              <div
                key={skill.area}
                className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {skill.label}
                    </p>
                    <p className="text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                      {skill.levelBand} ·{" "}
                      {skillCommentary(
                        skill,
                        strongestSkill?.area ?? skill.area,
                        weakestSkill?.area ?? skill.area,
                      )}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--color-coral)]">
                    {formatPercent(skill.score)}
                  </p>
                </div>
                <Meter className="mt-4" value={skill.score} />
              </div>
            ))}
          </div>
          <div className="rounded-[1.9rem] bg-[linear-gradient(135deg,#f1e4c8,#f8efe0)] px-5 py-5">
            <p className="editorial-kicker text-[color:var(--color-hint-ink)]">
              Most improved area
            </p>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-hint-ink)]">
              {snapshot.mostImprovedArea} is translating recent review wins into cleaner first tries.
            </p>
          </div>
          {snapshot.continueLearning.length ? (
            <div className="grid gap-3">
              {snapshot.continueLearning.slice(0, 3).map((item) => (
                <Link href={item.href} key={`${item.builderKind}-${item.title}`}>
                  <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)] transition hover:bg-[color:var(--color-soft)]">
                    <p className="editorial-kicker">Continue learning</p>
                    <p className="mt-2 text-sm font-semibold text-[color:var(--color-ink)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                      {item.note}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              Start a builder lesson and this panel will begin surfacing the topics that are worth continuing.
            </div>
          )}
        </Surface>

        <Surface className="tonal-card space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="editorial-kicker">League snapshot</p>
              <h2 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
                Keep competition in the background
              </h2>
            </div>
            <Badge>
              #{snapshot.leagueMini.viewerRank} / {snapshot.leagueMini.totalMembers}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">Weekly score</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
                {Math.round(snapshot.leagueMini.weeklyLearningScore)}
              </p>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">Movement</p>
              <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                {snapshot.leagueMini.movementLabel}
              </p>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">League size</p>
              <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
                {snapshot.leagueMini.totalMembers}
              </p>
            </div>
          </div>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            Your league stays visible, but learning stays first. Use it as background momentum, not as the main reason to open the app.
          </p>
          <Link href={snapshot.leagueMini.href} className="inline-flex">
            <Button variant="ghost">
              Open full league
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </Surface>
      </section>
    </div>
  );
}
