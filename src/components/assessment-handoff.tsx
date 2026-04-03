import Link from "next/link";
import { ArrowRight, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  summarizeOnboardingProfile,
  type OnboardingProfile,
} from "@/lib/onboarding";

function buildAssessmentNote(profile: OnboardingProfile) {
  const summary = summarizeOnboardingProfile(profile);
  const goal = profile.goal
    ? summary.goalLabel.toLowerCase()
    : "find the clearest next step";
  const tone =
    profile.confidence === "supported"
      ? "keep the feedback closer and calmer at the start"
      : profile.confidence === "stretch"
        ? "let the challenge show up a little sooner"
        : "keep the push balanced from the first session";
  const focus = profile.frustration
    ? `I'll watch for ${summary.frustrationLabel.toLowerCase()} while you answer.`
    : "I'll watch for the first repeat mistake that keeps showing up.";
  const examples = summary.themeLabels.length
    ? `The early examples can lean toward ${summary.themeLabels
        .slice(0, 2)
        .join(" and ")
        .toLowerCase()}.`
    : "The early examples will stay broad until your live answers give me a sharper signal.";
  const examTone = profile.ieltsIntent
    ? " A light IELTS tone can stay in the background."
    : "";

  return `You're not starting cold. I'll read this placement through your goal to ${goal}, ${tone}, and the rhythm you chose. ${focus} ${examples}${examTone}`;
}

export function AssessmentHandoff({
  profile,
}: {
  profile: OnboardingProfile;
}) {
  const summary = summarizeOnboardingProfile(profile);
  const tags = [summary.goalLabel, summary.timeLabel, summary.confidenceLabel];

  if (profile.frustration) {
    tags.push(summary.frustrationLabel);
  }

  if (profile.ieltsIntent) {
    tags.push("Light IELTS tone");
  }

  return (
    <section className="overflow-hidden rounded-[36px] bg-[color:var(--color-coach-paper)] p-6 shadow-[0_8px_32px_rgba(32,48,68,0.06)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex rounded-full bg-[color:var(--color-coach-clay-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-ink)]">
            coach handoff
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[2.35rem]">
            You won&apos;t start this placement cold.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
            {buildAssessmentNote(profile)}
          </p>
        </div>

        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[color:var(--color-coach-panel)] text-[color:var(--color-coach-clay)] shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
          <HeartHandshake className="size-5" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-[color:var(--color-coach-panel)] px-4 py-2 text-sm font-semibold text-[color:var(--color-coach-ink)]"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-coach-muted)]">
          Placement still decides your level. This setup only makes the first
          explanations sound more like a coach who already knows where to start.
        </p>
        <Link href="/onboarding" className="inline-flex">
          <Button variant="secondary">
            Adjust setup
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
