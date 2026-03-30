import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { builderRouteSegment } from "@/lib/catalog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { getDueReviewItems, getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatDateShort } from "@/lib/utils";

export default async function ReviewPage() {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Review becomes useful after your learning profile exists"
        body="The review queue is generated from repeated mistakes, low scores, and promotion guardrails. Save onboarding first, then placement."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Review needs real mistakes to work from"
        body="There is no review queue before the first assessment and practice sessions create actual weak points and due dates."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const items = await getDueReviewItems(viewer.id);

  return (
    <div className="space-y-5">
      <Surface className="space-y-4 tonal-card">
        <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
          spaced review engine
        </Badge>
        <div>
          <h1 className="text-4xl font-semibold text-[color:var(--color-ink)]">
            Recover weak points before they slide backward
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            Review items come from repeated mistakes, failed structures, promotion guardrails, and forgotten patterns. Completing them strengthens mastery and your weekly league position at the same time.
          </p>
        </div>
        <Link href={items.length ? "/practice/review-due" : "/home"}>
          <Button size="lg">
            {items.length ? "Start due review" : "Back to home"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </Surface>

      {items.length ? (
        <div className="grid gap-4">
          {items.map((item) => (
            <Surface key={item.id} className="space-y-3 tonal-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    {item.builderKind.replace("_", " ")} · {(item.sourceLabel ?? item.source).replace("_", " ")}
                    {item.targetItemLabel ? ` · ${item.targetItemLabel}` : ""}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[color:var(--color-ink)]">
                    {item.topicTitle}
                  </h2>
                </div>
                <Badge>{formatDateShort(item.dueAt)}</Badge>
              </div>
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                {item.prompt}
              </p>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                {item.note}
              </p>
              <Link href={`/builders/${builderRouteSegment(item.builderKind)}/${item.structureKey}`} className="inline-flex">
                <Button variant="ghost">
                  Open topic
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
            </Surface>
          ))}
        </div>
      ) : (
        <Surface className="space-y-3 tonal-card">
          <h2 className="text-2xl font-semibold text-[color:var(--color-ink)]">
            No due review items right now
          </h2>
          <p className="text-sm leading-7 text-[color:var(--color-muted)]">
            Good sign. Finish another practice session and the queue will rebuild only when a real structure needs another pass.
          </p>
        </Surface>
      )}
    </div>
  );
}
