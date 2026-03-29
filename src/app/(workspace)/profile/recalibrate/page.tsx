import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export default function RecalibrationPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Surface className="space-y-4">
        <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
          recalibration
        </Badge>
        <h1 className="text-4xl font-semibold text-[color:var(--color-ink)]">
          Re-test when you want to realign the engine
        </h1>
        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
          Recalibration exists for two reasons: give the learner a visible proof of progress, and verify that mastery plus progression rules still match reality. The same assessment format is reused, but with fresh prompts.
        </p>
      </Surface>

      <Surface className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Best after 20 sessions",
            "Useful after two hard weeks",
            "Checks engine alignment",
            "Refreshes recommendation lane",
          ].map((point) => (
            <div
              key={point}
              className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4 text-sm text-[color:var(--color-ink)]"
            >
              {point}
            </div>
          ))}
        </div>
        <Link href="/assessment">
          <Button className="w-full" size="lg">
            Start recalibration
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </Link>
      </Surface>
    </div>
  );
}
