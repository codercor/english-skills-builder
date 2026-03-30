import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { SetupState } from "@/components/setup-state";
import { getLeagueSnapshot, getWorkspaceStatus } from "@/lib/server/learning";
import { getViewer } from "@/lib/session";

export default async function LeaguePage() {
  const viewer = await getViewer();
  const status = await getWorkspaceStatus(viewer);

  if (!status.hasOnboarding) {
    return (
      <SetupState
        badge="onboarding required"
        title="Leagues only work after your learning profile exists"
        body="This competition layer is tied to real learning events, not placeholder points. Save onboarding and take placement first."
        actionHref="/onboarding"
        actionLabel="Start onboarding"
      />
    );
  }

  if (!status.hasAssessment) {
    return (
      <SetupState
        badge="placement required"
        title="League ranking starts after real assessment data exists"
        body="Weekly leagues use real learning score and mastery delta. Finish placement so the app can place you in the right bracket."
        actionHref="/assessment"
        actionLabel="Take placement"
      />
    );
  }

  const league = await getLeagueSnapshot(viewer);

  return (
    <div className="space-y-5">
      <Surface className="space-y-4 tonal-card">
        <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
          self-improvement first
        </Badge>
        <div>
          <h1 className="text-4xl font-semibold text-[color:var(--color-ink)]">
            Competition is there to sharpen learning, not to farm cheap points
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
            The same validated learning events power weekly score, mastery streaks, promotion, and structure cups. Global spam leaderboards are out. Small-group, level-aware leagues are in.
          </p>
        </div>
      </Surface>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Surface className="space-y-4 tonal-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Weekly league
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {league.name}
              </h2>
            </div>
            <Badge>{league.bracket}</Badge>
          </div>
          <div className="grid gap-3">
            {league.entries.map((entry) => (
              <div
                key={`${entry.rank}-${entry.learner}`}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
              >
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  #{entry.rank}
                </p>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                    {entry.learner}
                  </p>
                  <p className="text-xs text-[color:var(--color-muted)]">
                    {entry.levelBand} · {entry.leagueStatus}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[color:var(--color-teal)]">
                  {entry.weeklyLearningScore}
                </p>
              </div>
            ))}
          </div>
        </Surface>

        <div className="grid gap-5">
          <Surface className="space-y-4 tonal-card">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Improvement leaderboard
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                Mastery delta this week
              </h2>
            </div>
            <div className="grid gap-3">
              {league.improvementBoard.slice(0, 5).map((entry) => (
                <div
                  key={`${entry.learner}-improvement`}
                  className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {entry.learner}
                    </p>
                    <p className="text-sm font-semibold text-[color:var(--color-coral)]">
                      +{Math.round(entry.masteryDelta * 100)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="space-y-4 tonal-card">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Structure cup
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                {league.structureCup.structureFamily}
              </h2>
            </div>
            <p className="text-sm leading-7 text-[color:var(--color-muted)]">
              Cup points come from the same validated learning score, filtered to the current structure family. No separate currency, no disconnected grind.
            </p>
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] p-5 text-white shadow-[0_24px_52px_rgba(25,28,29,0.1)]">
              <p className="text-sm font-semibold">
                {league.bossSessionReady
                  ? "Boss session unlocked"
                  : "Boss session locked"}
              </p>
              <p className="mt-2 text-sm leading-7 text-white/80">
                When a structure family reaches stable mastery range, a mixed high-pressure drill unlocks and awards extra cup momentum.
              </p>
            </div>
          </Surface>
        </div>
      </section>
    </div>
  );
}
