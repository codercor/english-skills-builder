import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { toUserFacingStage } from "@/lib/engine/profile";
import { getDashboardSnapshot, getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

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
        body="Home, review, mastery, and league all depend on a real starting level. Finish the 10-item placement so the next recommendation reflects your actual English, not a placeholder."
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

  const reviewHref = snapshot.dueReviewCount ? "/practice/review-due" : "/review";

  return (
    <div className="space-y-5">
      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Surface className="space-y-5 bg-[linear-gradient(135deg,#102133,#17354f)] text-white">
          <Badge className="border border-white/10 bg-white/10 text-white">
            {snapshot.overallLevel} overall
          </Badge>
          <div>
            <h1 className="text-4xl font-semibold">
              Practice the bottleneck that will improve your English fastest.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/76">
              The engine picked {snapshot.bestNextPractice.title.toLowerCase()} because{" "}
              {snapshot.bestNextPractice.reason.toLowerCase()}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Link href={snapshot.bestNextPractice.href}>
              <Button className="w-full" size="lg">
                Best next practice
              </Button>
            </Link>
            <Link href="/practice/weakest-area">
              <Button className="w-full" size="lg" variant="secondary">
                Fix weakest area
              </Button>
            </Link>
            <Link href="/practice/momentum-lab">
              <Button className="w-full" size="lg" variant="secondary">
                Custom structure
              </Button>
            </Link>
          </div>
        </Surface>

        <Surface className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Weekly learning score
          </p>
          <p className="text-5xl font-semibold text-[color:var(--color-ink)]">
            {Math.round(snapshot.weeklyLearningScore)}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-3xl bg-[color:var(--color-panel)] p-4">
              <p className="text-sm text-[color:var(--color-muted)]">Due review</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {snapshot.dueReviewCount}
              </p>
            </div>
            <div className="rounded-3xl bg-[color:var(--color-panel)] p-4">
              <p className="text-sm text-[color:var(--color-muted)]">Current focus</p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {snapshot.currentFocus}
              </p>
            </div>
          </div>
        </Surface>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Surface className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Why this practice
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {snapshot.bestNextPractice.title}
              </h2>
            </div>
            <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
              {snapshot.momentumLabel}
            </Badge>
          </div>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            {snapshot.bestNextPractice.reason}
          </p>
          <Surface className="rounded-3xl bg-[color:var(--color-panel)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Engine rationale
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
              {snapshot.decisionLog.llmRationale}
            </p>
          </Surface>
          <Link href={reviewHref} className="inline-flex">
            <Button variant="secondary">
              {snapshot.dueReviewCount ? "Clear review queue" : "Open review hub"}
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </Surface>

        <Surface className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                League snapshot
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {snapshot.league.name}
              </h2>
            </div>
            <Badge>
              {snapshot.league.viewerRank} / {snapshot.league.totalMembers}
            </Badge>
          </div>
          <div className="grid gap-3">
            {snapshot.league.entries.slice(0, 5).map((entry) => (
              <div
                key={`${entry.rank}-${entry.learner}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-3"
              >
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  #{entry.rank}
                </p>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                    {entry.learner}
                  </p>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    {entry.levelBand} · mastery delta +{Math.round(entry.masteryDelta * 100)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[color:var(--color-teal)]">
                  {entry.weeklyLearningScore}
                </p>
              </div>
            ))}
          </div>
        </Surface>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Surface className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Structure mastery map
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              What is strong, what still slips
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.masteryRecords.slice(0, 5).map((record) => (
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

        <Surface className="space-y-4" id="custom-structure">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Skill balance
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              Your current profile
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.skillSnapshots.map((skill) => (
              <div
                key={skill.area}
                className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {skill.label}
                    </p>
                    <p className="text-xs text-[color:var(--color-muted)]">
                      {skill.levelBand}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[color:var(--color-coral)]">
                    {formatPercent(skill.score)}
                  </p>
                </div>
                <Meter className="mt-3" value={skill.score} />
              </div>
            ))}
          </div>
          <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(33,186,168,0.12),rgba(255,107,76,0.12))] p-5">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              Most improved area
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
              {snapshot.mostImprovedArea} is rising fastest because review performance is now translating into better first tries.
            </p>
          </div>
        </Surface>
      </section>
    </div>
  );
}
