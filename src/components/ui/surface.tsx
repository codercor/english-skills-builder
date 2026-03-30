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
      "rounded-[28px] bg-[color:var(--color-soft)] p-5 shadow-[0_24px_60px_rgba(25,28,29,0.05)] sm:p-6",
      className,
    )}
    {...props}
  />
));

Surface.displayName = "Surface";
