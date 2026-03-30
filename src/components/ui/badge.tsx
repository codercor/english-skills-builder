import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[color:var(--color-panel)] px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.05rem] text-[color:var(--color-muted)] shadow-[inset_0_0_0_1px_var(--color-line)]",
        className,
      )}
      {...props}
    />
  );
}
