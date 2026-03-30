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

function builderLabel(builderKind: PracticeSession["builderKind"]) {
  if (builderKind === "phrase_idiom") {
    return "Phrase & Idiom";
  }

  if (builderKind === "sentence") {
    return "Sentence";
  }

  if (builderKind === "vocabulary") {
    return "Vocabulary";
  }

  return "Grammar";
}

function learningModeLabel(learningMode: PracticeSession["learningMode"]) {
  if (learningMode === "learn") {
    return "Builder lesson";
  }

  if (learningMode === "challenge") {
    return "Challenge";
  }

  if (learningMode === "review") {
    return "Review lab";
  }

  return "Practice";
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
      <Surface className="space-y-5 tonal-card">
        <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
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
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] p-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">
              Mastery delta
            </p>
            <p className="mt-2 text-2xl font-semibold">
              +{Math.round(summary.masteryDelta * 100)} pts
            </p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] p-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">
              Review items created
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.reviewItemsCreated}</p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] p-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">
              Streak change
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.streakChange}</p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] p-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">
              League impact
            </p>
            <p className="mt-2 text-2xl font-semibold">{summary.leagueImpact}</p>
          </div>
        </div>
        <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] p-5 text-white shadow-[0_24px_52px_rgba(25,28,29,0.1)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="editorial-kicker text-white/60">
                Best next recommendation
              </p>
              <h3 className="mt-2 text-xl font-semibold">{summary.recommendationTitle}</h3>
              <p className="mt-2 text-sm text-white/72">
                {summary.recommendationReason}
              </p>
            </div>
            <Sparkles className="size-6 shrink-0 text-[color:var(--color-coral)]" />
          </div>
        </div>
      </Surface>
    );
  }

  return (
    <div className="space-y-4">
      <Surface ref={activeCardRef} className="space-y-5 tonal-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(192,200,203,0.15)] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[color:var(--color-soft)] text-[color:var(--color-muted)] shadow-none">
              {builderLabel(session.builderKind)}
            </Badge>
            <Badge className="bg-[color:var(--color-soft)] text-[color:var(--color-ink)] shadow-none">
              {session.primaryStructure}
            </Badge>
            <Badge className="bg-[color:var(--color-soft)] text-[color:var(--color-muted)] shadow-none">
              {session.lane}
            </Badge>
            <Badge className="bg-[color:var(--color-soft)] text-[color:var(--color-muted)] shadow-none">
              {learningModeLabel(session.learningMode)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
            <span>{currentIndex + 1} / {session.items.length}</span>
            <span>{formatPercent(scorePreview)} preview</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <p className="editorial-kicker">{session.title}</p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
              {session.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Badge>{item.promptType.replace("_", " ")}</Badge>
          {item.memoryAnchor && item.promptType !== "memory_anchor" ? (
            <Badge>memory anchor</Badge>
          ) : null}
          <Badge className="bg-[rgba(255,107,76,0.12)] text-[color:var(--color-coral)]">
            {item.levelBand}
          </Badge>
        </div>
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
                        className="mx-2 inline-flex h-14 w-auto min-w-[5.5rem] rounded-xl bg-[color:var(--color-panel)] px-3 py-0 align-middle text-[1.05rem] font-semibold leading-none shadow-[inset_0_0_0_1px_var(--color-line)] focus:ring-[rgba(15,76,92,0.08)] focus:shadow-[inset_0_0_0_1px_rgba(15,76,92,0.24),0_16px_34px_rgba(25,28,29,0.05)]"
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
                <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
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
              <div className="pt-4">
                <p className="editorial-kicker">
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
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-[color:var(--color-success)] text-[color:var(--color-success-ink)] shadow-none">
                Accepted
              </Badge>
              <Badge>{Math.round(feedback.responseScore * 100)} score</Badge>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">
                Your sentence
              </p>
              <p className="mt-2 text-base leading-7 text-[color:var(--color-ink)]">
                {currentResponse}
              </p>
            </div>
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] p-5 text-white shadow-[0_24px_52px_rgba(25,28,29,0.1)]">
              <p className="editorial-kicker text-white/60">
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
            <details className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[color:var(--color-ink)]">
                Stronger versions
              </summary>
              <div className="mt-3 grid gap-3">
                {feedback.levelUpVariants.map((variant) => (
                  <div
                    key={`${variant.level}-${variant.text}`}
                    className="rounded-[1.35rem] bg-[color:var(--color-soft)] px-4 py-3"
                  >
                    <p className="editorial-kicker">
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
        <p className="text-xs leading-6 text-[color:var(--color-muted)]">
          Each answer updates scoring, mastery, review timing, and the next recommendation.
        </p>
      </Surface>
    </div>
  );
}
