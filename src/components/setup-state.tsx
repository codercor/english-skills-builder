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
    <section className="overflow-hidden rounded-[28px] bg-[color:var(--color-surface-container-lowest)] p-6 shadow-[0_8px_32px_rgba(32,48,68,0.06)] sm:p-8">
      <p className="inline-flex rounded-full bg-[color:var(--color-surface-container-low)] px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.05rem] text-[color:var(--color-primary)]">
        {badge}
      </p>
      <div className="mt-5 max-w-3xl">
        <h1 className="editorial-headline text-[color:var(--color-on-surface)] sm:text-[2.8rem]">
          {title}
        </h1>
        <p className="mt-4 text-sm leading-[1.8] text-[color:var(--color-on-surface-variant)]">
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
