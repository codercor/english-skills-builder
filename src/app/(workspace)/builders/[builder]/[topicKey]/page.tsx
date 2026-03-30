import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Meter } from "@/components/ui/meter";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { builderKindFromSegment, builderRouteSegment } from "@/lib/catalog";
import { getTopicDetailSnapshot } from "@/lib/server/topic-views";
import { getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatDateShort, formatPercent } from "@/lib/utils";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ builder: string; topicKey: string }>;
}) {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);
  const { builder, topicKey } = await params;
  const builderKind = builderKindFromSegment(builder);

  if (!builderKind) {
    notFound();
  }

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Topic lessons need your profile first"
        body="Onboarding keeps the topic lesson aligned with your current goal, pace, and support level."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Topic lessons open after placement"
        body="Placement gives every builder topic a real starting level and feeds the same mastery map."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const snapshot = await getTopicDetailSnapshot(viewer, builderKind, topicKey);
  if (!snapshot) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <Surface className="tonal-card space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
                {snapshot.topic.title}
              </Badge>
              <Badge>{snapshot.progress.stateLabel}</Badge>
              <Badge>{snapshot.progress.levelBand}</Badge>
            </div>
            <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.9rem)] font-semibold text-[color:var(--color-ink)]">
              {snapshot.topic.teachingSummary}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
              {snapshot.topic.description}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {snapshot.nextActions.map((action, index) => (
              <Link key={action.label} href={action.href}>
                <Button size="lg" variant={index === 0 ? "primary" : "secondary"}>
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">Mastery</p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {formatPercent(snapshot.progress.masteryScore)}
            </p>
            <Meter className="mt-3" value={snapshot.progress.masteryScore} />
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">First-try accuracy</p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {formatPercent(snapshot.progress.firstTryAccuracy)}
            </p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">Repair success</p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {formatPercent(snapshot.progress.repairSuccess)}
            </p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">Next review</p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--color-ink)]">
              {snapshot.progress.nextReviewAt
                ? formatDateShort(snapshot.progress.nextReviewAt)
                : "Not scheduled"}
            </p>
          </div>
        </div>
      </Surface>

      {snapshot.topic.builderKind === "vocabulary" && snapshot.targetItems.length ? (
        <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
          <Surface className="tonal-card space-y-4">
            <div>
              <p className="editorial-kicker">Target items in this topic</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                The words and chunks this topic is trying to make usable
              </h2>
            </div>
            <div className="grid gap-3">
              {snapshot.targetItems.map((item) => (
                <div
                  key={item.itemKey}
                  className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{item.kind.replace("_", " ")}</Badge>
                    <Badge className="bg-[color:var(--color-soft)] text-[color:var(--color-muted)] shadow-none">
                      {item.register}
                    </Badge>
                  </div>
                  <p className="mt-3 text-base font-semibold text-[color:var(--color-ink)]">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                    {item.gloss}
                  </p>
                  <div className="mt-3 space-y-2 text-sm leading-7">
                    <p className="text-[color:var(--color-ink)]">
                      <span className="font-semibold">Natural pairings:</span>{" "}
                      {item.naturalPairings.join(" · ")}
                    </p>
                    <p className="text-[color:var(--color-muted)]">
                      Good example: <span className="text-[color:var(--color-ink)]">{item.goodExample}</span>
                    </p>
                    <p className="text-[color:var(--color-muted)]">
                      Common trap: {item.commonTrap}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <div className="grid gap-5">
            <Surface className="tonal-card space-y-4">
              <div>
                <p className="editorial-kicker">What you’ve already learned</p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                  Which items are usable, stable, or still fragile
                </h2>
              </div>
              <div className="grid gap-3">
                {snapshot.vocabularyItemProgress.map((item) => (
                  <div
                    key={item.itemKey}
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                          {item.label}
                        </p>
                        <p className="text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                          {item.stateLabel} · {item.register}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                          {item.confidenceLabel}
                        </p>
                      </div>
                      <Badge>{item.successfulUses}/{item.timesUsed || 0} clean uses</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                      {item.lastUsedAt
                        ? `Last used ${formatDateShort(item.lastUsedAt)}`
                        : "Not used in a stored sentence yet."}
                      {item.reviewDue ? " · Review due now" : ""}
                    </p>
                    {item.lastIncorrectReason ? (
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        Last slip: {item.lastIncorrectReason}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                      Next proof needed:{" "}
                      <span className="text-[color:var(--color-ink)]">{item.nextProofNeeded}</span>
                    </p>
                  </div>
                ))}
              </div>
            </Surface>

            <Surface className="tonal-card space-y-4">
              <div>
                <p className="editorial-kicker">Due review cards</p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                  Word cards waiting inside this topic
                </h2>
              </div>
              {snapshot.dueReviewCards.length ? (
                <div className="grid gap-3">
                  {snapshot.dueReviewCards.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                            {item.targetItemLabel}
                          </p>
                          <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                            {item.prompt}
                          </p>
                        </div>
                        <Badge>{formatDateShort(item.dueAt)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  No word cards are due inside this topic right now.
                </div>
              )}
            </Surface>
          </div>
        </section>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Surface className="tonal-card space-y-4">
          <div>
            <p className="editorial-kicker">What it is</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              Use it on purpose, not by guesswork
            </h2>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">When to use it</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                {snapshot.topic.whenToUse}
              </p>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">When not to use it</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                {snapshot.topic.whenNotToUse}
              </p>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">Common mistakes</p>
              <ul className="mt-2 space-y-2 text-sm leading-7 text-[color:var(--color-ink)]">
                {snapshot.topic.commonMistakes.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </Surface>

        <div className="grid gap-5">
          <Surface className="tonal-card space-y-4">
            <div>
              <p className="editorial-kicker">Model examples</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                What good usage sounds like
              </h2>
            </div>
            <div className="grid gap-3">
              {snapshot.topic.examples.map((example) => (
                <div
                  key={example}
                  className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                >
                  {example}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="tonal-card space-y-4">
            <div>
              <p className="editorial-kicker">Practice history</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                The real exercise history for this topic
              </h2>
            </div>
            <div className="grid gap-3">
              {snapshot.practiceHistory.length ? (
                snapshot.practiceHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                          {entry.sessionTitle}
                        </p>
                        <p className="text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                          {entry.mode} · {entry.lane}
                        </p>
                      </div>
                      <Badge>{formatDateShort(entry.createdAt)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge>{entry.firstTrySuccess ? "First try" : "Not first try"}</Badge>
                      <Badge>{entry.repairSuccess ? "Repair success" : "Repair still needed"}</Badge>
                      <Badge>
                        {entry.learningScore !== null
                          ? `Session ${Math.round(entry.learningScore * 100)}`
                          : "Session unfinished"}
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-3 text-sm leading-7">
                      {entry.targetItemLabel ? (
                        <div>
                          <p className="editorial-kicker">Target item</p>
                          <p className="mt-1 text-[color:var(--color-ink)]">
                            {entry.targetItemLabel}
                          </p>
                        </div>
                      ) : null}
                      <div>
                        <p className="editorial-kicker">Prompt</p>
                        <p className="mt-1 text-[color:var(--color-ink)]">
                          {entry.prompt}
                        </p>
                      </div>
                      <div>
                        <p className="editorial-kicker">Your answer</p>
                        <p className="mt-1 text-[color:var(--color-ink)]">
                          {entry.userResponse}
                        </p>
                      </div>
                      {entry.acceptedAnswer ? (
                        <div>
                          <p className="editorial-kicker">Accepted answer</p>
                          <p className="mt-1 text-[color:var(--color-ink)]">
                            {entry.acceptedAnswer}
                          </p>
                        </div>
                      ) : null}
                      {entry.naturalRewrite ? (
                        <div>
                          <p className="editorial-kicker">Natural rewrite</p>
                          <p className="mt-1 text-[color:var(--color-ink)]">
                            {entry.naturalRewrite}
                          </p>
                        </div>
                      ) : null}
                      {entry.feedbackSummary ? (
                        <div>
                          <p className="editorial-kicker">Feedback summary</p>
                          <p className="mt-1 text-[color:var(--color-muted)]">
                            {entry.feedbackSummary}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  No live session yet. Start the lesson and this topic will begin building its own practice history.
                </div>
              )}
            </div>
          </Surface>
        </div>
      </section>

      {snapshot.relatedTopics.length ? (
        <Surface className="tonal-card space-y-4">
          <div>
            <p className="editorial-kicker">Related topics</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              What connects to this topic on your map
            </h2>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {snapshot.relatedTopics.map((topic) => (
              <Link href={`/builders/${builderRouteSegment(topic.builderKind)}/${topic.topicKey}`} key={topic.topicKey}>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)] transition hover:bg-[color:var(--color-soft)]">
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    {topic.title}
                  </p>
                  <p className="mt-2 text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                    {topic.stateLabel}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}
