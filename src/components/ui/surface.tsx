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
      "rounded-[28px] border border-[color:var(--color-line)] bg-white/92 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.06)] backdrop-blur",
      className,
    )}
    {...props}
  />
));

Surface.displayName = "Surface";
