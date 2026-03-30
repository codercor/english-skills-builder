import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { isAuthConfigured } from "@/auth";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

const mentorNotes = [
  {
    label: "Structure-first drills",
    body: "Each session isolates a sentence pattern so the learner can repair one thing clearly instead of wandering through generic chat.",
  },
  {
    label: "Self-repair loop",
    body: "The model highlights weakness, gives a nudge, and waits for a rewrite before it reveals the cleaner sentence.",
  },
  {
    label: "One connected engine",
    body: "Placement, practice, review, mastery, and weekly ranking all run on the same learning signal.",
  },
];

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
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_0%,rgba(15,76,92,0.1),transparent_24%),radial-gradient(circle_at_88%_4%,rgba(223,177,95,0.18),transparent_26%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <header className="glass-shell flex items-center justify-between rounded-[2rem] px-4 py-3 shadow-[0_24px_60px_rgba(25,28,29,0.07)]">
          <BrandMark />
          <Badge className="hidden sm:inline-flex">Editorial learning system</Badge>
        </header>

        <main className="grid flex-1 gap-8 py-8 lg:grid-cols-[minmax(0,1.12fr)_minmax(22rem,0.88fr)] lg:items-start lg:py-10">
          <section className="fade-up rounded-[2.5rem] bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_65%,#235b68_100%)] px-5 py-7 text-white shadow-[0_36px_120px_rgba(25,28,29,0.18)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <Badge className="border-0 bg-white/10 text-white shadow-none">
              The digital mentor
            </Badge>
            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.75fr)] lg:items-start">
              <div>
                <p className="editorial-kicker text-white/60">Adaptive English production</p>
                <h1 className="editorial-display mt-4 max-w-3xl">
                  Train the exact sentence structures that keep your English flat.
                </h1>
                <p className="mt-5 max-w-2xl text-[0.98rem] leading-8 text-white/78">
                  This product is not a generic AI grammar checker. It is a
                  structure-first practice system that diagnoses weakness,
                  forces self-repair, schedules review, and turns the same
                  learning data into mastery, guidance, and calm competition.
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="#auth">
                    <Button size="lg">
                      Continue with Google
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </Link>
                  <Link href="#product-flow">
                    <Button size="lg" variant="secondary" className="bg-white/16 text-white shadow-none hover:bg-white/22 hover:text-white">
                      Read the product flow
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="glass-shell rounded-[2rem] px-5 py-5">
                  <p className="editorial-kicker text-white/55">Best next practice</p>
                  <p className="mt-3 font-display text-[2rem] font-semibold leading-none">
                    Articles
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/74">
                    Repeating misses are still coming from article control and sentence combining.
                  </p>
                </div>
                <div className="rounded-[2rem] bg-white/8 px-5 py-5">
                  <p className="editorial-kicker text-white/55">Why now</p>
                  <ul className="mt-3 grid gap-3">
                    {mentorNotes.slice(0, 2).map((item) => (
                      <li key={item.label} className="text-sm leading-7 text-white/74">
                        <span className="font-semibold text-white">{item.label}:</span>{" "}
                        {item.body}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[2rem] bg-white/7 px-5 py-5">
                <p className="editorial-kicker text-white/55">What changes</p>
                <p className="mt-3 text-sm leading-7 text-white/74">
                  Learners stop collecting shallow corrections and start building sentence control that survives review and pressure.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {mentorNotes.map((item, index) => (
                  <article
                    key={item.label}
                    className={`rounded-[2rem] bg-white/8 px-4 py-5 ${index === 1 ? "sm:translate-y-5" : ""}`}
                  >
                    <p className="editorial-kicker text-white/55">{item.label}</p>
                    <p className="mt-3 text-sm leading-7 text-white/74">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="fade-up grid gap-5">
            <Surface className="space-y-5 tonal-card" id="auth">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge>Entry point</Badge>
                  <h2 className="editorial-headline mt-4 text-[color:var(--color-ink)]">
                    Sign in and enter a connected learning loop
                  </h2>
                </div>
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-[color:var(--color-coral)]" />
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                Google sign-in is the only entry. From there, the learner moves
                through onboarding, placement, best-next practice, self-repair,
                review, profile insights, and leagues without disconnected pages
                or empty metrics.
              </p>
              <AuthCta enabled={isAuthConfigured} />
              {!isAuthConfigured ? (
                <div className="rounded-[1.5rem] bg-[color:var(--color-error-soft)] px-4 py-3 text-sm leading-7 text-[color:var(--color-error-ink)]">
                  Google auth is not configured yet, so sign-in is temporarily unavailable.
                </div>
              ) : null}
            </Surface>

            <div className="grid gap-4 md:grid-cols-2">
              {featureRows.map((feature, index) => {
                const Icon = feature.icon;

                return (
                  <Surface
                    key={feature.title}
                    className={`space-y-4 tonal-card ${index === 1 ? "md:translate-y-6" : ""}`}
                    id={index === 0 ? "product-flow" : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-[1.2rem] bg-[color:var(--color-panel)] text-[color:var(--color-primary)] shadow-[0_16px_34px_rgba(25,28,29,0.04)]">
                        <Icon className="size-4.5" />
                      </div>
                      <p className="editorial-kicker">{index + 1}. Core layer</p>
                    </div>
                    <div>
                      <h3 className="text-[1.55rem] font-semibold text-[color:var(--color-ink)]">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                        {feature.body}
                      </p>
                    </div>
                  </Surface>
                );
              })}
            </div>

            <Surface className="tonal-card space-y-4">
              <p className="editorial-kicker">Why the product feels coherent</p>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                Placement decides the lane. Practice updates mastery. Mastery
                drives recommendations. Review protects retention. Weekly score
                reflects the same validated learning events. Nothing exists only
                for decoration.
              </p>
            </Surface>
          </section>
        </main>
      </div>
    </div>
  );
}
