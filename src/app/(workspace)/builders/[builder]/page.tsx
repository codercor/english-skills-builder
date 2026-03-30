import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { builderKindFromSegment } from "@/lib/catalog";
import { getBuilderCatalogSnapshot } from "@/lib/server/topic-views";
import { getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

export default async function BuilderCatalogPage({
  params,
}: {
  params: Promise<{ builder: string }>;
}) {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);
  const { builder } = await params;
  const builderKind = builderKindFromSegment(builder);

  if (!builderKind) {
    notFound();
  }

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Builder topics need your learner profile first"
        body="Save onboarding first so manual topic work stays connected to the same coaching system."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Builder topics open after placement"
        body="Placement decides the starting level band for every builder lesson and keeps manual practice aligned with recommendation."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const snapshot = await getBuilderCatalogSnapshot(viewer, builderKind);

  return (
    <div className="space-y-5">
      <Surface className="tonal-card space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
              {snapshot.title}
            </Badge>
            <h1 className="mt-4 text-[clamp(2.2rem,5vw,3.8rem)] font-semibold text-[color:var(--color-ink)]">
              {snapshot.spotlightTitle}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
              {snapshot.spotlightBody}
            </p>
          </div>
          {snapshot.recommendedTopicHref ? (
            <Link href={snapshot.recommendedTopicHref}>
              <Button size="lg">
                Open recommended topic
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">Total topics</p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {snapshot.totalTopics}
            </p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">Practised</p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {snapshot.practicedTopics}
            </p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">Due review</p>
            <p className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {snapshot.dueReviews}
            </p>
          </div>
        </div>
      </Surface>

      <div className="space-y-5">
        {snapshot.categories.map((category) => (
          <Surface key={category.category} className="tonal-card space-y-4">
            <div>
              <p className="editorial-kicker">{snapshot.title}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {category.category}
              </h2>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {category.topics.map((topic) => (
                <div
                  key={topic.topicKey}
                  className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                        {topic.title}
                      </p>
                      <p className="text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                        {topic.stateLabel} · {topic.levelBand}
                      </p>
                    </div>
                    <Badge>{formatPercent(topic.masteryScore)}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                    {topic.lastActionLabel}
                    {topic.reviewDueCount ? ` · ${topic.reviewDueCount} due review` : ""}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/builders/${snapshot.builderKind}/${topic.topicKey}`}>
                      <Button size="sm">Open topic</Button>
                    </Link>
                    <Link href={`/practice/topic--${snapshot.builderKind}--${topic.topicKey}--${topic.recommendedAction}`}>
                      <Button size="sm" variant="secondary">
                        {topic.recommendedAction === "learn"
                          ? "Start lesson"
                          : topic.recommendedAction === "review"
                            ? "Review"
                            : topic.recommendedAction === "challenge"
                              ? "Challenge"
                              : "Practice"}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}
