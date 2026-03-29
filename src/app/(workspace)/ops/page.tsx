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
    <Surface className="space-y-4">
      <h2 className="text-2xl font-semibold text-[color:var(--color-ink)]">
        {title}
      </h2>
      <div className="grid gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-3xl border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 py-4"
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
      <Surface className="space-y-3">
        <Badge className="bg-[rgba(255,107,76,0.12)] text-[color:var(--color-coral)]">
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
