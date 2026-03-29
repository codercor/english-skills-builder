import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[color:var(--color-soft)] px-3 py-1 text-xs font-semibold text-[color:var(--color-ink)]",
        className,
      )}
      {...props}
    />
  );
}
