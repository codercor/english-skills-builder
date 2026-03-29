import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles, Trophy, WandSparkles } from "lucide-react";
import { isAuthConfigured } from "@/auth";
import { AuthCta } from "@/components/auth-cta";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";

const valuePoints = [
  {
    eyebrow: "Practice lane",
    title: "Structure-first drills",
    body: "Work one sentence pattern at a time instead of wandering through generic AI chat.",
  },
  {
    eyebrow: "Repair loop",
    title: "Fix before reveal",
    body: "The model highlights what is weak, then asks for a correction before it shows the answer.",
  },
  {
    eyebrow: "Retention engine",
    title: "Review with stakes",
    body: "Mastery, review pressure, and league movement all react to the same performance signal.",
  },
];

const recommendationReasons = [
  "Article usage is still dragging down first-try accuracy.",
  "Recent review misses are repeating the same structure gap.",
  "Placement, live practice, and review all point to the same weak spot.",
];

const featureRows = [
  {
    title: "Diagnose first",
    body: "Quick placement finds the lane where practice is hard enough to grow but not hard enough to break momentum.",
    icon: Sparkles,
  },
  {
    title: "Repair in context",
    body: "The model highlights what is weak, then pushes the learner to fix it before moving on.",
    icon: WandSparkles,
  },
  {
    title: "Compete on quality",
    body: "Weekly leagues reward real progress, review wins, and better sentence control instead of mindless XP farming.",
    icon: Trophy,
  },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="hero-grid absolute inset-0 opacity-30" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[28px] border border-white/70 bg-[rgba(255,252,245,0.78)] px-4 py-3 shadow-[0_20px_48px_rgba(15,23,42,0.08)] backdrop-blur">
          <BrandMark />
          <Badge className="hidden sm:inline-flex">
            adaptive learning engine
          </Badge>
        </header>

        <main className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1.14fr)_minmax(22rem,0.86fr)] lg:py-12">
          <section className="fade-up relative overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#102133_0%,#163451_56%,#204c67_100%)] px-5 py-7 text-white shadow-[0_36px_120px_rgba(15,23,42,0.22)] sm:px-8 sm:py-10 lg:min-h-[calc(100svh-10rem)] lg:px-10 lg:py-10">
            <div className="pulse-orb absolute right-[-6rem] top-[-4rem] size-52 rounded-full bg-[rgba(33,186,168,0.28)] blur-3xl" />
            <div className="max-w-xl">
              <Badge className="border border-white/12 bg-white/10 text-white">
                structure-first english production
              </Badge>
              <h1 className="mt-6 max-w-lg text-4xl font-semibold leading-[0.98] sm:text-5xl lg:text-6xl">
                Train the exact sentence patterns that are holding your English back.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/72 sm:text-lg">
                Practice one structure at a time, repair mistakes before the answer is revealed, and watch mastery, review, and competition feed the same learning engine.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="#auth">
                  <Button size="lg">
                    Continue with Google
                    <ArrowRight className="ml-2 size-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button size="lg" variant="secondary">
                    See how it works
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mt-10 grid gap-4 2xl:grid-cols-[minmax(0,1.05fr)_minmax(19rem,0.95fr)]">
              <div className="grid gap-4 md:grid-cols-2">
                {valuePoints.slice(0, 2).map((point) => (
                  <article
                    key={point.title}
                    className="rounded-[26px] border border-white/12 bg-white/7 px-5 py-5 backdrop-blur"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                      {point.eyebrow}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-white">
                      {point.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      {point.body}
                    </p>
                  </article>
                ))}
                <article className="rounded-[28px] border border-white/12 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] px-5 py-5 backdrop-blur md:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/48">
                    {valuePoints[2].eyebrow}
                  </p>
                  <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-xl">
                      <h2 className="text-2xl font-semibold leading-tight text-white">
                        {valuePoints[2].title}
                      </h2>
                      <p className="mt-3 text-sm leading-7 text-white/72">
                        {valuePoints[2].body}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-white/68">
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                        placement
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                        practice
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                        review
                      </span>
                      <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2">
                        leagues
                      </span>
                    </div>
                  </div>
                </article>
              </div>
              <aside className="soft-float rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(103,139,173,0.34),rgba(68,95,127,0.48))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                      Best next practice
                    </p>
                    <p className="mt-3 text-4xl font-semibold leading-none sm:text-[2.65rem]">
                      Articles
                    </p>
                  </div>
                  <Badge className="border border-white/10 bg-white/10 text-white/78">
                    live recommendation
                  </Badge>
                </div>
                <p className="mt-5 max-w-md text-base leading-8 text-white/76">
                  Repeat errors are still blocking first-try accuracy.
                </p>
                <div className="mt-6 grid gap-3">
                  {recommendationReasons.map((reason) => (
                    <div
                      key={reason}
                      className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3"
                    >
                      <span className="mt-2 size-2.5 shrink-0 rounded-full bg-[color:var(--color-gold)]" />
                      <p className="text-sm leading-7 text-white/72">
                        {reason}
                      </p>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </section>

          <section className="fade-up grid gap-5 md:grid-cols-2 xl:grid-cols-1">
            <Surface className="space-y-4 md:col-span-2 xl:col-span-1" id="auth">
              <Badge className="bg-[rgba(33,186,168,0.12)] text-[color:var(--color-teal)]">
                launch access
              </Badge>
              <div>
                <h2 className="text-3xl font-semibold text-[color:var(--color-ink)]">
                  Sign in with Google to enter the product
                </h2>
                <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                  Google login is now the only entry point. Once signed in, the learner moves into onboarding, placement, and the connected practice loop.
                </p>
              </div>
              <AuthCta enabled={isAuthConfigured} />
              {!isAuthConfigured ? (
                <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                  Google auth env vars are not connected yet, so sign-in is temporarily disabled.
                </p>
              ) : null}
            </Surface>

            {featureRows.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Surface
                  key={feature.title}
                  className="flex items-start gap-4"
                  id={index === 0 ? "how-it-works" : undefined}
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[color:var(--color-soft)] text-[color:var(--color-teal)]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[color:var(--color-ink)]">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                      {feature.body}
                    </p>
                  </div>
                </Surface>
              );
            })}

            <Surface className="space-y-3 bg-[linear-gradient(135deg,rgba(33,186,168,0.12),rgba(242,189,78,0.12))] md:col-span-2 xl:col-span-1">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-[color:var(--color-teal)]" />
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  Connected product loop
                </p>
              </div>
              <p className="text-sm leading-7 text-[color:var(--color-muted)]">
                Placement affects recommendations. Practice affects review. Review affects mastery. Mastery affects leagues, badges, and future recommendations. No page stands alone.
              </p>
            </Surface>
          </section>
        </main>
      </div>
    </div>
  );
}
