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
        "h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--color-soft)]",
        className,
      )}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-teal),var(--color-coral))] transition-all duration-500"
        style={{ width: `${Math.max(4, Math.round(value * 100))}%` }}
      />
    </div>
  );
}
