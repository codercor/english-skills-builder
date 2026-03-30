import { cn } from "@/lib/utils";

export function Meter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-panel)] shadow-[inset_0_0_0_1px_var(--color-line)]",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,#97b6bd,var(--color-coral))] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ width: `${Math.max(4, Math.round(value * 100))}%` }}
      />
    </div>
  );
}
