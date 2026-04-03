import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[color:var(--color-surface-container-low)] px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.05rem] text-[color:var(--color-on-surface-variant)]",
        className,
      )}
      {...props}
    />
  );
}
