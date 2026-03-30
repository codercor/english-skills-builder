"use client";

import Link from "next/link";
import { startTransition, useMemo, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Surface } from "@/components/ui/surface";
import type { BuilderKind, LearningMapSnapshot } from "@/lib/types";
import { cn, formatDateShort, formatPercent } from "@/lib/utils";

type LearningNodeData = {
  title: string;
  subtitle: string;
  progressLabel: string;
  reviewDue: boolean;
  variant: "root" | "builder" | "topic";
  selected: boolean;
  builderKind?: BuilderKind;
};

const BUILDER_GROUP_WIDTH = 560;
const TOPIC_ROW_HEIGHT = 128;

function builderChipLabel(builderKind: BuilderKind) {
  if (builderKind === "phrase_idiom") {
    return "Phrases";
  }

  if (builderKind === "sentence") {
    return "Sentence";
  }

  if (builderKind === "vocabulary") {
    return "Vocabulary";
  }

  return "Grammar";
}

function builderTint(builderKind?: BuilderKind) {
  switch (builderKind) {
    case "vocabulary":
      return "var(--color-coral)";
    case "phrase_idiom":
      return "var(--color-hint-ink)";
    case "sentence":
      return "var(--color-primary-container)";
    case "grammar":
      return "var(--color-teal)";
    default:
      return "var(--color-primary)";
  }
}

function LearningMapNode({ data }: NodeProps<Node<LearningNodeData>>) {
  return (
    <div
      className={cn(
        "relative w-[224px] rounded-[1.7rem] border border-transparent bg-white px-4 py-4 shadow-[0_18px_40px_rgba(25,28,29,0.05)] transition",
        data.variant === "root" && "w-[260px] rounded-[2rem] bg-[linear-gradient(135deg,var(--color-primary),var(--color-primary-container))] text-white shadow-[0_22px_48px_rgba(25,28,29,0.12)]",
        data.selected && data.variant !== "root" && "border-[color:var(--color-primary)] shadow-[0_24px_46px_rgba(15,76,92,0.12)]",
        data.selected && data.variant === "root" && "ring-2 ring-white/70",
      )}
      style={{
        boxShadow:
          data.selected && data.variant !== "root"
            ? `0 24px 46px color-mix(in srgb, ${builderTint(data.builderKind)} 18%, transparent)`
            : undefined,
      }}
    >
      {data.variant !== "root" ? (
        <Handle
          type="target"
          position={Position.Top}
          className="!size-2.5 !border-0 !bg-[color:var(--color-soft)]"
        />
      ) : null}
      {data.variant !== "topic" ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            "!size-2.5 !border-0",
            data.variant === "root" ? "!bg-white/80" : "!bg-[color:var(--color-soft)]",
          )}
        />
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className={cn(
              "text-[0.68rem] font-semibold uppercase tracking-[0.08rem]",
              data.variant === "root" ? "text-white/62" : "text-[color:var(--color-muted)]",
            )}
          >
            {data.subtitle}
          </p>
          <p
            className={cn(
              "mt-2 font-display text-[1.05rem] font-semibold leading-tight",
              data.variant === "root" ? "text-white" : "text-[color:var(--color-ink)]",
            )}
          >
            {data.title}
          </p>
        </div>
        {data.reviewDue ? (
          <span
            className={cn(
              "mt-1 inline-flex rounded-full px-2 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.05rem]",
              data.variant === "root"
                ? "bg-white/14 text-white"
                : "bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)]",
            )}
          >
            Review
          </span>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-4 text-sm leading-6",
          data.variant === "root" ? "text-white/78" : "text-[color:var(--color-muted)]",
        )}
      >
        {data.progressLabel}
      </p>
    </div>
  );
}

const nodeTypes = { learningNode: LearningMapNode };

function buildFlowLayout(
  snapshot: LearningMapSnapshot,
  visibleBuilders: LearningMapSnapshot["builders"],
  selectedNodeId: string,
) {
  const visibleBuilderKinds = new Set(visibleBuilders.map((builder) => builder.builderKind));
  const visibleTopicNodes = snapshot.nodes.filter(
    (node) => node.kind === "topic" && node.builderKind && visibleBuilderKinds.has(node.builderKind),
  );
  const visibleNodeIds = new Set<string>([
    "root",
    ...visibleBuilders.map((builder) => `builder:${builder.builderKind}`),
    ...visibleTopicNodes.map((node) => node.id),
  ]);

  const maxTopicRows = Math.max(
    1,
    ...visibleBuilders.map((builder) => {
      const count = visibleTopicNodes.filter((node) => node.builderKind === builder.builderKind).length;
      return Math.ceil(count / 2);
    }),
  );
  const totalWidth = Math.max(1, visibleBuilders.length) * BUILDER_GROUP_WIDTH;
  const rootX = totalWidth / 2 - 130;

  const flowNodes: Node<LearningNodeData>[] = [
    {
      id: "root",
      type: "learningNode",
      position: { x: rootX, y: 8 },
      draggable: false,
      selectable: true,
      data: {
        title: snapshot.rootLabel,
        subtitle: "Profile graph",
        progressLabel: "Choose a builder or topic to inspect mastery, review pressure, and the next practice entry point.",
        reviewDue: snapshot.nodes.find((node) => node.id === "root")?.reviewDue ?? false,
        variant: "root",
        selected: selectedNodeId === "root",
      },
    },
  ];

  const flowEdges: Edge[] = [];

  visibleBuilders.forEach((builder, builderIndex) => {
    const groupStart = builderIndex * BUILDER_GROUP_WIDTH;
    const builderNodeId = `builder:${builder.builderKind}`;
    const builderSnapshotNode = snapshot.nodes.find((node) => node.id === builderNodeId);
    const builderTopics = visibleTopicNodes.filter((node) => node.builderKind === builder.builderKind);

    flowNodes.push({
      id: builderNodeId,
      type: "learningNode",
      position: { x: groupStart + 168, y: 172 },
      draggable: false,
      selectable: true,
      data: {
        title: builder.title,
        subtitle: "Builder",
        progressLabel: builderSnapshotNode?.stateLabel ?? `${builder.practicedTopics}/${builder.totalTopics} active`,
        reviewDue: builderSnapshotNode?.reviewDue ?? false,
        variant: "builder",
        selected: selectedNodeId === builderNodeId,
        builderKind: builder.builderKind,
      },
    });

    flowEdges.push({
      id: `root-${builderNodeId}`,
      source: "root",
      target: builderNodeId,
      type: "smoothstep",
      animated: false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
      style: {
        stroke: "rgba(15,76,92,0.24)",
        strokeWidth: 1.6,
      },
    });

    builderTopics.forEach((topicNode, topicIndex) => {
      const column = topicIndex % 2;
      const row = Math.floor(topicIndex / 2);
      const x = groupStart + column * 272;
      const y = 344 + row * TOPIC_ROW_HEIGHT;

      flowNodes.push({
        id: topicNode.id,
        type: "learningNode",
        position: { x, y },
        draggable: false,
        selectable: true,
        data: {
          title: topicNode.label,
          subtitle: builderChipLabel(topicNode.builderKind ?? builder.builderKind),
          progressLabel: `${topicNode.stateLabel} · ${formatPercent(topicNode.progress)}`,
          reviewDue: topicNode.reviewDue,
          variant: "topic",
          selected: selectedNodeId === topicNode.id,
          builderKind: topicNode.builderKind,
        },
      });

      flowEdges.push({
        id: `${builderNodeId}-${topicNode.id}`,
        source: builderNodeId,
        target: topicNode.id,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "rgba(15,76,92,0.18)",
          strokeWidth: 1.4,
        },
      });
    });
  });

  snapshot.edges
    .filter(
      (edge) =>
        edge.kind === "prerequisite" &&
        visibleNodeIds.has(edge.source) &&
        visibleNodeIds.has(edge.target),
    )
    .forEach((edge) => {
      flowEdges.push({
        id: `${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "rgba(194,126,32,0.38)",
          strokeDasharray: "6 8",
          strokeWidth: 1.35,
        },
      });
    });

  return {
    flowNodes,
    flowEdges,
    canvasHeight: Math.max(600, 380 + maxTopicRows * TOPIC_ROW_HEIGHT),
  };
}

export function LearningMapGraph({
  snapshot,
}: {
  snapshot: LearningMapSnapshot;
}) {
  const [selectedBuilder, setSelectedBuilder] = useState<BuilderKind | "all">("all");
  const [selectedNodeId, setSelectedNodeId] = useState("root");

  const visibleBuilders = useMemo(
    () =>
      selectedBuilder === "all"
        ? snapshot.builders
        : snapshot.builders.filter((builder) => builder.builderKind === selectedBuilder),
    [selectedBuilder, snapshot.builders],
  );

  const visibleNodeIds = useMemo(() => {
    const builderKinds = new Set(visibleBuilders.map((builder) => builder.builderKind));
    return new Set([
      "root",
      ...visibleBuilders.map((builder) => `builder:${builder.builderKind}`),
      ...snapshot.nodes
        .filter(
          (node) =>
            node.kind === "topic" &&
            node.builderKind &&
            builderKinds.has(node.builderKind),
        )
        .map((node) => node.id),
    ]);
  }, [snapshot.nodes, visibleBuilders]);

  const activeSelectedNodeId = visibleNodeIds.has(selectedNodeId)
    ? selectedNodeId
    : "root";

  const layout = useMemo(
    () => buildFlowLayout(snapshot, visibleBuilders, activeSelectedNodeId),
    [activeSelectedNodeId, snapshot, visibleBuilders],
  );

  const nodesById = useMemo(
    () => new Map(snapshot.nodes.map((node) => [node.id, node])),
    [snapshot.nodes],
  );
  const selectedNode =
    nodesById.get(activeSelectedNodeId) ?? nodesById.get("root");
  const topicPreviewByKey = useMemo(
    () => new Map(snapshot.topicPreviews.map((preview) => [preview.topicKey, preview])),
    [snapshot.topicPreviews],
  );
  const selectedTopicPreview =
    selectedNode?.kind === "topic"
      ? topicPreviewByKey.get(selectedNode.id.replace("topic:", ""))
      : null;
  const selectedBuilderMeta =
    selectedNode?.builderKind
      ? snapshot.builders.find((builder) => builder.builderKind === selectedNode.builderKind)
      : null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_22rem]">
      <Surface className="tonal-card overflow-hidden px-4 py-5 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="editorial-kicker">Learning map</p>
            <h3 className="mt-3 text-[1.8rem] font-semibold text-[color:var(--color-ink)]">
              See what connects, what is fading, and where to re-enter practice
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04rem] transition",
                selectedBuilder === "all"
                  ? "bg-[color:var(--color-primary)] text-white"
                  : "bg-[color:var(--color-panel)] text-[color:var(--color-muted)]",
              )}
              onClick={() => {
                startTransition(() => {
                  setSelectedBuilder("all");
                  setSelectedNodeId("root");
                });
              }}
            >
              All builders
            </button>
            {snapshot.builders.map((builder) => (
              <button
                key={builder.builderKind}
                type="button"
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.04rem] transition",
                  selectedBuilder === builder.builderKind
                    ? "bg-[color:var(--color-primary)] text-white"
                    : "bg-[color:var(--color-panel)] text-[color:var(--color-muted)]",
                )}
                onClick={() => {
                  startTransition(() => {
                    setSelectedBuilder(builder.builderKind);
                    setSelectedNodeId(`builder:${builder.builderKind}`);
                  });
                }}
              >
                {builderChipLabel(builder.builderKind)}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] bg-[linear-gradient(180deg,color-mix(in_srgb,var(--color-soft)_72%,white)_0%,var(--color-panel)_100%)] p-2 sm:p-3">
          <div
            className="overflow-hidden rounded-[1.7rem] bg-white"
            style={{ height: `${layout.canvasHeight}px` }}
          >
            <ReactFlow
              nodes={layout.flowNodes}
              edges={layout.flowEdges}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.14, duration: 550 }}
              minZoom={0.45}
              maxZoom={1.15}
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_, node) => setSelectedNodeId(node.id)}
              className="bg-[radial-gradient(circle_at_top,rgba(15,76,92,0.06),transparent_38%),linear-gradient(180deg,#ffffff,#f7f8f8)]"
            >
              <MiniMap
                pannable
                zoomable
                className="!hidden !rounded-[1.4rem] !bg-[rgba(255,255,255,0.92)] !shadow-[0_14px_34px_rgba(25,28,29,0.08)] lg:!block"
                nodeColor={(node) => {
                  const builderKind = (node.data as LearningNodeData | undefined)?.builderKind;
                  return builderTint(builderKind);
                }}
                maskColor="rgba(248,249,250,0.72)"
              />
              <Controls
                showInteractive={false}
                className="!rounded-[1.2rem] !border-0 !bg-white/92 !shadow-[0_16px_30px_rgba(25,28,29,0.08)]"
              />
              <Background
                color="rgba(15,76,92,0.08)"
                gap={20}
                size={1}
                variant={BackgroundVariant.Dots}
              />
            </ReactFlow>
          </div>
        </div>
      </Surface>

      <Surface className="tonal-card space-y-4">
        <div>
          <p className="editorial-kicker">Selected node</p>
          <h3 className="mt-3 text-[1.6rem] font-semibold text-[color:var(--color-ink)]">
            {selectedNode?.label ?? snapshot.rootLabel}
          </h3>
        </div>

        <div className="rounded-[1.8rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
              {selectedNode?.stateLabel ?? "Live map"}
            </p>
            <Badge
              className={cn(
                "shadow-none",
                selectedNode?.reviewDue
                  ? "bg-[color:var(--color-hint)] text-[color:var(--color-hint-ink)]"
                  : "bg-[color:var(--color-soft)] text-[color:var(--color-muted)]",
              )}
            >
              {selectedNode?.reviewDue ? "Review due" : "No due review"}
            </Badge>
          </div>
          <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
            {selectedNode?.kind === "root"
              ? "The root view tells you whether the full learning system has review pressure anywhere and lets you narrow the graph by builder."
              : selectedNode?.kind === "builder"
                ? `${selectedBuilderMeta?.description ?? "This builder groups related topics into one practice lane."}`
                : `Progress ${formatPercent(selectedNode?.progress ?? 0)} in this topic. The preview below shows the last work you actually did here so you can re-enter with context.`}
          </p>
        </div>

        {selectedNode?.builderKind ? (
          <Badge>{builderChipLabel(selectedNode.builderKind)}</Badge>
        ) : null}

        <div className="space-y-3">
          {selectedNode?.kind === "builder" ? (
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              Builder nodes show the whole lane. Use them when you want to browse topics manually instead of waiting for the recommendation engine.
            </div>
          ) : null}
          {selectedNode?.kind === "topic" ? (
            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              Topic nodes connect current mastery, review pressure, and direct practice entry. This is the fastest way to revisit a single concept from inside your profile.
            </div>
          ) : null}
          <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
            Prerequisite lines show where one topic supports another. Builder branches keep grammar, vocabulary, phrases, and sentence work inside the same mastery system.
          </div>
        </div>

        {selectedTopicPreview ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">Topic state</p>
                <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                  {selectedTopicPreview.stateLabel}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  Mastery {formatPercent(selectedTopicPreview.masteryScore)}
                </p>
              </div>
              <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                <p className="editorial-kicker">Last touch</p>
                <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                  {selectedTopicPreview.lastPracticedAt
                    ? formatDateShort(selectedTopicPreview.lastPracticedAt)
                    : "Not yet practised"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                  {selectedTopicPreview.nextReviewAt
                    ? `Next review ${formatDateShort(selectedTopicPreview.nextReviewAt)}`
                    : "No review scheduled yet"}
                </p>
              </div>
            </div>

            {selectedTopicPreview.builderKind === "vocabulary" ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  <p className="editorial-kicker">Learned items</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                    {selectedTopicPreview.learnedItemsCount ?? 0}
                  </p>
                </div>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  <p className="editorial-kicker">Stable items</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                    {selectedTopicPreview.stableItemsCount ?? 0}
                  </p>
                </div>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  <p className="editorial-kicker">Due word cards</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                    {selectedTopicPreview.dueItemCards ?? 0}
                  </p>
                </div>
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)] sm:col-span-3">
                  <p className="editorial-kicker">Usage still unproven</p>
                  <p className="mt-3 text-lg font-semibold text-[color:var(--color-ink)]">
                    {selectedTopicPreview.unprovenItemsCount ?? 0} item
                    {(selectedTopicPreview.unprovenItemsCount ?? 0) === 1 ? "" : "s"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
                    These are items you may recognize but have not yet used reliably enough to count as stable.
                  </p>
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
              <p className="editorial-kicker">Recent practice summary</p>
              <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                {selectedTopicPreview.practiceSessions} practice session
                {selectedTopicPreview.practiceSessions === 1 ? "" : "s"} ·{" "}
                {selectedTopicPreview.reviewSessions} review session
                {selectedTopicPreview.reviewSessions === 1 ? "" : "s"} ·{" "}
                {selectedTopicPreview.attempts} checked response
                {selectedTopicPreview.attempts === 1 ? "" : "s"} ·{" "}
                {formatPercent(selectedTopicPreview.firstTryAccuracy)} first-try accuracy ·{" "}
                {formatPercent(selectedTopicPreview.repairSuccess)} repair success
              </p>
              {selectedTopicPreview.builderKind === "vocabulary" &&
              selectedTopicPreview.recentLearnedItems?.length ? (
                <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                  Recent items: {selectedTopicPreview.recentLearnedItems.join(" · ")}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div>
                <p className="editorial-kicker">Recent exercises</p>
                <h4 className="mt-2 text-lg font-semibold text-[color:var(--color-ink)]">
                  The latest work inside this topic
                </h4>
              </div>
              {selectedTopicPreview.recentExercises.length ? (
                selectedTopicPreview.recentExercises.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 shadow-[0_16px_32px_rgba(25,28,29,0.03)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                        {entry.sessionTitle}
                      </p>
                      <Badge>{formatDateShort(entry.createdAt)}</Badge>
                    </div>
                    <p className="mt-3 text-[0.72rem] uppercase tracking-[0.04rem] text-[color:var(--color-muted)]">
                      {entry.mode} · {entry.lane}
                    </p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[color:var(--color-ink)]">
                      {entry.prompt}
                    </p>
                    {entry.targetItemLabel ? (
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        Target item: <span className="text-[color:var(--color-ink)]">{entry.targetItemLabel}</span>
                      </p>
                    ) : null}
                    <p className="mt-3 text-sm leading-7 text-[color:var(--color-muted)]">
                      Your answer: <span className="text-[color:var(--color-ink)]">{entry.userResponse}</span>
                    </p>
                    {entry.naturalRewrite ? (
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        Better version: <span className="text-[color:var(--color-ink)]">{entry.naturalRewrite}</span>
                      </p>
                    ) : null}
                    {entry.feedbackSummary ? (
                      <p className="mt-2 text-sm leading-7 text-[color:var(--color-muted)]">
                        Feedback: {entry.feedbackSummary}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[1.7rem] bg-[color:var(--color-panel)] px-4 py-4 text-sm leading-7 text-[color:var(--color-muted)] shadow-[0_16px_32px_rgba(25,28,29,0.03)]">
                  This topic has not produced a stored exercise history yet. Start the lesson once and the map will begin showing real past work here.
                </div>
              )}
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {selectedNode?.href ? (
            <Link href={selectedNode.href} className="inline-flex">
              <Button>
                {selectedNode?.kind === "topic" ? "Open full topic detail" : "Open node"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </Link>
          ) : null}
          <Link href="/builders" className="inline-flex">
            <Button variant="ghost">
              Open builders
              <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </div>
      </Surface>
    </div>
  );
}
