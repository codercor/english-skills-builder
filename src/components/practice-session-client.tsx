"use client";

import Link from "next/link";
import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type {
  FeedbackPayload,
  PracticeItem,
  PracticeSession,
  PracticeSessionSummary,
  RecognitionEvidence,
} from "@/lib/types";
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

function isHybridChoiceItem(item: PracticeItem) {
  return item.interactionType === "hybrid_choice_text" && Boolean(item.choiceOptions?.length);
}

function parseCompletionPrompt(prompt: string) {
  const normalizedPrompt = prompt.replace(
    /^(?:Complete the sentence(?: naturally| so it sounds natural| with natural English)?|Fill the gaps naturally):\s*/i,
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

function targetKindLabel(kind: NonNullable<PracticeSession["targetItems"]>[number]["kind"]) {
  if (kind === "phrase_frame") {
    return "Phrase frame";
  }

  if (kind === "word_family") {
    return "Word family";
  }

  if (kind === "collocation") {
    return "Collocation";
  }

  return "Word";
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
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [recognitionAttempts, setRecognitionAttempts] = useState(0);
  const [recognitionEvidence, setRecognitionEvidence] = useState<RecognitionEvidence | null>(
    null,
  );
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [completed, setCompleted] = useState<CompletedItem[]>([]);
  const [summary, setSummary] = useState<PracticeSessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [supportRailOpen, setSupportRailOpen] = useState(false);
  const [supportRailAutoCollapsed, setSupportRailAutoCollapsed] = useState(false);
  const [activeTargetItemKey, setActiveTargetItemKey] = useState<string | null>(null);
  const [isPending, startSubmit] = useTransition();
  const [isCompleting, startComplete] = useTransition();
  const [attemptStartedAt, setAttemptStartedAt] = useState(() => Date.now());
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const completionInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const activeCardRef = useRef<HTMLElement>(null);

  const item = session.items[currentIndex];
  const hideMicroIntroForEvidenceHeavyVocabulary =
    session.builderKind === "vocabulary" &&
    session.targetItems?.length
      ? session.targetItems.every((target) => target.teachingWeight === "low")
      : false;
  const completionPrompt =
    item.promptType === "completion" && !isHybridChoiceItem(item)
      ? parseCompletionPrompt(item.prompt)
      : null;
  const completionBlankCount = completionPrompt
    ? completionPrompt.segments.length - 1
    : 0;
  const hybridChoiceItem = isHybridChoiceItem(item);
  const showChoiceStep = hybridChoiceItem && !followUpOpen;
  const exactRewriteFollowUp =
    hybridChoiceItem && followUpOpen && item.followUpMode === "exact_rewrite";
  const promptTitle =
    hybridChoiceItem && followUpOpen ? item.followUpPrompt ?? item.prompt : item.prompt;
  const currentResponse = completionPrompt
    ? buildCompletionResponse(completionPrompt.segments, completionDraft)
    : draft;
  const currentAttempt = attempts[item.id] ?? 0;
  const finalAccepted = Boolean(feedback?.isAccepted && feedback.itemResolved !== false);
  const recognitionFeedback =
    feedback?.taskStep === "recognition" ? feedback : null;
  const textFeedback =
    feedback && feedback.taskStep !== "recognition" ? feedback : null;
  const fixFirstIssue =
    textFeedback && !finalAccepted
      ? textFeedback.issues.find((issue) => issue.fixFirst) ?? textFeedback.issues[0] ?? null
      : null;
  const activeHint =
    textFeedback && !finalAccepted
      ? currentAttempt > 1
        ? textFeedback.hint2
        : textFeedback.hint1
      : null;
  const primaryHighlightedSpan =
    textFeedback && !finalAccepted ? textFeedback.highlightedSpans[0] ?? null : null;
  const exactRewriteReference = exactRewriteFollowUp
    ? item.followUpAcceptedAnswer ??
      recognitionFeedback?.acceptedAnswer ??
      textFeedback?.acceptedAnswer ??
      item.acceptedAnswer
    : null;
  const compactComposer =
    exactRewriteFollowUp ||
    (hybridChoiceItem && followUpOpen) ||
    item.promptType === "rewrite" ||
    item.promptType === "guided_generation" ||
    item.promptType === "error_correction" ||
    item.promptType === "constraint_based";
  const supportRailAvailable =
    Boolean(session.microIntro && !hideMicroIntroForEvidenceHeavyVocabulary) ||
    Boolean(session.builderKind === "vocabulary" && session.targetItems?.length);
  const currentTargetItems = session.targetItems ?? [];
  const resolvedActiveTargetItemKey =
    activeTargetItemKey ??
    item.focusTargetItemKey ??
    currentTargetItems[0]?.itemKey ??
    null;
  const activeTargetItem =
    currentTargetItems.find((target) => target.itemKey === resolvedActiveTargetItemKey) ??
    currentTargetItems[0] ??
    null;
  const lessonNote =
    session.microIntro
      ? `${session.microIntro.whatThisIs} Trap: ${session.microIntro.commonTrap}`
      : session.description;
  const recognitionStripSummary = recognitionFeedback?.isAccepted
    ? "Right choice. Now lock it in by typing the exact sentence below."
    : recognitionFeedback?.recognitionFeedback?.whatWentWrong;
  const textStripSummary =
    fixFirstIssue?.summary ??
    primaryHighlightedSpan?.reason ??
    "Tighten the sentence once more before you check again.";
  const focusColumnClass = "mx-auto w-full max-w-3xl";
  const progressPercent = Math.max(
    8,
    Math.round(((currentIndex + (finalAccepted ? 1 : 0)) / session.items.length) * 100),
  );
  const supportToggleLabel = supportRailOpen ? "Hide hints" : "Hints";

  function collapseSupportRailOnFirstInteraction() {
    if (currentIndex !== 0 || supportRailAutoCollapsed || !supportRailOpen) {
      return;
    }

    setSupportRailOpen(false);
    setSupportRailAutoCollapsed(true);
  }

  const scorePreview = useMemo(() => {
    if (!completed.length) {
      return 0;
    }

    const total = completed.reduce((sum, entry) => sum + entry.feedback.responseScore, 0);
    return total / completed.length;
  }, [completed]);

  function hasInputValue() {
    if (showChoiceStep) {
      return Boolean(selectedChoiceId);
    }

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

        const interactionStep = showChoiceStep
          ? "recognition"
          : hybridChoiceItem
            ? "follow_up"
            : completionPrompt
              ? "text"
              : "text";
        const attemptNumber = showChoiceStep ? recognitionAttempts + 1 : currentAttempt + 1;

        const response = await fetch("/api/practice/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: session.id,
            itemId: item.id,
            interactionStep,
            selectedChoiceId: showChoiceStep ? selectedChoiceId : undefined,
            recognitionEvidence: hybridChoiceItem && !showChoiceStep ? recognitionEvidence : undefined,
            attemptNumber,
            response: showChoiceStep ? "" : currentResponse,
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
        if (showChoiceStep) {
          setRecognitionAttempts(attemptNumber);
          if (payload.recognitionEvidence) {
            setRecognitionEvidence(payload.recognitionEvidence);
          }
          if (payload.opensFollowUp) {
            setFollowUpOpen(true);
            setDraft("");
            setCompletionDraft([]);
          }
        } else {
          setAttempts((current) => ({
            ...current,
            [item.id]: currentAttempt + 1,
          }));
        }
        setAttemptStartedAt(() => Date.now());

        requestAnimationFrame(() => {
          activeCardRef.current?.scrollIntoView({
            block: "start",
            behavior: "smooth",
          });
        });

        if (showChoiceStep) {
          if (payload.opensFollowUp) {
            requestAnimationFrame(() => {
              textAreaRef.current?.focus();
            });
          }
          return;
        }

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
        revealedAnswer: hasRevealedAnswer || feedback.recognitionEvidence?.revealed || false,
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

        const payload = (await response.json()) as PracticeSessionSummary;
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
    setSelectedChoiceId(null);
    setRecognitionAttempts(0);
    setRecognitionEvidence(null);
    setFollowUpOpen(false);
    setActiveTargetItemKey(null);
    setError(null);
    setAttemptStartedAt(() => Date.now());
  }

  function selectChoice(choiceId: string) {
    collapseSupportRailOnFirstInteraction();
    setSelectedChoiceId(choiceId);
    if (recognitionFeedback && !followUpOpen) {
      setFeedback(null);
    }
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
            This session now feeds your mastery map, review queue, and next recommendation with a real before-and-after proof.
          </p>
        </div>
        {summary.proofSnippet ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.8rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">Before</p>
              <p className="mt-2 text-base leading-7 text-[color:var(--color-ink)]">
                {summary.proofSnippet.beforeText}
              </p>
            </div>
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#f1e4c8,#f8efe0)] px-4 py-4">
              <p className="editorial-kicker text-[color:var(--color-hint-ink)]">
                Better version
              </p>
              <p className="mt-2 text-base leading-7 text-[color:var(--color-hint-ink)]">
                {summary.proofSnippet.afterText}
              </p>
            </div>
          </div>
        ) : null}
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] p-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">
              What improved
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
              {summary.improvedBecause}
            </p>
          </div>
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] p-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            <p className="editorial-kicker">
              What still slips
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
              {summary.stillSlips}
            </p>
          </div>
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
              {summary.nextAction.reason ? (
                <p className="mt-3 text-sm text-white/72">
                  {summary.nextAction.reason}
                </p>
              ) : null}
            </div>
            <Sparkles className="size-6 shrink-0 text-[color:var(--color-coral)]" />
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link href={summary.nextAction.href}>
              <Button size="lg">
                {summary.nextAction.label}
              </Button>
            </Link>
            {summary.followUpActions.map((action) => (
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
        </div>
      </Surface>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <Surface ref={activeCardRef} className="space-y-6 tonal-card">
        <div className="space-y-4 border-b border-[rgba(192,200,203,0.15)] pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                {builderLabel(session.builderKind)} lesson
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[color:var(--color-muted)]">
                <span className="font-semibold text-[color:var(--color-ink)]">
                  {session.primaryStructure}
                </span>
                <span className="inline-block size-1 rounded-full bg-[rgba(192,200,203,0.9)]" />
                <span>{item.levelBand}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {supportRailAvailable ? (
                <button
                  className="rounded-full bg-[color:var(--color-soft)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--color-primary)] transition hover:bg-[rgba(15,76,92,0.08)]"
                  onClick={() => setSupportRailOpen((open) => !open)}
                  type="button"
                >
                  {supportToggleLabel}
                </button>
              ) : null}
              <div className="text-right">
                <p className="text-base font-semibold text-[color:var(--color-ink)]">
                  {currentIndex + 1} / {session.items.length}
                </p>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  {formatPercent(scorePreview)} preview
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-3 rounded-full bg-[color:var(--color-soft)] p-1 shadow-[inset_0_0_0_1px_rgba(192,200,203,0.16)]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-primary),var(--color-primary-container))] shadow-[0_10px_20px_rgba(15,76,92,0.18)] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {supportRailAvailable && supportRailOpen ? (
            <div className="mx-auto w-full max-w-4xl rounded-[1.7rem] border border-[rgba(192,200,203,0.18)] bg-[color:var(--color-soft)] px-4 py-4 shadow-[0_18px_36px_rgba(25,28,29,0.04)]">
              <div className="max-w-3xl">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Lesson notes
                </p>
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                  {lessonNote}
                </p>
              </div>
              {session.microIntro && !hideMicroIntroForEvidenceHeavyVocabulary ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-[color:var(--color-panel)] px-4 py-3">
                    <p className="editorial-kicker">When this helps</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                      {session.microIntro.whenToUse}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[color:var(--color-panel)] px-4 py-3">
                    <p className="editorial-kicker">Example</p>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-ink)]">
                      {session.microIntro.modelExamples[0]}
                    </p>
                  </div>
                </div>
              ) : null}
              {session.builderKind === "vocabulary" && currentTargetItems.length ? (
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="editorial-kicker">Target items</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                      Open one hint at a time
                    </p>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {currentTargetItems.map((target) => {
                      const active = target.itemKey === activeTargetItem?.itemKey;

                      return (
                        <button
                          key={target.itemKey}
                          className={`min-w-fit rounded-full px-4 py-2 text-left text-sm font-semibold transition ${
                            active
                              ? "bg-[color:var(--color-primary)] text-white"
                              : "bg-[color:var(--color-panel)] text-[color:var(--color-ink)] hover:bg-white"
                          }`}
                          onClick={() => setActiveTargetItemKey(target.itemKey)}
                          type="button"
                        >
                          <span>{target.label}</span>
                          {target.currentEvidenceLabel ? (
                            <span
                              className={`ml-2 text-xs ${
                                active ? "text-white/72" : "text-[color:var(--color-muted)]"
                              }`}
                            >
                              {target.currentEvidenceLabel}
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                  {activeTargetItem ? (
                    <div className="rounded-[1.25rem] bg-[color:var(--color-panel)] px-4 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="bg-[color:var(--color-soft)] text-[color:var(--color-muted)] shadow-none">
                          {targetKindLabel(activeTargetItem.kind)}
                        </Badge>
                        <Badge className="bg-[rgba(15,76,92,0.08)] text-[color:var(--color-primary)] shadow-none">
                          {activeTargetItem.register}
                        </Badge>
                      </div>
                      <p className="mt-3 text-base font-semibold text-[color:var(--color-ink)]">
                        {activeTargetItem.label}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        {activeTargetItem.gloss}
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <p className="text-sm leading-7 text-[color:var(--color-ink)]">
                          <span className="font-semibold">Natural pairing:</span>{" "}
                          {activeTargetItem.naturalPairings[0]}
                        </p>
                        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                          Example:{" "}
                          <span className="text-[color:var(--color-ink)]">{activeTargetItem.goodExample}</span>
                        </p>
                        <p className="text-sm leading-7 text-[color:var(--color-muted)] sm:col-span-2">
                          {activeTargetItem.nextProofNeeded ?? activeTargetItem.confidenceLabel}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className={`${focusColumnClass} space-y-5`}>
            <div className="flex flex-wrap items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
              <span className="rounded-full bg-[color:var(--color-soft)] px-3 py-1.5">
                {item.promptType.replace("_", " ")}
              </span>
              {item.focusTargetItemLabel ? (
                <span className="rounded-full bg-[rgba(242,189,78,0.18)] px-3 py-1.5 text-[color:var(--color-hint-ink)]">
                  {item.focusTargetItemLabel}
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              {completionPrompt ? (
                <>
                  <h2 className="text-2xl font-semibold text-[color:var(--color-ink)]">
                    {completionPrompt.instruction}
                  </h2>
                  <div className="text-[clamp(1.6rem,2.8vw,2.55rem)] font-semibold leading-[1.28] tracking-[-0.03em] text-[color:var(--color-ink)]">
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
                              collapseSupportRailOnFirstInteraction();
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
                <>
                  <h2
                    className={`font-semibold text-[color:var(--color-ink)] ${
                      exactRewriteFollowUp
                        ? "text-[clamp(1.5rem,2vw,1.9rem)]"
                        : "text-[clamp(1.9rem,3vw,2.8rem)] leading-[1.08] tracking-[-0.04em]"
                    }`}
                  >
                    {promptTitle}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[color:var(--color-muted)]">
                    <span>Goal: {item.supportObjective}</span>
                    {hybridChoiceItem && followUpOpen ? (
                      <span>{exactRewriteFollowUp ? "Step 2 of 2" : "Use the corrected version yourself."}</span>
                    ) : null}
                  </div>
                </>
              )}
            </div>
            {exactRewriteReference ? (
              <div className="rounded-[2.2rem] bg-[color:var(--color-panel)] px-6 py-8 text-center shadow-[0_22px_48px_rgba(25,28,29,0.06),inset_0_0_0_1px_rgba(15,76,92,0.08)]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-primary)]">
                  Rewrite this exactly
                </p>
                <p className="mx-auto mt-4 max-w-3xl text-[clamp(2.1rem,3.4vw,3.2rem)] font-semibold leading-[1.06] tracking-[-0.05em] text-[color:var(--color-primary)]">
                  {exactRewriteReference}
                </p>
                <p className="mt-4 text-sm text-[color:var(--color-muted)]">
                  Copy the sentence above. Upper and lower case do not matter.
                </p>
              </div>
            ) : null}
            {showChoiceStep ? (
              <div className="grid gap-3">
                {item.choiceOptions?.map((option) => {
                  const selected = selectedChoiceId === option.id;

                  return (
                    <button
                      key={option.id}
                      className={`rounded-[1.9rem] border-2 px-5 py-5 text-left transition duration-200 ${
                        selected
                          ? "border-[rgba(15,76,92,0.34)] bg-[rgba(15,76,92,0.08)] shadow-[0_18px_36px_rgba(15,76,92,0.08)]"
                          : "border-[rgba(192,200,203,0.2)] bg-[color:var(--color-panel)] hover:-translate-y-0.5 hover:border-[rgba(15,76,92,0.22)] hover:bg-[color:var(--color-soft)] hover:shadow-[0_16px_30px_rgba(25,28,29,0.05)]"
                      }`}
                      onClick={() => selectChoice(option.id)}
                      type="button"
                    >
                      <div className="flex items-center gap-4">
                        <span
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-none ${
                            selected
                              ? "bg-[color:var(--color-primary)] text-white"
                              : "bg-[color:var(--color-soft)] text-[color:var(--color-muted)]"
                          }`}
                        >
                          {option.id}
                        </span>
                        <p className="text-lg leading-8 text-[color:var(--color-ink)]">
                          {option.text}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : null}
            {!finalAccepted ? (
              <>
                {!completionPrompt && (!hybridChoiceItem || followUpOpen) ? (
                  <TextArea
                    ref={textAreaRef}
                    value={draft}
                    onChange={(event) => {
                      collapseSupportRailOnFirstInteraction();
                      setDraft(event.target.value);
                    }}
                    className={
                      compactComposer
                        ? "min-h-[7.5rem] text-lg leading-8"
                        : "min-h-[13rem] text-lg leading-8"
                    }
                    placeholder={
                      exactRewriteFollowUp
                        ? "Rewrite the sentence above exactly..."
                        : "Write your sentence here..."
                    }
                  />
                ) : null}
              </>
            ) : null}
            {recognitionFeedback ? (
              <div
                aria-live="polite"
                className={`rounded-[1.35rem] border px-4 py-3 ${
                  recognitionFeedback.isAccepted
                    ? "border-[rgba(122,166,122,0.22)] bg-[rgba(122,166,122,0.12)]"
                    : "border-[rgba(242,189,78,0.2)] bg-[rgba(242,189,78,0.12)]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          recognitionFeedback.isAccepted
                            ? "bg-[color:var(--color-success)] text-[color:var(--color-success-ink)] shadow-none"
                            : "bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none"
                        }
                      >
                        {recognitionFeedback.isAccepted
                          ? "Right choice"
                          : recognitionFeedback.opensFollowUp
                            ? "Choice checked"
                            : "Try once more"}
                      </Badge>
                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                        {recognitionStripSummary}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm text-[color:var(--color-muted)]">
                    {recognitionFeedback.recognitionEvidence ? (
                      <p>Attempt {recognitionFeedback.recognitionEvidence.choiceAttempts} / 2</p>
                    ) : (
                      <p>{Math.round(recognitionFeedback.responseScore * 100)} score</p>
                    )}
                  </div>
                </div>
                <details className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                  <summary className="cursor-pointer list-none font-semibold text-[color:var(--color-primary)]">
                    See details
                  </summary>
                  <div className="mt-2 space-y-1">
                    <p>
                      <span className="font-semibold text-[color:var(--color-ink)]">Why:</span>{" "}
                      {recognitionFeedback.recognitionFeedback?.why}
                    </p>
                    <p>
                      <span className="font-semibold text-[color:var(--color-ink)]">What fits instead:</span>{" "}
                      {recognitionFeedback.recognitionFeedback?.whatFitsInstead}
                    </p>
                    {recognitionFeedback.recognitionEvidence?.revealed ? (
                      <p>
                        <span className="font-semibold text-[color:var(--color-ink)]">Correct option:</span>{" "}
                        {recognitionFeedback.acceptedAnswer}
                      </p>
                    ) : null}
                  </div>
                </details>
              </div>
            ) : null}
            {textFeedback && !finalAccepted ? (
              <div
                aria-live="polite"
                className="rounded-[1.35rem] border border-[rgba(242,189,78,0.2)] bg-[rgba(242,189,78,0.12)] px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
                        {exactRewriteFollowUp ? "Reference mismatch" : "Try again"}
                      </Badge>
                      {fixFirstIssue ? (
                        <Badge className="bg-[color:var(--color-primary)] text-white shadow-none">
                          {fixFirstIssue.title}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm font-semibold leading-7 text-[color:var(--color-ink)]">
                      {textStripSummary}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-sm text-[color:var(--color-muted)]">
                    <p className="font-semibold text-[color:var(--color-ink)]">
                      {exactRewriteFollowUp ? "Keep it exact" : `${Math.round(textFeedback.responseScore * 100)} score`}
                    </p>
                  </div>
                </div>
                <details className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                  <summary className="cursor-pointer list-none font-semibold text-[color:var(--color-primary)]">
                    See details
                  </summary>
                  <div className="mt-2 space-y-2">
                    {textFeedback.issues.map((issue) => (
                      <div key={`${item.id}-${issue.kind}`}>
                        <p className="font-semibold text-[color:var(--color-ink)]">{issue.title}</p>
                        <p>{issue.summary}</p>
                        <p>
                          <span className="font-semibold text-[color:var(--color-ink)]">Next fix:</span>{" "}
                          {issue.hint}
                        </p>
                      </div>
                    ))}
                    {activeHint && !exactRewriteFollowUp ? (
                      <p>
                        <span className="font-semibold text-[color:var(--color-ink)]">Session nudge:</span>{" "}
                        {activeHint}
                      </p>
                    ) : null}
                  </div>
                </details>
              </div>
            ) : null}
            {textFeedback && !finalAccepted && hasRevealedAnswer && !exactRewriteFollowUp ? (
              <div className="rounded-[1.2rem] bg-[color:var(--color-soft)] px-4 py-3">
                <p className="editorial-kicker">Model answer</p>
                <p className="mt-2 text-base font-semibold leading-7 text-[color:var(--color-ink)]">
                  {textFeedback.acceptedAnswer}
                </p>
                {textFeedback.naturalRewrite !== textFeedback.acceptedAnswer ? (
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                    Natural version: {textFeedback.naturalRewrite}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {finalAccepted ? (
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge className="bg-[color:var(--color-success)] text-[color:var(--color-success-ink)] shadow-none">
                Accepted
              </Badge>
              <Badge>{Math.round((feedback?.responseScore ?? 0) * 100)} score</Badge>
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
                {feedback?.whyItWorks}
              </p>
              <p className="mt-4 text-sm font-semibold text-white">
                Natural rewrite
              </p>
              <p className="mt-2 text-sm leading-7 text-white/80">
                {feedback?.naturalRewrite}
              </p>
            </div>
            <details className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <summary className="cursor-pointer list-none text-sm font-semibold text-[color:var(--color-ink)]">
                Stronger versions
              </summary>
              <div className="mt-3 grid gap-3">
                {(feedback?.levelUpVariants ?? []).map((variant) => (
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
        ) : null}
        {error ? (
          <div className={focusColumnClass}>
            <div className="rounded-3xl border border-[rgba(255,107,76,0.28)] bg-[rgba(255,107,76,0.1)] px-4 py-3 text-sm text-[color:var(--color-ink)]">
              {error}
            </div>
          </div>
        ) : null}
        {!finalAccepted ? (
          <div className={focusColumnClass}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                className="flex-1"
                size="lg"
                onClick={submitResponse}
                disabled={isPending || !hasInputValue()}
              >
                {isPending
                  ? "Checking..."
                  : showChoiceStep
                    ? "Check choice"
                    : "Check sentence"}
              </Button>
              {!showChoiceStep &&
              textFeedback?.canRevealAnswer &&
              (!exactRewriteFollowUp || !hasRevealedAnswer) ? (
                <Button
                  className="flex-1"
                  size="lg"
                  variant="secondary"
                  onClick={hasRevealedAnswer && !exactRewriteFollowUp ? completeCurrent : revealModelAnswer}
                >
                  {hasRevealedAnswer && !exactRewriteFollowUp
                    ? "Continue"
                    : "Reveal model answer"}
                </Button>
              ) : null}
            </div>
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
