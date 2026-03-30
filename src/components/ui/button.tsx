import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] px-5 py-3 text-white shadow-[0_20px_40px_rgba(25,28,29,0.1)] hover:-translate-y-0.5 hover:shadow-[0_26px_48px_rgba(25,28,29,0.13)]",
        secondary:
          "bg-[color:var(--color-panel)] px-5 py-3 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-[color:var(--color-surface-bright)]",
        ghost:
          "bg-transparent px-4 py-2 text-[color:var(--color-primary)] shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-[rgba(255,255,255,0.65)] hover:text-[color:var(--color-ink)]",
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-13 px-6 text-[0.95rem]",
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
