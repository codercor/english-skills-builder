"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { FeedbackPayload, PracticeSession } from "@/lib/types";
import { formatPercent } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TextArea, TextInput } from "@/components/ui/text-input";

type CompletedItem = {
  itemId: string;
  response: string;
  feedback: FeedbackPayload;
  revealedAnswer: boolean;
};

type SessionSummaryPayload = {
  learningScore: number;
  masteryDelta: number;
  reviewItemsCreated: number;
  streakChange: string;
  leagueImpact: string;
  recommendationTitle: string;
  recommendationReason: string;
};

function parseCompletionPrompt(prompt: string) {
  const normalizedPrompt = prompt.replace(
    /^Complete the sentence naturally:\s*/i,
    "",
  );

  if (!normalizedPrompt.includes("____")) {
    return null;
  }

  const segments = normalizedPrompt.split("____");

  if (segments.length < 2) {
    return null;
  }

  return {
    instruction: "Complete the sentence naturally.",
    segments,
  };
}

function buildCompletionResponse(segments: string[], values: string[]) {
  return segments
    .map((segment, index) =>
      index < segments.length - 1 ? `${segment}${values[index] ?? ""}` : segment,
    )
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export function PracticeSessionClient({
  session,
}: {
  session: PracticeSession;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [completionDraft, setCompletionDraft] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackPayload | null>(null);
  const [hasRevealedAnswer, setHasRevealedAnswer] = useState(false);
  const [attempts, setAttempts] = useState<Record<string, number>>({});
  const [completed, setCompleted] = useState<CompletedItem[]>([]);
  const [summary, setSummary] = useState<SessionSummaryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startSubmit] = useTransition();
  const [isCompleting, startComplete] = useTransition();
  const [attemptStartedAt, setAttemptStartedAt] = useState(() => Date.now());
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const completionInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const activeCardRef = useRef<HTMLElement>(null);

  const item = session.items[currentIndex];
  const completionPrompt =
    item.promptType === "completion" ? parseCompletionPrompt(item.prompt) : null;
  const completionBlankCount = completionPrompt
    ? completionPrompt.segments.length - 1
    : 0;
  const currentResponse = completionPrompt
    ? buildCompletionResponse(completionPrompt.segments, completionDraft)
    : draft;
  const currentAttempt = attempts[item.id] ?? 0;
  const activeHint =
    feedback && !feedback.isAccepted
      ? currentAttempt > 1
        ? feedback.hint2
        : feedback.hint1
      : null;
  const primaryHighlightedSpan =
    feedback && !feedback.isAccepted ? feedback.highlightedSpans[0] ?? null : null;

  const scorePreview = useMemo(() => {
    if (!completed.length) {
      return 0;
    }

    const total = completed.reduce((sum, entry) => sum + entry.feedback.responseScore, 0);
    return total / completed.length;
  }, [completed]);

  function hasInputValue() {
    if (completionPrompt) {
      return (
        completionBlankCount > 0 &&
        Array.from({ length: completionBlankCount }, (_, index) =>
          Boolean(completionDraft[index]?.trim()),
        ).every(Boolean)
      );
    }

    return Boolean(draft.trim());
  }

  function submitResponse() {
    startSubmit(async () => {
      try {
        setError(null);

        const response = await fetch("/api/practice/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            itemId: item.id,
            attemptNumber: currentAttempt + 1,
            response: currentResponse,
            responseLatencyMs: Math.max(0, Date.now() - attemptStartedAt),
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "We could not check this sentence. Try again.");
          return;
        }

        const payload = (await response.json()) as FeedbackPayload;
        setFeedback(payload);
        setAttempts((current) => ({
          ...current,
          [item.id]: currentAttempt + 1,
        }));
        setAttemptStartedAt(() => Date.now());

        requestAnimationFrame(() => {
          activeCardRef.current?.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        });

        if (!payload.isAccepted) {
          requestAnimationFrame(() => {
            if (completionPrompt) {
              const firstEmptyIndex = completionDraft.findIndex((value) => !value.trim());
              const focusIndex = firstEmptyIndex === -1 ? 0 : firstEmptyIndex;
              completionInputRefs.current[focusIndex]?.focus();
              return;
            }

            textAreaRef.current?.focus();
            const cursor = draft.length;
            textAreaRef.current?.setSelectionRange(cursor, cursor);
          });
        }
      } catch {
        setError("Network issue while checking your sentence. Try again.");
      }
    });
  }

  function revealModelAnswer() {
    setHasRevealedAnswer(true);
    setError(null);
  }

  function completeCurrent() {
    if (!feedback) {
      return;
    }

    const nextCompleted = [
      ...completed,
      {
        itemId: item.id,
        response: currentResponse,
        feedback,
        revealedAnswer: hasRevealedAnswer,
      },
    ];
    setCompleted(nextCompleted);

    if (currentIndex === session.items.length - 1) {
      startComplete(async () => {
        try {
          setError(null);

          const response = await fetch("/api/practice/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: session.id,
              items: nextCompleted.map((entry) => ({
                itemId: entry.itemId,
                responseScore: entry.feedback.responseScore,
                qualityScore: entry.feedback.qualityScore,
                revealedAnswer: entry.revealedAnswer,
              })),
            }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { error?: string } | null;
            setError(payload?.error ?? "We could not finish this session. Try again.");
            return;
          }

          const payload = (await response.json()) as SessionSummaryPayload;
          setSummary(payload);
        } catch {
          setError("Network issue while finishing the session. Try again.");
        }
      });
      return;
    }

    setCurrentIndex((index) => index + 1);
    setDraft("");
    setCompletionDraft([]);
    setFeedback(null);
    setHasRevealedAnswer(false);
    setError(null);
    setAttemptStartedAt(() => Date.now());
  }

  if (summary) {
    return (
      <Surface className="space-y-5">
        <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
          Session summary
        </Badge>
        <div>
          <h2 className="text-3xl font-semibold text-[color:var(--color-ink)]">
            Learning score {Math.round(summary.learningScore * 100)}
          </h2>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            You turned repeated repair into measurable control. This session now feeds your mastery map, review queue, and weekly league score.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Surface className="rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Mastery delta
            </p>
            <p className="mt-2 text-2xl font-semibold">
              +{Math.round(summary.masteryDelta * 100)} pts
            </p>
          </Surface>
          <Surface className="rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Review items created
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.reviewItemsCreated}</p>
          </Surface>
          <Surface className="rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              Streak change
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.streakChange}</p>
          </Surface>
          <Surface className="rounded-3xl p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
              League impact
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.leagueImpact}</p>
          </Surface>
        </div>
        <Surface className="rounded-[28px] bg-[linear-gradient(135deg,var(--color-ink),#123a56)] p-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Best next recommendation
              </p>
              <h3 className="mt-2 text-xl font-semibold">{summary.recommendationTitle}</h3>
              <p className="mt-2 text-sm text-white/72">
                {summary.recommendationReason}
              </p>
            </div>
            <Sparkles className="size-6 shrink-0 text-[color:var(--color-coral)]" />
          </div>
        </Surface>
      </Surface>
    );
  }

  return (
    <div className="space-y-5">
      <Surface className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
              {session.mode} session
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold text-[color:var(--color-ink)]">
              {session.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[color:var(--color-muted)]">
              {session.description}
            </p>
          </div>
          <Badge>{currentIndex + 1} / {session.items.length}</Badge>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-[color:var(--color-line)] pt-4 text-sm text-[color:var(--color-muted)]">
          <p>
            <span className="font-semibold text-[color:var(--color-ink)]">
              {session.primaryStructure}
            </span>{" "}
            primary structure
          </p>
          <p>
            <span className="font-semibold text-[color:var(--color-ink)]">
              {session.lane}
            </span>{" "}
            lane
          </p>
          <p>
            <span className="font-semibold text-[color:var(--color-ink)]">
              {formatPercent(scorePreview)}
            </span>{" "}
            score preview
          </p>
        </div>
      </Surface>

      <Surface ref={activeCardRef} className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge>{item.promptType.replace("_", " ")}</Badge>
          {item.memoryAnchor && item.promptType !== "memory_anchor" ? (
            <Badge>memory anchor</Badge>
          ) : null}
          <Badge className="bg-[rgba(255,107,76,0.12)] text-[color:var(--color-coral)]">
            {item.levelBand}
          </Badge>
        </div>
        <div>
          {completionPrompt ? (
            <>
              <h2 className="text-2xl font-semibold text-[color:var(--color-ink)]">
                {completionPrompt.instruction}
              </h2>
              <div className="mt-3 text-[clamp(1.6rem,2.8vw,2.55rem)] font-semibold leading-[1.28] tracking-[-0.03em] text-[color:var(--color-ink)]">
                {completionPrompt.segments.map((segment, index) => (
                  <Fragment key={`${item.id}-${index}`}>
                    <span>{segment}</span>
                    {index < completionPrompt.segments.length - 1 ? (
                      <TextInput
                        ref={(element) => {
                          completionInputRefs.current[index] = element;
                        }}
                        value={completionDraft[index] ?? ""}
                        onChange={(event) => {
                          const next = Array.from(
                            { length: completionBlankCount },
                            (_, slotIndex) => completionDraft[slotIndex] ?? "",
                          );
                          next[index] = event.target.value;
                          setCompletionDraft(next);
                        }}
                        placeholder="..."
                        aria-label={`Fill blank ${index + 1} for the current sentence`}
                        className="mx-2 inline-flex h-14 w-auto min-w-[5.5rem] rounded-2xl border-[color:var(--color-teal)] bg-[rgba(33,186,168,0.06)] px-3 py-0 align-middle text-[1.05rem] font-semibold leading-none focus:ring-[rgba(33,186,168,0.16)]"
                        style={{
                          width: `${Math.min(
                            220,
                            Math.max(88, ((completionDraft[index]?.length ?? 0) + 4) * 14),
                          )}px`,
                        }}
                      />
                    ) : null}
                  </Fragment>
                ))}
              </div>
            </>
          ) : (
            <h2 className="text-2xl font-semibold text-[color:var(--color-ink)]">
              {item.prompt}
            </h2>
          )}
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            Goal: {item.supportObjective}
          </p>
        </div>
        {feedback && !feedback.isAccepted ? (
          <div
            aria-live="polite"
            className="rounded-[24px] bg-[rgba(242,189,78,0.14)] px-4 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
                  Try again
                </Badge>
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  {Math.round(feedback.responseScore * 100)} score
                </p>
              </div>
              {primaryHighlightedSpan?.text ? (
                <p className="text-sm text-[color:var(--color-muted)]">
                  Watch <span className="font-semibold text-[color:var(--color-ink)]">
                    &quot;{primaryHighlightedSpan.text}&quot;
                  </span>
                </p>
              ) : null}
            </div>
            <p className="mt-3 text-sm leading-7 text-[color:var(--color-ink)]">
              {primaryHighlightedSpan?.reason ??
                "Tighten the sentence once more before you check again."}
            </p>
            {activeHint ? (
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                <span className="font-semibold text-[color:var(--color-ink)]">
                  Next nudge:
                </span>{" "}
                {activeHint}
              </p>
            ) : null}
          </div>
        ) : null}
        {!feedback?.isAccepted ? (
          <>
            {!completionPrompt ? (
              <TextArea
                ref={textAreaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Write your sentence here..."
              />
            ) : null}
            {feedback && !feedback.isAccepted && hasRevealedAnswer ? (
              <div className="border-t border-[color:var(--color-line)] pt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                  Model answer
                </p>
                <p className="mt-2 text-base font-semibold leading-7 text-[color:var(--color-ink)]">
                  {feedback.acceptedAnswer}
                </p>
                {feedback.naturalRewrite !== feedback.acceptedAnswer ? (
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                    Natural version: {feedback.naturalRewrite}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="space-y-4 border-t border-[color:var(--color-line)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
                Accepted
              </Badge>
              <Badge>{Math.round(feedback.responseScore * 100)} score</Badge>
            </div>
            <div className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Your sentence
              </p>
              <p className="mt-2 text-base leading-7 text-[color:var(--color-ink)]">
                {currentResponse}
              </p>
            </div>
            <div className="rounded-3xl bg-[linear-gradient(135deg,#0f172a,#10334b)] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                Why it works
              </p>
              <p className="mt-3 text-sm leading-7 text-white/84">
                {feedback.whyItWorks}
              </p>
              <p className="mt-4 text-sm font-semibold text-white">
                Natural rewrite
              </p>
              <p className="mt-2 text-sm leading-7 text-white/80">
                {feedback.naturalRewrite}
              </p>
            </div>
            <details className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[color:var(--color-ink)]">
                Stronger versions
              </summary>
              <div className="mt-3 grid gap-3">
                {feedback.levelUpVariants.map((variant) => (
                  <div
                    key={`${variant.level}-${variant.text}`}
                    className="rounded-2xl border border-[color:var(--color-line)] bg-white px-4 py-3"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                      {variant.level}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                      {variant.text}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
        {error ? (
          <div className="rounded-3xl border border-[rgba(255,107,76,0.28)] bg-[rgba(255,107,76,0.1)] px-4 py-3 text-sm text-[color:var(--color-ink)]">
            {error}
          </div>
        ) : null}
        {!feedback?.isAccepted ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              className="flex-1"
              size="lg"
              onClick={submitResponse}
              disabled={isPending || !hasInputValue()}
            >
              {isPending ? "Checking..." : "Check sentence"}
            </Button>
            {feedback?.canRevealAnswer ? (
              <Button
                className="flex-1"
                size="lg"
                variant="secondary"
                onClick={hasRevealedAnswer ? completeCurrent : revealModelAnswer}
              >
                {hasRevealedAnswer ? "Continue" : "Reveal model answer"}
              </Button>
            ) : null}
          </div>
        ) : (
          <Button
            className="w-full"
            size="lg"
            onClick={completeCurrent}
            disabled={isCompleting}
          >
            {currentIndex === session.items.length - 1
              ? isCompleting
                ? "Wrapping up..."
                : "Finish session"
                  : "Continue"}
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </Surface>
    </div>
  );
}
