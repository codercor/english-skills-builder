import * as React from "react";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export const Surface = React.forwardRef<
  HTMLElement,
  ComponentPropsWithoutRef<"section">
>(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn(
      "rounded-[28px] bg-[color:var(--color-surface-container-low)] p-5 shadow-[0_8px_32px_rgba(32,48,68,0.06)] sm:p-6",
      className,
    )}
    {...props}
  />
));

Surface.displayName = "Surface";
