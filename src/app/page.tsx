import { Sparkles, Trophy, WandSparkles } from "lucide-react";
import { isAuthConfigured } from "@/auth";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";

const featureRows = [
  {
    title: "Diagnose before coaching",
    body: "Placement creates a credible starting lane so the product guides instead of guessing.",
    icon: Sparkles,
  },
  {
    title: "Write, miss, repair, rise",
    body: "Feedback is built to make the learner fix the sentence, not passively consume the answer.",
    icon: WandSparkles,
  },
  {
    title: "Compete on substance",
    body: "Leagues reward quality, review wins, and mastery growth rather than empty repetition.",
    icon: Trophy,
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden bg-[color:var(--color-surface)]">
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[2rem] bg-[color:var(--color-surface-container-lowest)] px-4 py-3 shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
          <BrandMark />
          <Badge className="hidden sm:inline-flex bg-[color:var(--color-surface-container-low)] text-[color:var(--color-on-surface-variant)]">Editorial learning system</Badge>
        </header>

        <main className="grid flex-1 gap-8 py-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-start lg:py-10">
          <section className="fade-up rounded-[2.5rem] bg-[color:var(--color-surface-container-lowest)] px-6 py-12 text-[color:var(--color-on-surface)] shadow-[0_8px_32px_rgba(32,48,68,0.06)] sm:px-16 sm:py-24 flex flex-col justify-center min-h-[65vh]">
            <div>
              <Badge className="border-0 bg-[color:var(--color-surface-container-low)] text-[color:var(--color-primary)] shadow-none font-medium">
                The digital mentor
              </Badge>
              
              <h1 className="font-display mt-8 max-w-2xl text-[clamp(2.2rem,8vw,4rem)] font-semibold leading-[1.05] tracking-tight text-[color:var(--color-on-surface)]">
                Train the exact sentence structures that keep your English flat.
              </h1>
              
              <p className="mt-6 max-w-xl text-[1.1rem] leading-[1.8] text-[color:var(--color-on-surface-variant)]">
                This product is not a generic AI grammar checker. It is a structure-first practice system that diagnoses weakness, forces self-repair, schedules review, and turns learning data into mastery.
              </p>
              
              <div className="mt-10 max-w-md">
                <AuthCta enabled={isAuthConfigured} />
                {!isAuthConfigured ? (
                  <div className="mt-4 rounded-2xl bg-[color:var(--color-error)]/10 px-4 py-3 text-sm leading-7 text-[color:var(--color-error)]">
                    Google auth is not configured yet, so sign-in is temporarily unavailable.
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="fade-up grid gap-6 lg:translate-y-12">
            <Surface className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-wider text-[color:var(--color-on-surface-variant)]">
                    Why this works
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-[color:var(--color-on-surface)]">
                    A connected learning loop
                  </h2>
                </div>
              </div>
              <p className="text-sm leading-[1.8] text-[color:var(--color-on-surface-variant)]">
                From placement to practice, review, and leagues, everything runs on a single, validated learning signal. There are no disconnected pages or empty metrics.
              </p>
              <div className="pt-4 space-y-6 border-t-[0px] relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-[color:var(--color-outline-variant)] before:opacity-15">
                {featureRows.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.title} className="flex items-start gap-4">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-surface-container-lowest)] text-[color:var(--color-primary)] shadow-[0_8px_32px_rgba(32,48,68,0.06)]">
                        <Icon className="size-4.5" />
                      </div>
                      <div>
                        <h3 className="text-[0.95rem] font-semibold text-[color:var(--color-on-surface)]">
                          {feature.title}
                        </h3>
                        <p className="mt-1 text-[0.85rem] leading-[1.6] text-[color:var(--color-on-surface-variant)]">
                          {feature.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Surface>
          </aside>
        </main>
      </div>
    </div>
  );
}
