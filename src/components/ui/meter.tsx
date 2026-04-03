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
        "h-3 w-full overflow-hidden rounded-full bg-[color:var(--color-surface-container-low)] shadow-inner",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[color:var(--color-secondary)] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
        style={{ width: `${Math.max(4, Math.round(value * 100))}%` }}
      />
    </div>
  );
}
