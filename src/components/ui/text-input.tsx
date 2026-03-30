import * as React from "react";
import { cn } from "@/lib/utils";

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-xl bg-[color:var(--color-panel)] px-4 text-sm text-[color:var(--color-ink)] outline-none shadow-[inset_0_0_0_1px_var(--color-line)] transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus:ring-4 focus:ring-[rgba(15,76,92,0.08)] focus:shadow-[inset_0_0_0_1px_rgba(15,76,92,0.24),0_16px_34px_rgba(25,28,29,0.05)]",
      className,
    )}
    {...props}
  />
));

TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-36 w-full rounded-xl bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)] outline-none shadow-[inset_0_0_0_1px_var(--color-line)] transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus:ring-4 focus:ring-[rgba(15,76,92,0.08)] focus:shadow-[inset_0_0_0_1px_rgba(15,76,92,0.24),0_16px_34px_rgba(25,28,29,0.05)]",
      className,
    )}
    {...props}
  />
));

TextArea.displayName = "TextArea";
