"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
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

export function AssessmentClient({
  questions,
  mode = "placement",
}: {
  questions: AssessmentQuestion[];
  mode?: "placement" | "recalibration";
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateAnswer(id: string, value: string) {
    setAnswers((current) => ({ ...current, [id]: value }));
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
            answers: questions.map((question) => ({
              questionId: question.id,
              value: buildAssessmentAnswer(question, answers[question.id] ?? ""),
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
      } catch {
        setError("Network issue while running your placement. Try again.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {!result ? (
        <>
          {questions.map((question, index) => (
            <Surface key={question.id} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Badge>
                  {index + 1}. {question.kind.replace("_", " ")}
                </Badge>
                <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
                  {question.targetLevel}
                </Badge>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[color:var(--color-ink)]">
                  {question.kind === "completion"
                    ? "Complete the sentence naturally."
                    : question.prompt}
                </h3>
                <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                  {question.rubric}
                </p>
              </div>
              {question.kind === "completion" ? (
                (() => {
                  const parsedPrompt = parseCompletionPrompt(question.prompt);

                  if (!parsedPrompt) {
                    return (
                      <TextArea
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          updateAnswer(question.id, event.target.value)
                        }
                        placeholder="Write your answer here..."
                      />
                    );
                  }

                  const currentValue = answers[question.id] ?? "";
                  const inputWidth = Math.min(
                    240,
                    Math.max(88, (currentValue.length + 4) * 12),
                  );

                  return (
                    <div className="rounded-[24px] border border-[color:var(--color-line)] bg-white px-4 py-5">
                      <label
                        htmlFor={question.id}
                        className="block text-base leading-8 text-[color:var(--color-ink)]"
                      >
                        <span>{parsedPrompt.before}</span>
                        <TextInput
                          id={question.id}
                          value={currentValue}
                          onChange={(event) =>
                            updateAnswer(question.id, event.target.value)
                          }
                          placeholder="..."
                          aria-label={`Fill the blank for question ${index + 1}`}
                          className="mx-2 inline-flex h-11 w-auto min-w-[5.5rem] rounded-xl border-[color:var(--color-teal)] bg-[rgba(33,186,168,0.06)] px-3 py-0 align-middle text-base font-semibold focus:ring-[rgba(33,186,168,0.16)]"
                          style={{ width: `${inputWidth}px` }}
                        />
                        <span>{parsedPrompt.after}</span>
                      </label>
                    </div>
                  );
                })()
              ) : (
                <TextArea
                  value={answers[question.id] ?? ""}
                  onChange={(event) => updateAnswer(question.id, event.target.value)}
                  placeholder="Write your answer here..."
                />
              )}
            </Surface>
          ))}

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Evaluating..." : "See my placement"}
          </Button>
          {error ? (
            <div className="rounded-3xl border border-[rgba(255,107,76,0.28)] bg-[rgba(255,107,76,0.1)] px-4 py-3 text-sm text-[color:var(--color-ink)]">
              {error}
            </div>
          ) : null}
        </>
      ) : (
        <Surface className="space-y-5">
          <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
            {mode === "recalibration" ? "Recalibration result" : "Placement result"}
          </Badge>
          <div>
            <h3 className="text-3xl font-semibold text-[color:var(--color-ink)]">
              Overall level: {result.overallLevel}
            </h3>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              Your next gains will come from {result.topGrowthAreas.slice(0, 2).join(" and ").toLowerCase()}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Surface className="rounded-3xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Grammar control
              </p>
              <p className="mt-2 text-2xl font-semibold">{result.grammarControl}</p>
            </Surface>
            <Surface className="rounded-3xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Vocabulary usage
              </p>
              <p className="mt-2 text-2xl font-semibold">{result.vocabularyUsage}</p>
            </Surface>
            <Surface className="rounded-3xl p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Sentence building
              </p>
              <p className="mt-2 text-2xl font-semibold">{result.sentenceBuilding}</p>
            </Surface>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              Top growth areas
            </p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {result.topGrowthAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-2xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-3 text-sm text-[color:var(--color-ink)]"
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
      )}
    </div>
  );
}
