"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { Check, ChevronRight, ChevronLeft } from "lucide-react";
import type { AssessmentQuestion, AssessmentResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import { TextArea, TextInput } from "@/components/ui/text-input";

function parseCompletionPrompt(prompt: string) {
  const normalizedPrompt = prompt.replace(
    /^Complete the sentence naturally:\s*/i,
    "",
  );

  if (!normalizedPrompt.includes("____")) {
    return null;
  }

  const [before, after] = normalizedPrompt.split("____");

  if (before === undefined || after === undefined) {
    return null;
  }

  return {
    before,
    after,
    normalizedPrompt,
  };
}

function buildAssessmentAnswer(question: AssessmentQuestion, value: string) {
  if (question.kind !== "completion") {
    return value;
  }

  const parsedPrompt = parseCompletionPrompt(question.prompt);

  if (!parsedPrompt) {
    return value;
  }

  return `${parsedPrompt.before}${value.trim()}${parsedPrompt.after}`.replace(
    /\s+/g,
    " ",
  ).trim();
}

function parseInstructionAndTarget(prompt: string) {
  const colonIndex = prompt.indexOf(":");
  if (colonIndex !== -1) {
    const instruction = prompt.substring(0, colonIndex).trim();
    // Use substring starting from colonIndex + 1 to preserve everything after the first colon.
    // Replace outer quotes if they surround the entire target text.
    let targetText = prompt.substring(colonIndex + 1).trim();
    if (targetText.startsWith('"') && targetText.endsWith('"')) {
      targetText = targetText.slice(1, -1);
    } else if (targetText.startsWith("'") && targetText.endsWith("'")) {
      targetText = targetText.slice(1, -1);
    }
    
    return { instruction, targetText };
  }
  return { instruction: prompt, targetText: null };
}

export function AssessmentClient({
  questions,
  mode = "placement",
  headerNode,
}: {
  questions: AssessmentQuestion[];
  mode?: "placement" | "recalibration";
  headerNode?: ReactNode;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [currentIndex, setCurrentIndex] = useState(0);

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
  }

  function handleNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      window.scrollTo(0, 0);
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      window.scrollTo(0, 0);
    }
  }

  function handleSubmit() {
    startTransition(async () => {
      try {
        setError(null);

        const response = await fetch("/api/assessment/evaluate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            answers: questions.map((q) => ({
              questionId: q.id,
              value: buildAssessmentAnswer(q, answers[q.id] ?? ""),
            })),
          }),
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(payload?.error ?? "We could not evaluate your placement right now.");
          return;
        }

        const payload = (await response.json()) as AssessmentResult;
        setResult(payload);
        window.scrollTo(0, 0);
      } catch {
        setError("Network issue while running your placement. Try again.");
      }
    });
  }

  if (result) {
    return (
      <div className="space-y-5">
        <Surface className="space-y-5 tonal-card">
          <Badge className="bg-[color:var(--color-primary-container)] text-[color:var(--color-primary)] shadow-none">
            {mode === "recalibration" ? "Recalibration result" : "Placement result"}
          </Badge>
          <div>
            <h3 className="text-3xl font-semibold text-[color:var(--color-on-surface)]">
              Overall level: {result.overallLevel}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--color-on-surface-variant)]">
              Your next gains will come from {result.topGrowthAreas.slice(0, 2).join(" and ").toLowerCase()}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.7rem] bg-[color:var(--color-surface-container-low)] p-4 shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
              <p className="editorial-kicker text-[color:var(--color-on-surface-variant)]">
                Grammar control
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--color-on-surface)]">{result.grammarControl}</p>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-surface-container-low)] p-4 shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
              <p className="editorial-kicker text-[color:var(--color-on-surface-variant)]">
                Vocabulary usage
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--color-on-surface)]">{result.vocabularyUsage}</p>
            </div>
            <div className="rounded-[1.7rem] bg-[color:var(--color-surface-container-low)] p-4 shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
              <p className="editorial-kicker text-[color:var(--color-on-surface-variant)]">
                Sentence building
              </p>
              <p className="mt-2 text-2xl font-semibold text-[color:var(--color-on-surface)]">{result.sentenceBuilding}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--color-on-surface)]">
              Top growth areas
            </p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {result.topGrowthAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-[1.35rem] bg-[color:var(--color-surface-container-low)] px-4 py-3 text-sm text-[color:var(--color-on-surface)] shadow-[0_8px_32px_rgba(32,48,68,0.06)]"
                >
                  {area}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link className="flex-1" href="/home">
              <Button className="w-full" size="lg">
                Continue to home
              </Button>
            </Link>
            <Link className="flex-1" href="/practice/best-next">
              <Button className="w-full" variant="secondary" size="lg">
                Start best next practice
              </Button>
            </Link>
          </div>
        </Surface>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = answers[currentQuestion.id] ?? "";
  const hasAnswer = currentAnswer.trim().length > 0;

  return (
    <div className="space-y-5 pb-6">
      {currentIndex === 0 && headerNode && (
        <div className="mb-10 fade-up">
          {headerNode}
        </div>
      )}

      <div className="flex items-center justify-between text-sm font-semibold text-[color:var(--color-on-surface-variant)] px-2">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <div className="flex gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-4 bg-[color:var(--color-primary)]"
                  : i < currentIndex
                  ? "w-2 bg-[color:var(--color-primary-container)]"
                  : "w-2 bg-[color:var(--color-surface-container-low)]"
              }`}
            />
          ))}
        </div>
      </div>

      <Surface className="space-y-6 tonal-card fade-up">
        <div className="flex items-center justify-between gap-3">
          <Badge className="bg-[color:var(--color-surface-container-low)] text-[color:var(--color-on-surface)] shadow-none">
            {currentQuestion.kind.replace("_", " ")}
          </Badge>
          <Badge className="bg-[color:var(--color-primary-container)] text-[color:var(--color-primary)] shadow-none">
            {currentQuestion.targetLevel}
          </Badge>
        </div>
        
        <div>
          {currentQuestion.kind === "completion" ? (
            <h3 className="text-xl font-semibold text-[color:var(--color-on-surface)]">
              Complete the sentence naturally.
            </h3>
          ) : (
            (() => {
              const parsed = parseInstructionAndTarget(currentQuestion.prompt);
              if (parsed.targetText) {
                return (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-[color:var(--color-on-surface)]">
                      {parsed.instruction}
                    </h3>
                    <div className="rounded-[1.35rem] bg-[color:var(--color-surface-container-low)] px-5 py-4 shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
                      <p className="text-lg font-medium text-[color:var(--color-primary-dim)]">
                        {parsed.targetText}
                      </p>
                    </div>
                  </div>
                );
              }
              return (
                <h3 className="text-xl font-semibold text-[color:var(--color-on-surface)]">
                  {currentQuestion.prompt}
                </h3>
              );
            })()
          )}
          <p className="mt-4 text-sm text-[color:var(--color-on-surface-variant)]">
            {currentQuestion.rubric}
          </p>
        </div>

        {currentQuestion.kind === "completion" ? (
          (() => {
            const parsedPrompt = parseCompletionPrompt(currentQuestion.prompt);

            if (!parsedPrompt) {
              return (
                <TextArea
                  value={currentAnswer}
                  onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                  placeholder="Write your answer here..."
                  className="bg-[color:var(--color-surface-container-lowest)]"
                />
              );
            }

            const inputWidth = Math.min(
              240,
              Math.max(88, (currentAnswer.length + 4) * 12),
            );

            return (
              <div className="rounded-[1.7rem] bg-[color:var(--color-surface-container-low)] px-4 py-6 shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
                <label
                  htmlFor={currentQuestion.id}
                  className="block text-[1.05rem] leading-[2.2rem] text-[color:var(--color-on-surface)]"
                >
                  <span>{parsedPrompt.before}</span>
                  <TextInput
                    id={currentQuestion.id}
                    value={currentAnswer}
                    onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                    placeholder="..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && hasAnswer) {
                        e.preventDefault();
                        handleNext();
                      }
                    }}
                    aria-label={`Fill the blank for question ${currentIndex + 1}`}
                    className="mx-2 inline-flex h-11 w-auto min-w-[5.5rem] rounded-xl bg-[color:var(--color-surface-container-lowest)] px-3 py-0 align-middle text-base font-semibold shadow-none border-none focus:ring-2 focus:ring-[color:var(--color-primary-container)]"
                    style={{ width: `${inputWidth}px` }}
                  />
                  <span>{parsedPrompt.after}</span>
                </label>
              </div>
            );
          })()
        ) : (
          <TextArea
            value={currentAnswer}
            onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
            placeholder="Write your answer here..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && hasAnswer) {
                e.preventDefault();
                handleNext();
              }
            }}
            className="bg-[color:var(--color-surface-container-lowest)]"
          />
        )}
      </Surface>

      {error && (
        <div className="rounded-[18px] bg-[color:var(--color-error)]/10 px-4 py-3 text-sm text-[color:var(--color-error)]">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4">
        {currentIndex > 0 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="px-4"
            disabled={isPending}
          >
            <ChevronLeft className="mr-2 size-4" />
            Back
          </Button>
        )}
        
        <Button
          className="flex-1"
          size="lg"
          onClick={handleNext}
          disabled={!hasAnswer || isPending}
        >
          {isPending ? (
            "Evaluating..."
          ) : isLastQuestion ? (
            <>
              See my placement
              <Check className="ml-2 size-4" />
            </>
          ) : (
            <>
              Next question
              <ChevronRight className="ml-2 size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
