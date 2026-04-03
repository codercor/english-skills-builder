import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] disabled:pointer-events-none disabled:opacity-50 hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        primary:
          "bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] px-5 py-3 text-white border-b-2 border-[color:var(--color-primary-dim)] shadow-sm",
        secondary:
          "bg-[color:var(--color-surface-container-lowest)] px-5 py-3 text-[color:var(--color-primary)] shadow-sm hover:bg-[color:var(--color-surface-container-low)]",
        ghost:
          "bg-transparent px-4 py-2 text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-container-low)] hover:text-[color:var(--color-on-surface)]",
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
