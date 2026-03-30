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
    <section className="overflow-hidden rounded-[2.3rem] bg-[color:var(--color-soft)] p-6 shadow-[0_24px_60px_rgba(25,28,29,0.05)] sm:p-8">
      <p className="inline-flex rounded-full bg-[color:var(--color-hint)] px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.05rem] text-[color:var(--color-hint-ink)]">
        {badge}
      </p>
      <div className="mt-5 max-w-3xl">
        <h1 className="editorial-headline text-[color:var(--color-coach-ink)] sm:text-[2.8rem]">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-7 text-[color:var(--color-coach-muted)]">
          {body}
        </p>
      </div>
      <Link href={actionHref} className="mt-6 inline-flex">
        <Button size="lg">
          {actionLabel}
          <ArrowRight className="ml-2 size-4" />
        </Button>
      </Link>
    </section>
  );
}
