import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--color-ink)] px-5 py-3 text-white shadow-[0_20px_40px_rgba(15,23,42,0.14)] hover:-translate-y-0.5 hover:bg-[color:var(--color-teal)]",
        secondary:
          "border border-[color:var(--color-line)] bg-white px-5 py-3 text-[color:var(--color-ink)] hover:border-[color:var(--color-teal)] hover:text-[color:var(--color-teal)]",
        ghost:
          "px-4 py-2 text-[color:var(--color-muted)] hover:bg-white/80 hover:text-[color:var(--color-ink)]",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";
