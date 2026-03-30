import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

export default function RecalibrationPage() {
  return (
    <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
      <Surface className="space-y-4 tonal-card">
        <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
          recalibration
        </Badge>
        <h1 className="text-4xl font-semibold text-[color:var(--color-ink)]">
          Re-test when you want to realign the engine
        </h1>
        <p className="text-sm leading-7 text-[color:var(--color-muted)]">
          Recalibration exists for two reasons: give the learner a visible proof of progress, and verify that mastery plus progression rules still match reality. The same assessment format is reused, but with fresh prompts.
        </p>
      </Surface>

      <Surface className="space-y-5 tonal-card">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            "Best after 20 sessions",
            "Useful after two hard weeks",
            "Checks engine alignment",
            "Refreshes recommendation lane",
          ].map((point) => (
            <div
              key={point}
              className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm text-[color:var(--color-ink)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
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
