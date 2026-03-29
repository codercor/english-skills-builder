import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CoachChoiceCard({
  title,
  body,
  selected,
  onClick,
  className,
}: {
  title: string;
  body: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group flex min-h-24 w-full items-start justify-between gap-4 rounded-[24px] border px-4 py-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-coach-clay)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-coach-panel)]",
        selected
          ? "border-[color:var(--color-coach-clay)] bg-[color:var(--color-coach-clay-soft)]"
          : "border-[color:var(--color-coach-line)] bg-[color:var(--color-coach-panel)] hover:border-[color:var(--color-coach-clay)] hover:bg-white",
        className,
      )}
    >
      <div className="min-w-0">
        <p className="text-base font-semibold text-[color:var(--color-coach-ink)]">
          {title}
        </p>
        <p className="mt-2 text-sm leading-7 text-[color:var(--color-coach-muted)]">
          {body}
        </p>
      </div>
      <span
        className={cn(
          "mt-1 grid size-7 shrink-0 place-items-center rounded-full border transition",
          selected
            ? "border-[color:var(--color-coach-clay)] bg-[color:var(--color-coach-clay)] text-[color:var(--color-coach-panel)]"
            : "border-[color:var(--color-coach-line)] bg-white text-transparent group-hover:border-[color:var(--color-coach-clay)]",
        )}
      >
        <Check className="size-4" />
      </span>
    </button>
  );
}

export function CoachTopicPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-coach-clay)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-coach-panel)]",
        selected
          ? "border-[color:var(--color-coach-sage)] bg-[color:var(--color-coach-sage-soft)] text-[color:var(--color-coach-ink)]"
          : "border-[color:var(--color-coach-line)] bg-white text-[color:var(--color-coach-muted)] hover:border-[color:var(--color-coach-sage)] hover:text-[color:var(--color-coach-ink)]",
      )}
    >
      {label}
    </button>
  );
}

export function CoachProgress({
  labels,
  currentStep,
}: {
  labels: readonly string[];
  currentStep: number;
}) {
  const progressValue = ((currentStep + 1) / labels.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {labels.map((label, index) => (
            <span
              key={label}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                index === currentStep
                  ? "bg-[color:var(--color-coach-clay)] text-[color:var(--color-coach-panel)]"
                  : index < currentStep
                    ? "bg-[color:var(--color-coach-sage-soft)] text-[color:var(--color-coach-ink)]"
                    : "bg-[color:var(--color-coach-highlight)] text-[color:var(--color-coach-muted)]",
              )}
            >
              {label}
            </span>
          ))}
        </div>
        <p className="text-sm font-medium text-[color:var(--color-coach-muted)]">
          {currentStep + 1} / {labels.length}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-coach-highlight)]">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-coach-clay),var(--color-coach-sage))] transition-[width] duration-300"
          style={{ width: `${progressValue}%` }}
        />
      </div>
    </div>
  );
}

export function CoachSummaryRows({
  rows,
}: {
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.label}
          className="border-b border-[color:var(--color-coach-line)] pb-4 last:border-b-0 last:pb-0"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-muted)]">
            {row.label}
          </p>
          <p className="mt-2 break-words text-sm font-semibold leading-6 text-[color:var(--color-coach-ink)]">
            {row.value}
          </p>
        </div>
      ))}
    </div>
  );
}
