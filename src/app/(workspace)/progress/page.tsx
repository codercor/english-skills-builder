import { Badge } from "@/components/ui/badge";
import { Meter } from "@/components/ui/meter";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { toUserFacingStage } from "@/lib/engine/profile";
import { getProgressSnapshot, getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";
import { formatPercent } from "@/lib/utils";

function MiniTrend({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);

  return (
    <div className="flex h-24 items-end gap-2">
      {values.map((value, index) => (
        <div
          key={`${value}-${index}`}
          className="flex-1 rounded-t-2xl bg-[linear-gradient(180deg,var(--color-teal),var(--color-ink))]"
          style={{ height: `${Math.max(16, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default async function ProgressPage() {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Progress starts after the learner profile exists"
        body="The progress dashboard turns learning data into readable trends. It needs your saved onboarding setup first."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="Progress trends begin with placement"
        body="Without a real baseline, trend cards would just be decoration. Finish placement first to unlock the real progress view."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const snapshot = await getProgressSnapshot(viewer);

  if (!snapshot) {
    return (
      <SetupState
        badge="progress unavailable"
        title="We do not have enough live data to draw progress yet"
        body="Finish placement and complete at least one session so the dashboard can build your first trend lines."
        actionHref="/home"
        actionLabel="Go to home"
      />
    );
  }

  return (
    <div className="space-y-5">
      <Surface className="space-y-4">
        <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
          progress intelligence
        </Badge>
        <h1 className="text-4xl font-semibold text-[color:var(--color-ink)]">
          See improvement as skill movement, not just as activity
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
          This dashboard turns engine metrics into learning insights: better first tries, faster repairs, stronger reviews, and a structure map that shows what is still fragile.
        </p>
      </Surface>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Overall level trend", values: snapshot.overallTrend },
          { label: "First-try accuracy", values: snapshot.accuracyTrend },
          { label: "Repair success", values: snapshot.repairTrend },
          { label: "Review success", values: snapshot.reviewTrend },
        ].map((card) => (
          <Surface key={card.label} className="space-y-4">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {card.label}
            </p>
            <MiniTrend values={card.values} />
          </Surface>
        ))}
      </section>

      <Surface className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
            Mastery by structure
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
            Stable gains depend on review, not only on good sessions
          </h2>
        </div>
        <div className="grid gap-3">
          {snapshot.structureMap.map((record) => (
            <div
              key={record.structureKey}
              className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    {record.title}
                  </p>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    {toUserFacingStage(record)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[color:var(--color-teal)]">
                    {formatPercent(record.masteryScore)}
                  </p>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    Δ {Math.round(record.masteryDelta7d * 100)}
                  </p>
                </div>
              </div>
              <Meter className="mt-3" value={record.masteryScore} />
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
