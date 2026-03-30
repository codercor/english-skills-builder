import { Badge } from "@/components/ui/badge";
import { Surface } from "@/components/ui/surface";
import { getOpsSnapshot } from "@/lib/server/learning";

function MetricGroup({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; value: string; direction: string; note: string }>;
}) {
  return (
    <Surface className="space-y-4 tonal-card">
      <h2 className="text-2xl font-semibold text-[color:var(--color-ink)]">
        {title}
      </h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                {item.label}
              </p>
              <Badge>{item.value}</Badge>
            </div>
            <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
              {item.note}
            </p>
          </div>
        ))}
      </div>
    </Surface>
  );
}

export default async function OpsPage() {
  const snapshot = await getOpsSnapshot();

  return (
    <div className="space-y-5">
      <Surface className="space-y-3 tonal-card">
        <Badge className="bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)] shadow-none">
          admin ops
        </Badge>
        <h1 className="text-4xl font-semibold text-[color:var(--color-ink)]">
          Observe engine quality before it damages learning
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
          The product only becomes trustworthy when promotion, review, and recommendation quality are measurable. These blocks mirror the operational metrics defined in the product plan.
        </p>
      </Surface>
      <div className="grid gap-5 lg:grid-cols-2">
        <MetricGroup title="Learning Health" items={snapshot.learningHealth} />
        <MetricGroup title="Engine Quality" items={snapshot.engineQuality} />
        <MetricGroup
          title="Retention & Motivation"
          items={snapshot.retentionAndMotivation}
        />
        <MetricGroup
          title="Personalization Quality"
          items={snapshot.personalizationQuality}
        />
      </div>
    </div>
  );
}
