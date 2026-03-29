import * as React from "react";
import { cn } from "@/lib/utils";

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-12 w-full rounded-2xl border border-[color:var(--color-line)] bg-white px-4 text-sm text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-teal)] focus:ring-4 focus:ring-[rgba(33,186,168,0.12)]",
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
      "min-h-36 w-full rounded-[24px] border border-[color:var(--color-line)] bg-white px-4 py-4 text-sm leading-7 text-[color:var(--color-ink)] outline-none transition focus:border-[color:var(--color-teal)] focus:ring-4 focus:ring-[rgba(33,186,168,0.12)]",
      className,
    )}
    {...props}
  />
));

TextArea.displayName = "TextArea";
