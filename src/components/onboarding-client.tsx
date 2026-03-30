"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import {
  CoachChoiceCard,
  CoachProgress,
  CoachSummaryRows,
  CoachTopicPill,
} from "@/components/onboarding/coach-primitives";
import { Button } from "@/components/ui/button";
import {
  clearStoredOnboardingProfile,
  createInitialOnboardingProfile,
  getOnboardingStorageKey,
  getSuggestedStage,
  hydrateOnboardingProfile,
  onboardingConfidenceOptions,
  onboardingFrustrationOptions,
  onboardingGoalOptions,
  onboardingStageLabels,
  onboardingThemeOptions,
  onboardingTimeOptions,
  readStoredOnboardingProfile,
  summarizeOnboardingProfile,
  writeStoredOnboardingProfile,
  type OnboardingProfile,
  type OnboardingTheme,
} from "@/lib/onboarding";

type WarmupState = "idle" | "hint" | "accepted";

const WARMUP_SOURCE =
  "Yesterday I didn't went to the meeting because I was too tired.";
const WARMUP_EXPECTED =
  "Yesterday I didn't go to the meeting because I was too tired.";

function hasCoreSetup(profile: OnboardingProfile) {
  return Boolean(
    profile.goal && profile.timeCommitment && profile.confidence,
  );
}

function normalizeSentence(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ");
}

function isWarmupAccepted(value: string) {
  const normalized = normalizeSentence(value);

  return (
    normalized ===
      normalizeSentence(WARMUP_EXPECTED) ||
    normalized ===
      normalizeSentence("Yesterday I did not go to the meeting because I was too tired.")
  );
}

function buildCoachNote(profile: OnboardingProfile) {
  const summary = summarizeOnboardingProfile(profile);
  const goal = profile.goal
    ? summary.goalLabel.toLowerCase()
    : "find the first change that would help most";
  const style =
    profile.confidence === "supported"
      ? "stay close with a little more guidance at the start"
      : profile.confidence === "stretch"
        ? "let you work harder before I step in"
        : "keep the push steady without making the early sessions heavy";
  const focus = profile.frustration
    ? `We'll keep an eye on ${summary.frustrationLabel.toLowerCase()}.`
    : "We'll use the first sessions to spot the habit that keeps slowing you down.";
  const examples = summary.themeLabels.length
    ? `I'll start with ${summary.themeLabels
        .slice(0, 2)
        .join(" and ")
        .toLowerCase()} examples`
    : "I'll start with broad everyday examples";
  const examTone = profile.ieltsIntent
    ? " A light IELTS tone can sit in the background."
    : "";

  return `${examples}, help you ${goal}, and ${style}. ${focus}${examTone}`;
}

function buildStepGuidance(currentStep: number) {
  if (currentStep === 0) {
    return "This warm-up does not score you. It simply shows how the coach steps in when a sentence gets stuck.";
  }

  if (currentStep === 1) {
    return "Choose the outcome that matters first, then tell me how hands-on you want the feedback to feel.";
  }

  return "Pick a rhythm you can keep. Extra focus areas and topics only sharpen the first few sessions.";
}

export function OnboardingClient({
  initialProfile,
  viewerId,
}: {
  initialProfile?: Partial<OnboardingProfile>;
  viewerId: string;
}) {
  const router = useRouter();
  const storageKey = getOnboardingStorageKey(viewerId);
  const savedProfile = initialProfile
    ? hydrateOnboardingProfile(initialProfile)
    : createInitialOnboardingProfile();

  const [profile, setProfile] = useState<OnboardingProfile>(savedProfile);
  const [currentStep, setCurrentStep] = useState(getSuggestedStage(savedProfile));
  const [isEditing, setIsEditing] = useState(
    savedProfile.completionState !== "completed",
  );
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [warmupInput, setWarmupInput] = useState(
    hasCoreSetup(savedProfile) ? WARMUP_EXPECTED : "",
  );
  const [warmupState, setWarmupState] = useState<WarmupState>(
    hasCoreSetup(savedProfile) ? "accepted" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const storedDraft = readStoredOnboardingProfile(storageKey);
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) {
        return;
      }

      if (storedDraft?.completionState === "draft") {
        setProfile(storedDraft);
        setCurrentStep(getSuggestedStage(storedDraft));
        setWarmupInput(hasCoreSetup(storedDraft) ? WARMUP_EXPECTED : "");
        setWarmupState(hasCoreSetup(storedDraft) ? "accepted" : "idle");
        setIsEditing(true);
      }

      setHasLoadedDraft(true);
    });

    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoadedDraft || !isEditing) {
      return;
    }

    writeStoredOnboardingProfile(storageKey, {
      goal: profile.goal,
      timeCommitment: profile.timeCommitment,
      confidence: profile.confidence,
      ieltsIntent: profile.ieltsIntent,
      frustration: profile.frustration,
      themes: profile.themes,
      completionState: "draft",
    });
  }, [
    hasLoadedDraft,
    isEditing,
    profile.confidence,
    profile.frustration,
    profile.goal,
    profile.ieltsIntent,
    profile.themes,
    profile.timeCommitment,
    storageKey,
  ]);

  const summary = summarizeOnboardingProfile(profile);
  const summaryRows = [
    { label: "First focus", value: summary.goalLabel },
    { label: "Coach style", value: summary.confidenceLabel },
    { label: "Weekly rhythm", value: summary.timeLabel },
    { label: "Pressure point", value: summary.frustrationLabel },
  ];
  const themeSummary = summary.themeLabels.length
    ? summary.themeLabels.join(", ")
    : "General examples for now";

  function updateProfile(
    updater: (current: OnboardingProfile) => OnboardingProfile,
  ) {
    setError(null);
    setProfile((current) => ({
      ...updater(current),
      completionState: "draft",
    }));
  }

  function toggleTheme(theme: OnboardingTheme) {
    updateProfile((current) => {
      if (current.themes.includes(theme)) {
        return {
          ...current,
          themes: current.themes.filter((item) => item !== theme),
        };
      }

      if (current.themes.length >= 3) {
        return {
          ...current,
          themes: [...current.themes.slice(1), theme],
        };
      }

      return {
        ...current,
        themes: [...current.themes, theme],
      };
    });
  }

  function canAdvance() {
    if (currentStep === 0) {
      return warmupState === "accepted";
    }

    if (currentStep === 1) {
      return Boolean(profile.goal && profile.confidence);
    }

    return Boolean(profile.timeCommitment);
  }

  function handleWarmupCheck() {
    setError(null);

    if (warmupState === "hint") {
      setWarmupInput(WARMUP_EXPECTED);
      setWarmupState("accepted");
      return;
    }

    if (isWarmupAccepted(warmupInput)) {
      setWarmupState("accepted");
      return;
    }

    setWarmupState("hint");
  }

  function handleContinue() {
    if (canAdvance()) {
      setError(null);
      setCurrentStep((step) =>
        Math.min(step + 1, onboardingStageLabels.length - 1),
      );
      return;
    }

    if (currentStep === 0) {
      setError("Try the warm-up once so you can feel how the coaching works.");
      return;
    }

    if (currentStep === 1) {
      setError("Choose a first focus and the support style you want.");
      return;
    }

    setError("Pick a weekly rhythm before moving into placement.");
  }

  function handleRestoreSavedSetup() {
    clearStoredOnboardingProfile(storageKey);
    setProfile(savedProfile);
    setCurrentStep(getSuggestedStage(savedProfile));
    setWarmupInput(hasCoreSetup(savedProfile) ? WARMUP_EXPECTED : "");
    setWarmupState(hasCoreSetup(savedProfile) ? "accepted" : "idle");
    setIsEditing(false);
    setError(null);
  }

  function handleStartEditing() {
    setCurrentStep(1);
    setWarmupInput(WARMUP_EXPECTED);
    setWarmupState("accepted");
    setIsEditing(true);
    setError(null);
  }

  function handleSubmit() {
    if (!profile.goal || !profile.timeCommitment || !profile.confidence) {
      setError("Choose your first focus, coach style, and weekly rhythm first.");
      return;
    }

    startTransition(async () => {
      setError(null);

      try {
        const response = await fetch("/api/profile/onboarding", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            goal: profile.goal,
            timeCommitment: profile.timeCommitment,
            confidence: profile.confidence,
            ieltsIntent: profile.ieltsIntent,
            frustration: profile.frustration,
            themes: profile.themes,
            completionState: "completed",
          }),
        });

        if (response.status === 401) {
          setError(
            "Your session has expired. Sign in again and this draft will still be waiting on this device.",
          );
          return;
        }

        if (!response.ok) {
          setError("I couldn't save your setup yet. Try once more.");
          return;
        }

        clearStoredOnboardingProfile(storageKey);
        router.push("/assessment");
        router.refresh();
      } catch {
        setError("I couldn't reach the server. Try again in a moment.");
      }
    });
  }

  function renderWarmupStep() {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-coach-muted)]">
            Warm-up
          </p>
          <h2 className="max-w-2xl text-3xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[2.2rem]">
            Let&apos;s start with one tiny repair.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
            You try the sentence first. If it stalls, I step in with one short note.
            That is the rhythm you&apos;ll get in practice too.
          </p>
        </div>

        <div className="rounded-[30px] bg-[color:var(--color-coach-panel)] p-5 shadow-[0_18px_36px_rgba(25,28,29,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-muted)]">
            Original sentence
          </p>
          <p className="mt-3 text-lg leading-8 text-[color:var(--color-coach-ink)]">
            {WARMUP_SOURCE}
          </p>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="warmup-sentence"
            className="block text-sm font-semibold text-[color:var(--color-coach-ink)]"
          >
            Rewrite it in natural English
          </label>
          <textarea
            id="warmup-sentence"
            value={warmupInput}
            onChange={(event) => {
              setWarmupInput(event.target.value);
              if (warmupState === "accepted") {
                setWarmupState("idle");
              }
            }}
            placeholder="Type your repair here"
            className="min-h-32 w-full rounded-[24px] bg-[color:var(--color-coach-panel)] px-4 py-4 text-base leading-7 text-[color:var(--color-coach-ink)] outline-none shadow-[inset_0_0_0_1px_var(--color-line)] transition placeholder:text-[color:var(--color-coach-muted)] focus:ring-4 focus:ring-[rgba(15,76,92,0.08)] focus:shadow-[inset_0_0_0_1px_rgba(191,122,27,0.18),0_16px_34px_rgba(25,28,29,0.05)]"
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              onClick={handleWarmupCheck}
              className="bg-[color:var(--color-coach-ink)] text-white hover:bg-[color:var(--color-coach-clay)]"
            >
              {warmupState === "hint" ? "Show coach fix" : "Check sentence"}
            </Button>
            <p className="text-sm leading-7 text-[color:var(--color-coach-muted)]">
              A small repair is enough. This does not affect your placement score.
            </p>
          </div>
        </div>

          <div aria-live="polite" className="space-y-3">
          {warmupState === "hint" ? (
            <div className="rounded-[26px] bg-[color:var(--color-coach-highlight)] px-4 py-4">
              <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
                Coach note
              </p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--color-coach-ink)]">
                After <span className="font-semibold">didn&apos;t</span>, the verb goes
                back to its base form. Try it once more or let me show the clean
                version.
              </p>
            </div>
          ) : null}

          {warmupState === "accepted" ? (
            <div className="rounded-[26px] bg-[color:var(--color-coach-sage-soft)] px-4 py-4 shadow-[inset_0_0_0_1px_rgba(86,120,109,0.18)]">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[color:var(--color-coach-sage)]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
                    That&apos;s the feel of the product.
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--color-coach-ink)]">
                    First you try, then the coaching lands exactly where the sentence
                    slipped.
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-[color:var(--color-coach-ink)]">
                    {WARMUP_EXPECTED}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  function renderLaneStep() {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-coach-muted)]">
            Lane
          </p>
          <h2 className="max-w-2xl text-3xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[2.2rem]">
            What should we help first, and how close should the coaching feel?
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
            Pick the outcome that matters now. Then choose whether you want a gentler
            hand or a stronger push.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
            First focus
          </p>
          <div className="grid gap-3">
            {onboardingGoalOptions.map((option) => (
              <CoachChoiceCard
                key={option.value}
                title={option.label}
                body={option.description}
                selected={profile.goal === option.value}
                onClick={() =>
                  updateProfile((current) => ({
                    ...current,
                    goal: option.value,
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
            Coach style
          </p>
          <div className="grid gap-3 lg:grid-cols-3">
            {onboardingConfidenceOptions.map((option) => (
              <CoachChoiceCard
                key={option.value}
                title={option.label}
                body={option.description}
                selected={profile.confidence === option.value}
                onClick={() =>
                  updateProfile((current) => ({
                    ...current,
                    confidence: option.value,
                  }))
                }
                className="min-h-0"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderRhythmStep() {
    return (
      <div className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[color:var(--color-coach-muted)]">
            Rhythm
          </p>
          <h2 className="max-w-2xl text-3xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[2.2rem]">
            Give the first week a shape you can actually keep.
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
            Rhythm is required. Pressure points and topics are optional, but they make
            the first few sessions feel more personal.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
            Weekly rhythm
          </p>
          <div className="grid gap-3">
            {onboardingTimeOptions.map((option) => (
              <CoachChoiceCard
                key={option.value}
                title={option.label}
                body={option.description}
                selected={profile.timeCommitment === option.value}
                onClick={() =>
                  updateProfile((current) => ({
                    ...current,
                    timeCommitment: option.value,
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
            Where do you usually feel the sentence slip?
          </p>
          <div className="grid gap-3 lg:grid-cols-2">
            {onboardingFrustrationOptions.map((option) => (
              <CoachChoiceCard
                key={option.value}
                title={option.label}
                body={option.description}
                selected={profile.frustration === option.value}
                onClick={() =>
                  updateProfile((current) => ({
                    ...current,
                    frustration:
                      current.frustration === option.value ? null : option.value,
                  }))
                }
                className="min-h-0"
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[color:var(--color-coach-ink)]">
            Example topics
          </p>
          <div className="flex flex-wrap gap-2">
            {onboardingThemeOptions.map((option) => (
              <CoachTopicPill
                key={option.value}
                label={option.label}
                selected={profile.themes.includes(option.value)}
                onClick={() => toggleTheme(option.value)}
              />
            ))}
          </div>
          <p className="text-sm leading-7 text-[color:var(--color-coach-muted)]">
            Pick up to three. If you choose a fourth one, the oldest choice drops off.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            updateProfile((current) => ({
              ...current,
              ieltsIntent: !current.ieltsIntent,
            }))
          }
          aria-pressed={profile.ieltsIntent}
          className={`w-full rounded-[26px] px-4 py-4 text-left transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-coach-clay)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-coach-panel)] ${
            profile.ieltsIntent
              ? "bg-[color:var(--color-coach-clay-soft)] shadow-[inset_0_0_0_1px_rgba(191,122,27,0.18)]"
              : "bg-[color:var(--color-coach-panel)] shadow-[inset_0_0_0_1px_var(--color-line)]"
          }`}
        >
          <p className="text-base font-semibold text-[color:var(--color-coach-ink)]">
            Keep a light IELTS tone in the background
          </p>
          <p className="mt-2 text-sm leading-7 text-[color:var(--color-coach-muted)]">
            This keeps some examples a little more formal without turning the product
            into an exam app.
          </p>
        </button>
      </div>
    );
  }

  if (!isEditing && savedProfile.completionState === "completed") {
    return (
      <section className="overflow-hidden rounded-[40px] bg-[color:var(--color-coach-paper)] p-6 shadow-[0_30px_80px_rgba(25,28,29,0.06)] sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-coach-clay-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-ink)]">
              <Sparkles className="size-4 text-[color:var(--color-coach-clay)]" />
              Setup ready
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[3.2rem]">
                Your first week already has a shape.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
                {buildCoachNote(savedProfile)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[summary.goalLabel, summary.confidenceLabel, summary.timeLabel].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full bg-[color:var(--color-coach-panel)] px-4 py-2 text-sm font-semibold text-[color:var(--color-coach-ink)] shadow-[inset_0_0_0_1px_var(--color-line)]"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/assessment" className="inline-flex">
                <Button
                  size="lg"
                  className="bg-[color:var(--color-coach-ink)] text-white hover:bg-[color:var(--color-coach-clay)]"
                >
                  Continue to placement
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleStartEditing}
                className="border-[color:var(--color-coach-line)] bg-white text-[color:var(--color-coach-ink)] hover:border-[color:var(--color-coach-clay)] hover:text-[color:var(--color-coach-clay)]"
              >
                Adjust setup
              </Button>
            </div>
          </div>

          <aside className="rounded-[32px] bg-[color:var(--color-coach-panel)] p-5 shadow-[0_18px_36px_rgba(25,28,29,0.04)]">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-coach-muted)]">
              Current coaching note
            </p>
            <div className="mt-4">
              <CoachSummaryRows rows={summaryRows} />
            </div>
            <p className="mt-5 break-words text-sm leading-7 text-[color:var(--color-coach-muted)]">
              Example topics: {themeSummary}
              {savedProfile.ieltsIntent ? ". IELTS tone stays lightly on." : "."}
            </p>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[40px] bg-[color:var(--color-coach-paper)] p-5 shadow-[0_30px_80px_rgba(25,28,29,0.06)] sm:p-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(280px,0.82fr)]">
        <div className="min-w-0 space-y-8">
          <header className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-coach-highlight)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-ink)]">
              <Sparkles className="size-4 text-[color:var(--color-coach-clay)]" />
              Starter session
            </div>
            <div>
              <h1 className="max-w-3xl text-4xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[3.2rem]">
                Let&apos;s shape your first week with a little guidance.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
                One quick repair, then a few choices about what you want help with and
                how hands-on the coaching should feel.
              </p>
            </div>
            <CoachProgress
              labels={onboardingStageLabels}
              currentStep={currentStep}
            />
          </header>

          {currentStep === 0 ? renderWarmupStep() : null}
          {currentStep === 1 ? renderLaneStep() : null}
          {currentStep === 2 ? renderRhythmStep() : null}

          {error ? (
            <p
              role="alert"
              className="rounded-[22px] border border-[rgba(255,107,76,0.24)] bg-[rgba(255,107,76,0.1)] px-4 py-3 text-sm leading-7 text-[color:var(--color-coral)]"
            >
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                variant="secondary"
                onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
                disabled={currentStep === 0 || isPending}
                className="border-[color:var(--color-coach-line)] bg-white text-[color:var(--color-coach-ink)] hover:border-[color:var(--color-coach-clay)] hover:text-[color:var(--color-coach-clay)]"
              >
                <ArrowLeft className="mr-2 size-4" />
                Back
              </Button>
              {savedProfile.completionState === "completed" ? (
                <Button
                  variant="ghost"
                  onClick={handleRestoreSavedSetup}
                  disabled={isPending}
                  className="justify-start px-0 text-[color:var(--color-coach-muted)] hover:bg-transparent hover:text-[color:var(--color-coach-ink)]"
                >
                  Use saved setup instead
                </Button>
              ) : null}
            </div>

            {currentStep < onboardingStageLabels.length - 1 ? (
              <Button
                onClick={handleContinue}
                className="bg-[color:var(--color-coach-ink)] text-white hover:bg-[color:var(--color-coach-clay)]"
              >
                Continue
                <ArrowRight className="ml-2 size-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isPending || !canAdvance()}
                className="bg-[color:var(--color-coach-ink)] text-white hover:bg-[color:var(--color-coach-clay)]"
              >
                {isPending ? "Saving setup..." : "Save and start placement"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            )}
          </div>
        </div>

        <aside className="min-w-0 rounded-[32px] bg-[color:var(--color-coach-panel)] p-5 shadow-[0_18px_36px_rgba(25,28,29,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-coach-muted)]">
            Coach view
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[color:var(--color-coach-ink)]">
            What I&apos;ll use first
          </h2>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-coach-muted)]">
            {buildCoachNote(profile)}
          </p>

          <div className="mt-5">
            <CoachSummaryRows rows={summaryRows} />
          </div>

          <div className="mt-5 rounded-[26px] bg-[color:var(--color-coach-highlight)] px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-muted)]">
              Right now
            </p>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-coach-ink)]">
              {buildStepGuidance(currentStep)}
            </p>
          </div>

          <div className="mt-5 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-muted)]">
              Example topics
            </p>
            <p className="break-words text-sm leading-7 text-[color:var(--color-coach-ink)]">
              {themeSummary}
              {profile.ieltsIntent ? " with a light IELTS tone in the background." : "."}
            </p>
          </div>

          <p className="mt-5 text-sm leading-7 text-[color:var(--color-coach-muted)]">
            Draft changes stay on this device until you save.
          </p>
        </aside>
      </div>
    </section>
  );
}
