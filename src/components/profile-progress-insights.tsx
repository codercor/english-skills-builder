"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ProgressSnapshot } from "@/lib/types";

function buildTrendData(snapshot: ProgressSnapshot) {
  const maxLength = Math.max(
    snapshot.overallTrend.length,
    snapshot.accuracyTrend.length,
    snapshot.repairTrend.length,
    snapshot.reviewTrend.length,
  );

  return Array.from({ length: maxLength }, (_, index) => ({
    label:
      index === 0
        ? "Earlier"
        : index === maxLength - 1
          ? "Now"
          : `Step ${index + 1}`,
    overall: snapshot.overallTrend[index] ?? null,
    accuracy: snapshot.accuracyTrend[index] ?? null,
    repair: snapshot.repairTrend[index] ?? null,
    review: snapshot.reviewTrend[index] ?? null,
  }));
}

function TrendCard({
  title,
  tone,
  dataKey,
  data,
}: {
  title: string;
  tone: string;
  dataKey: "overall" | "accuracy" | "repair" | "review";
  data: ReturnType<typeof buildTrendData>;
}) {
  return (
    <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
        {title}
      </p>
      <div className="mt-4 h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={tone} stopOpacity={0.42} />
                <stop offset="100%" stopColor={tone} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(15,76,92,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-muted)", fontSize: 11 }}
            />
            <YAxis hide domain={[0, 100]} />
            <Tooltip
              cursor={{ stroke: tone, strokeOpacity: 0.18 }}
              contentStyle={{
                borderRadius: "16px",
                border: "0",
                boxShadow: "0 18px 36px rgba(25,28,29,0.08)",
                background: "rgba(255,255,255,0.96)",
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={tone}
              strokeWidth={2.6}
              fill={`url(#gradient-${dataKey})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProfileProgressInsights({
  snapshot,
}: {
  snapshot: ProgressSnapshot;
}) {
  const trendData = buildTrendData(snapshot);
  const masteryData = snapshot.structureMap
    .slice(0, 8)
    .map((record) => ({
      name: record.title,
      mastery: Math.round(record.masteryScore * 100),
      delta: Math.round(record.masteryDelta7d * 100),
    }))
    .reverse();

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <TrendCard
          title="Overall level trend"
          tone="var(--color-teal)"
          dataKey="overall"
          data={trendData}
        />
        <TrendCard
          title="First-try accuracy"
          tone="var(--color-primary)"
          dataKey="accuracy"
          data={trendData}
        />
        <TrendCard
          title="Repair success"
          tone="var(--color-primary-container)"
          dataKey="repair"
          data={trendData}
        />
        <TrendCard
          title="Review success"
          tone="var(--color-coral)"
          dataKey="review"
          data={trendData}
        />
      </div>

      <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
        <div className="max-w-3xl">
          <p className="editorial-kicker">Mastery by structure</p>
          <h3 className="mt-3 text-[1.7rem] font-semibold text-[color:var(--color-ink)]">
            Stable gains come from review, not just good sessions
          </h3>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
            This view ranks the structures moving most right now. Teal shows total mastery; amber shows the recent seven-day lift.
          </p>
        </div>
        <div className="mt-5 h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={masteryData}
              layout="vertical"
              margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              barCategoryGap={14}
            >
              <CartesianGrid stroke="rgba(15,76,92,0.08)" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis
                dataKey="name"
                type="category"
                width={132}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--color-ink)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "rgba(15,76,92,0.05)" }}
                contentStyle={{
                  borderRadius: "16px",
                  border: "0",
                  boxShadow: "0 18px 36px rgba(25,28,29,0.08)",
                  background: "rgba(255,255,255,0.96)",
                }}
              />
              <Bar dataKey="mastery" radius={[999, 999, 999, 999]} fill="var(--color-primary)">
                {masteryData.map((entry) => (
                  <Cell key={`${entry.name}-mastery`} fill="var(--color-primary)" />
                ))}
              </Bar>
              <Bar dataKey="delta" radius={[999, 999, 999, 999]} fill="var(--color-hint-ink)">
                {masteryData.map((entry) => (
                  <Cell key={`${entry.name}-delta`} fill="var(--color-hint-ink)" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
