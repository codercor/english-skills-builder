import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { getBuildersHubSnapshot } from "@/lib/server/topic-views";
import { getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";

export default async function BuildersHubPage() {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Builders open after your learner profile exists"
        body="The builders need your goal and pressure profile before they can decide what to surface first."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Builders unlock after placement"
        body="Placement gives the builders a real starting band and keeps manual practice connected to the same mastery system."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const snapshot = await getBuildersHubSnapshot(viewer);

  return (
    <div className="space-y-5">
      <Surface className="tonal-card space-y-4">
        <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
          Builder system
        </Badge>
        <div>
          <h1 className="text-[clamp(2.3rem,5vw,4rem)] font-semibold text-[color:var(--color-ink)]">
            Choose what to build, then practise it until it holds
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            Recommendation still matters, but you can now enter grammar, vocabulary, phrases, and sentence work directly. Every builder lesson still feeds the same mastery, review, and learning map engine.
          </p>
        </div>
      </Surface>

      <section className="grid gap-5 lg:grid-cols-2">
        {snapshot.builderCards.map((builder) => (
          <Surface key={builder.builderKind} className="tonal-card space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="editorial-kicker">{builder.title}</p>
                <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                  {builder.learnedTopics} topics touched
                </h2>
              </div>
              <Badge>{builder.dueReviews} due review</Badge>
            </div>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              {builder.description}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">Active</p>
                <p className="mt-3 text-2xl font-semibold text-[color:var(--color-ink)]">
                  {builder.activeTopics}
                </p>
              </div>
              <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">Weakest</p>
                <p className="mt-3 text-sm font-semibold text-[color:var(--color-ink)]">
                  {builder.weakestTopicTitle ?? "Ready to explore"}
                </p>
              </div>
              <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">Entry</p>
                <p className="mt-3 text-sm font-semibold text-[color:var(--color-ink)]">
                  Direct topic library
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={builder.recommendedHref}>
                <Button>Start recommended</Button>
              </Link>
              <Link href={builder.continueHref}>
                <Button variant="secondary">Continue topic</Button>
              </Link>
              <Link href={builder.href}>
                <Button variant="ghost">
                  Browse topics
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </div>
          </Surface>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Surface className="tonal-card space-y-4">
          <div>
            <p className="editorial-kicker">Continue learning</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              Pick up where your real work stopped
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.continueLearning.length ? (
              snapshot.continueLearning.map((item) => (
                <Link href={item.href} key={`${item.builderKind}-${item.title}`}>
                  <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)] transition hover:bg-[color:var(--color-soft)]">
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                      {item.note}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                No live builder history yet. Start one topic and this column will turn into your continuation rail.
              </div>
            )}
          </div>
        </Surface>

        <Surface className="tonal-card space-y-4">
          <div>
            <p className="editorial-kicker">Under-practised</p>
            <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
              Areas still waiting for real reps
            </h2>
          </div>
          <div className="grid gap-3">
            {snapshot.underPracticedAreas.map((item) => (
              <Link href={item.href} key={`${item.builderKind}-${item.title}`}>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)] transition hover:bg-[color:var(--color-soft)]">
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                    {item.note}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </Surface>
      </section>
    </div>
  );
}
