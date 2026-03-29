import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SetupState({
  badge,
  title,
  body,
  actionHref,
  actionLabel,
}: {
  badge: string;
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <section className="overflow-hidden rounded-[36px] border border-[color:var(--color-coach-line)] bg-[color:var(--color-coach-paper)] p-6 shadow-[0_24px_60px_rgba(72,54,40,0.07)] sm:p-8">
      <p className="inline-flex rounded-full bg-[color:var(--color-coach-highlight)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-coach-ink)]">
        {badge}
      </p>
      <div className="mt-5 max-w-3xl">
        <h1 className="text-3xl font-semibold text-[color:var(--color-coach-ink)] sm:text-[2.6rem]">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--color-coach-muted)]">
          {body}
        </p>
      </div>
      <Link href={actionHref} className="mt-6 inline-flex">
        <Button
          size="lg"
          className="bg-[color:var(--color-coach-ink)] text-white hover:bg-[color:var(--color-coach-clay)]"
        >
          {actionLabel}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </Link>
    </section>
  );
}
