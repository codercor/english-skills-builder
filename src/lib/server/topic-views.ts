import { subDays } from "date-fns";
import { and, desc, eq, inArray } from "drizzle-orm";
import {
  builderRouteSegment,
  builderMeta,
  getBuilderKinds,
  getBuilderMeta,
  getStructureUnit,
  structureCatalog,
} from "@/lib/catalog";
import { db } from "@/lib/db/client";
import {
  feedbackEvents,
  masteryRecords,
  practiceItems,
  practiceSessions,
  reviewItems,
  userResponses,
} from "@/lib/db/schema";
import type {
  BuilderCatalogSnapshot,
  BuilderKind,
  BuildersHubSnapshot,
  ContinueLearningSnapshot,
  LearningMapSnapshot,
  LearningMode,
  TopicExerciseHistoryEntry,
  TopicDetailSnapshot,
  TopicProgressSnapshot,
  Viewer,
} from "@/lib/types";
import { average, formatDateShort, round } from "@/lib/utils";

type Db = NonNullable<typeof db>;

function requireDb(): Db {
  if (!db) {
    throw new Error("Database is not configured.");
  }

  return db;
}

export function buildTopicSessionHref(
  builderKind: BuilderKind,
  topicKey: string,
  learningMode: LearningMode,
) {
  return `/practice/topic--${builderKind}--${topicKey}--${learningMode}`;
}

function topicStateLabel(state: TopicProgressSnapshot["state"]) {
  switch (state) {
    case "not_started":
      return "Not started";
    case "learning":
      return "Learning";
    case "improving":
      return "Improving";
    case "unstable":
      return "Needs review";
    case "stable":
      return "Stable";
    case "strong":
      return "Strong";
    default:
      return "Learning";
  }
}

function inferTopicState(params: {
  attempts: number;
  masteryScore: number;
  reviewDueCount: number;
  repeatedErrorRate: number;
  reviewSuccessRate: number;
  masteryStage: string | null;
}) {
  if (!params.attempts) {
    return "not_started" as const;
  }

  if (params.reviewDueCount > 0 || params.repeatedErrorRate > 0.24) {
    return "unstable" as const;
  }

  if (params.masteryStage === "stable" && params.masteryScore >= 0.86 && params.reviewSuccessRate >= 0.72) {
    return "strong" as const;
  }

  if (params.masteryStage === "stable" || params.masteryScore >= 0.74) {
    return "stable" as const;
  }

  if (params.masteryScore >= 0.5) {
    return "improving" as const;
  }

  return "learning" as const;
}

function inferRecommendedAction(topic: TopicProgressSnapshot): LearningMode {
  if (topic.reviewDueCount > 0) {
    return "review";
  }

  if (!topic.attempts) {
    return "learn";
  }

  if (topic.state === "strong" || topic.masteryScore >= 0.78) {
    return "challenge";
  }

  if (topic.state === "unstable") {
    return "review";
  }

  return "practice";
}

async function getTopicExerciseHistoryMap(
  viewer: Viewer,
  options?: {
    topicKeys?: string[];
    limitPerTopic?: number;
  },
): Promise<Map<string, TopicExerciseHistoryEntry[]>> {
  const database = requireDb();
  const topicKeys = options?.topicKeys?.length ? [...new Set(options.topicKeys)] : null;
  const sessionRows = await database
    .select()
    .from(practiceSessions)
    .where(
      topicKeys
        ? and(
            eq(practiceSessions.userId, viewer.id),
            inArray(practiceSessions.primaryStructure, topicKeys),
          )
        : eq(practiceSessions.userId, viewer.id),
    )
    .orderBy(desc(practiceSessions.createdAt));

  if (!sessionRows.length) {
    return new Map();
  }

  const sessionIds = sessionRows.map((row) => row.id);
  const [itemRows, responseRows] = await Promise.all([
    database
      .select()
      .from(practiceItems)
      .where(inArray(practiceItems.sessionId, sessionIds)),
    database
      .select()
      .from(userResponses)
      .where(
        and(
          eq(userResponses.userId, viewer.id),
          inArray(userResponses.sessionId, sessionIds),
        ),
      )
      .orderBy(desc(userResponses.createdAt)),
  ]);

  const responseIds = responseRows.map((row) => row.id);
  const feedbackRows = responseIds.length
    ? await database
        .select()
        .from(feedbackEvents)
        .where(inArray(feedbackEvents.responseId, responseIds))
    : [];

  const sessionById = new Map(sessionRows.map((row) => [row.id, row]));
  const itemById = new Map(itemRows.map((row) => [row.id, row]));
  const feedbackByResponseId = new Map(
    feedbackRows.map((row) => [row.responseId, row]),
  );
  const latestByExercise = new Map<
    string,
    {
      session: (typeof practiceSessions.$inferSelect);
      response: (typeof userResponses.$inferSelect);
      item: (typeof practiceItems.$inferSelect);
      feedback: (typeof feedbackEvents.$inferSelect) | undefined;
    }
  >();

  for (const response of responseRows) {
    const session = sessionById.get(response.sessionId);
    const item = itemById.get(response.itemId);

    if (!session || !item) {
      continue;
    }

    if (topicKeys && !topicKeys.includes(session.primaryStructure)) {
      continue;
    }

    const exerciseKey = `${response.sessionId}:${response.itemId}`;
    if (latestByExercise.has(exerciseKey)) {
      continue;
    }

    latestByExercise.set(exerciseKey, {
      session,
      response,
      item,
      feedback: feedbackByResponseId.get(response.id),
    });
  }

  const grouped = new Map<string, TopicExerciseHistoryEntry[]>();
  const sortedEntries = [...latestByExercise.values()].sort(
    (left, right) =>
      right.response.createdAt.getTime() - left.response.createdAt.getTime(),
  );

  for (const entry of sortedEntries) {
    const topicKey = entry.session.primaryStructure;
    const current = grouped.get(topicKey) ?? [];

    if (options?.limitPerTopic && current.length >= options.limitPerTopic) {
      continue;
    }

    current.push({
      id: entry.response.id,
      sessionId: entry.session.id,
      createdAt: entry.response.createdAt.toISOString(),
      sessionTitle: entry.session.title,
      learningScore: entry.session.learningScore,
      lane: entry.session.lane as TopicExerciseHistoryEntry["lane"],
      mode: entry.session.mode as TopicExerciseHistoryEntry["mode"],
      prompt: entry.item.prompt,
      userResponse: entry.response.rawUserResponse,
      acceptedAnswer: entry.item.acceptedAnswer,
      naturalRewrite: entry.feedback?.naturalRewrite ?? null,
      feedbackSummary: entry.feedback?.hint1 ?? null,
      whyItWorks: entry.feedback?.whyItWorks ?? null,
      firstTrySuccess: entry.response.firstTrySuccess,
      repairSuccess: entry.response.repairSuccess,
      acceptedAnswerShown: entry.response.acceptedAnswerShown,
      responseScore: entry.response.responseScore,
    });
    grouped.set(topicKey, current);
  }

  return grouped;
}

export async function getTopicProgressSnapshots(
  viewer: Viewer,
): Promise<TopicProgressSnapshot[]> {
  const database = requireDb();
  const [masteryRows, sessionRows, reviewRows] = await Promise.all([
    database
      .select()
      .from(masteryRecords)
      .where(eq(masteryRecords.userId, viewer.id)),
    database
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, viewer.id))
      .orderBy(desc(practiceSessions.createdAt)),
    database
      .select()
      .from(reviewItems)
      .where(
        and(
          eq(reviewItems.userId, viewer.id),
          eq(reviewItems.status, "due"),
        ),
      ),
  ]);

  const sessionIds = sessionRows.map((row) => row.id);
  const responseRows = sessionIds.length
    ? await database
        .select()
        .from(userResponses)
        .where(inArray(userResponses.sessionId, sessionIds))
    : [];

  const responsesBySessionId = new Map<string, typeof responseRows>();
  for (const response of responseRows) {
    const current = responsesBySessionId.get(response.sessionId) ?? [];
    current.push(response);
    responsesBySessionId.set(response.sessionId, current);
  }

  const masteryByKey = new Map(masteryRows.map((row) => [row.structureKey, row]));
  const dueCountsByKey = new Map<string, number>();
  const nextDueByKey = new Map<string, Date>();

  const now = new Date();

  for (const item of reviewRows) {
    if (item.dueAt <= now) {
      dueCountsByKey.set(item.structureKey, (dueCountsByKey.get(item.structureKey) ?? 0) + 1);
    }
    const current = nextDueByKey.get(item.structureKey);
    if (!current || item.dueAt < current) {
      nextDueByKey.set(item.structureKey, item.dueAt);
    }
  }

  const sessionMetricsByKey = new Map<
    string,
    {
      practiceSessions: number;
      reviewSessions: number;
      attempts: number;
      firstTry: number[];
      repair: number[];
      lastPracticedAt: Date | null;
    }
  >();

  for (const session of sessionRows) {
    const bucket =
      sessionMetricsByKey.get(session.primaryStructure) ??
      {
        practiceSessions: 0,
        reviewSessions: 0,
        attempts: 0,
        firstTry: [],
        repair: [],
        lastPracticedAt: null as Date | null,
      };
    const responses = responsesBySessionId.get(session.id) ?? [];

    if (session.mode === "review") {
      bucket.reviewSessions += 1;
    } else {
      bucket.practiceSessions += 1;
    }

    bucket.attempts += responses.length;
    bucket.firstTry.push(...responses.map((row) => (row.firstTrySuccess ? 1 : 0)));
    bucket.repair.push(...responses.map((row) => (row.repairSuccess ? 1 : 0)));
    if (!bucket.lastPracticedAt || session.createdAt > bucket.lastPracticedAt) {
      bucket.lastPracticedAt = session.createdAt;
    }

    sessionMetricsByKey.set(session.primaryStructure, bucket);
  }

  return structureCatalog.map((topic) => {
    const mastery = masteryByKey.get(topic.key);
    const metrics = sessionMetricsByKey.get(topic.key);
    const attempts = metrics?.attempts ?? 0;
    const state = inferTopicState({
      attempts,
      masteryScore: mastery?.masteryScore ?? 0,
      reviewDueCount: dueCountsByKey.get(topic.key) ?? 0,
      repeatedErrorRate: mastery?.repeatedErrorRate14d ?? 0.32,
      reviewSuccessRate: mastery?.reviewSuccessRate30d ?? 0,
      masteryStage: mastery?.masteryStage ?? null,
    });
    const snapshot: TopicProgressSnapshot = {
      topicKey: topic.key,
      builderKind: topic.builderKind,
      title: topic.title,
      family: topic.family,
      categoryPath: topic.categoryPath,
      levelBand: (mastery?.currentLevelBand ?? topic.baseLevel) as TopicProgressSnapshot["levelBand"],
      masteryScore: mastery?.masteryScore ?? 0,
      state,
      stateLabel: topicStateLabel(state),
      practiceSessions: metrics?.practiceSessions ?? 0,
      reviewSessions: metrics?.reviewSessions ?? 0,
      attempts,
      firstTryAccuracy: round(average(metrics?.firstTry ?? [])),
      repairSuccess: round(average(metrics?.repair ?? [])),
      lastPracticedAt: metrics?.lastPracticedAt?.toISOString() ?? null,
      nextReviewAt: nextDueByKey.get(topic.key)?.toISOString() ?? null,
      reviewDueCount: dueCountsByKey.get(topic.key) ?? 0,
      recommendedAction: "learn",
      lastActionLabel:
        metrics?.lastPracticedAt
          ? `Last touched ${formatDateShort(metrics.lastPracticedAt)}`
          : "No live practice yet",
    };

    snapshot.recommendedAction = inferRecommendedAction(snapshot);
    return snapshot;
  });
}

function sortTopicProgressForAction(topics: TopicProgressSnapshot[]) {
  return [...topics].sort((left, right) => {
    const leftScore =
      (left.reviewDueCount ? 3 : 0) +
      (left.state === "not_started" ? 2.4 : 0) +
      (left.state === "unstable" ? 2.1 : 0) +
      (1 - left.masteryScore) +
      (left.practiceSessions ? 0 : 0.4);
    const rightScore =
      (right.reviewDueCount ? 3 : 0) +
      (right.state === "not_started" ? 2.4 : 0) +
      (right.state === "unstable" ? 2.1 : 0) +
      (1 - right.masteryScore) +
      (right.practiceSessions ? 0 : 0.4);
    return rightScore - leftScore;
  });
}

function toLearnedTopic(topic: TopicProgressSnapshot): BuildersHubSnapshot["recentlyLearnedTopics"][number] {
  return {
    topicKey: topic.topicKey,
    title: topic.title,
    builderKind: topic.builderKind,
    stateLabel: topic.stateLabel,
    href: `/builders/${builderRouteSegment(topic.builderKind)}/${topic.topicKey}`,
  };
}

export async function getBuildersHubSnapshot(
  viewer: Viewer,
): Promise<BuildersHubSnapshot> {
  const topics = await getTopicProgressSnapshots(viewer);
  const sortedByRecent = [...topics]
    .filter((topic) => topic.lastPracticedAt)
    .sort((left, right) => {
      return (
        new Date(right.lastPracticedAt ?? 0).getTime() -
        new Date(left.lastPracticedAt ?? 0).getTime()
      );
    });
  const builderCards = getBuilderKinds().map((builderKind) => {
    const builderTopics = topics.filter((topic) => topic.builderKind === builderKind);
    const weakest = sortTopicProgressForAction(builderTopics)[0] ?? null;
    const practicedTopics = builderTopics.filter((topic) => topic.attempts > 0);
    const activeTopics = builderTopics.filter((topic) =>
      ["learning", "improving", "unstable"].includes(topic.state),
    );
    const dueReviews = builderTopics.reduce((sum, topic) => sum + topic.reviewDueCount, 0);
    const continueTopic =
      [...builderTopics]
        .filter((topic) => topic.lastPracticedAt)
        .sort(
          (left, right) =>
            new Date(right.lastPracticedAt ?? 0).getTime() -
            new Date(left.lastPracticedAt ?? 0).getTime(),
        )[0] ?? weakest;

    return {
      builderKind,
      title: builderMeta[builderKind].title,
      description: builderMeta[builderKind].description,
      learnedTopics: practicedTopics.length,
      activeTopics: activeTopics.length,
      dueReviews,
      weakestTopicTitle: weakest?.title ?? null,
      href: `/builders/${builderRouteSegment(builderKind)}`,
      recommendedHref: weakest
        ? buildTopicSessionHref(
            builderKind,
            weakest.topicKey,
            weakest.recommendedAction,
          )
        : `/builders/${builderRouteSegment(builderKind)}`,
      continueHref: continueTopic
        ? `/builders/${builderRouteSegment(builderKind)}/${continueTopic.topicKey}`
        : `/builders/${builderRouteSegment(builderKind)}`,
    };
  });

  const underPracticedAreas = topics
    .filter((topic) => {
      if (!topic.lastPracticedAt) {
        return true;
      }

      return new Date(topic.lastPracticedAt) < subDays(new Date(), 7);
    })
    .sort((left, right) => {
      if (left.lastPracticedAt && right.lastPracticedAt) {
        return new Date(left.lastPracticedAt).getTime() - new Date(right.lastPracticedAt).getTime();
      }

      if (!left.lastPracticedAt && right.lastPracticedAt) {
        return -1;
      }

      if (left.lastPracticedAt && !right.lastPracticedAt) {
        return 1;
      }

      return left.masteryScore - right.masteryScore;
    })
    .slice(0, 4)
    .map((topic) => ({
      builderKind: topic.builderKind,
      title: topic.title,
      note: topic.lastPracticedAt
        ? `${topic.title} has been quiet this week. One short session would keep it connected to the rest of your map.`
        : `${topic.title} has not been practised yet, so this builder still has untouched value for you.`,
      href: `/builders/${builderRouteSegment(topic.builderKind)}/${topic.topicKey}`,
    }));

  const continueLearning: ContinueLearningSnapshot[] = sortedByRecent
    .slice(0, 4)
    .map((topic) => ({
      builderKind: topic.builderKind,
      title: topic.title,
      note:
        topic.reviewDueCount > 0
          ? `${topic.reviewDueCount} review item${topic.reviewDueCount === 1 ? "" : "s"} are waiting here.`
          : `${topic.stateLabel} and still moving. This is the easiest topic to pick back up.`,
      href: `/builders/${builderRouteSegment(topic.builderKind)}/${topic.topicKey}`,
    }));

  const recentlyLearnedTopics = sortTopicProgressForAction(
    topics.filter((topic) => topic.attempts > 0),
  )
    .sort((left, right) => {
      return (
        new Date(right.lastPracticedAt ?? 0).getTime() -
        new Date(left.lastPracticedAt ?? 0).getTime()
      );
    })
    .slice(0, 6)
    .map(toLearnedTopic);

  return {
    builderCards,
    continueLearning,
    underPracticedAreas,
    recentlyLearnedTopics,
  };
}

export async function getBuilderCatalogSnapshot(
  viewer: Viewer,
  builderKind: BuilderKind,
): Promise<BuilderCatalogSnapshot> {
  const topics = (await getTopicProgressSnapshots(viewer)).filter(
    (topic) => topic.builderKind === builderKind,
  );
  const meta = getBuilderMeta(builderKind);
  const sorted = sortTopicProgressForAction(topics);
  const recommended = sorted[0] ?? null;

  const categories = new Map<string, TopicProgressSnapshot[]>();
  for (const topic of topics) {
    const category = topic.categoryPath.at(-1) ?? topic.family;
    const current = categories.get(category) ?? [];
    current.push(topic);
    categories.set(category, current);
  }

  return {
    builderKind,
    title: meta.title,
    description: meta.description,
    spotlightTitle: recommended
      ? `Start with ${recommended.title}`
      : `Browse ${meta.shortTitle.toLowerCase()} topics`,
    spotlightBody: recommended
      ? recommended.state === "not_started"
        ? `${recommended.title} has not been practised yet, so it is a clean place to open this builder.`
        : `${recommended.title} is the clearest next move inside this builder right now.`
      : meta.description,
    recommendedTopicKey: recommended?.topicKey ?? null,
    recommendedTopicHref: recommended
      ? `/builders/${builderRouteSegment(builderKind)}/${recommended.topicKey}`
      : null,
    totalTopics: topics.length,
    practicedTopics: topics.filter((topic) => topic.attempts > 0).length,
    dueReviews: topics.reduce((sum, topic) => sum + topic.reviewDueCount, 0),
    categories: [...categories.entries()].map(([category, categoryTopics]) => ({
      category,
      topics: sortTopicProgressForAction(categoryTopics),
    })),
  };
}

export async function getTopicDetailSnapshot(
  viewer: Viewer,
  builderKind: BuilderKind,
  topicKey: string,
): Promise<TopicDetailSnapshot | null> {
  const topic = getStructureUnit(topicKey);
  if (!topic || topic.builderKind !== builderKind) {
    return null;
  }

  const [allProgress, historyByTopic] = await Promise.all([
    getTopicProgressSnapshots(viewer),
    getTopicExerciseHistoryMap(viewer, { topicKeys: [topicKey] }),
  ]);
  const progress =
    allProgress.find((entry) => entry.topicKey === topicKey) ?? null;

  if (!progress) {
    return null;
  }

  const relatedTopics = allProgress.filter((entry) =>
    topic.relatedKeys.includes(entry.topicKey),
  );

  const nextActions = [
    { label: "Start 5-prompt lesson", href: buildTopicSessionHref(builderKind, topicKey, "learn") },
    { label: "Practice again", href: buildTopicSessionHref(builderKind, topicKey, "practice") },
    { label: "Review this topic", href: buildTopicSessionHref(builderKind, topicKey, "review") },
    { label: "Open challenge", href: buildTopicSessionHref(builderKind, topicKey, "challenge") },
  ];

  return {
    topic,
    progress,
    relatedTopics,
    practiceHistory: historyByTopic.get(topicKey) ?? [],
    nextActions,
  };
}

export async function getLearningMapSnapshot(
  viewer: Viewer,
): Promise<LearningMapSnapshot> {
  const [topics, historyByTopic] = await Promise.all([
    getTopicProgressSnapshots(viewer),
    getTopicExerciseHistoryMap(viewer, { limitPerTopic: 3 }),
  ]);
  const builders = getBuilderKinds().map((builderKind) => {
    const builderTopics = topics.filter((topic) => topic.builderKind === builderKind);
    return {
      builderKind,
      title: builderMeta[builderKind].title,
      description: builderMeta[builderKind].description,
      practicedTopics: builderTopics.filter((topic) => topic.attempts > 0).length,
      totalTopics: builderTopics.length,
    };
  });

  const nodes: LearningMapSnapshot["nodes"] = [
    {
      id: "root",
      label: "Your English",
      kind: "root",
      progress: round(average(topics.map((topic) => topic.masteryScore))),
      stateLabel: "Live map",
      reviewDue: topics.some((topic) => topic.reviewDueCount > 0),
    },
  ];

  const edges: LearningMapSnapshot["edges"] = [];

  for (const builder of builders) {
    const builderTopics = topics.filter((topic) => topic.builderKind === builder.builderKind);
    nodes.push({
      id: `builder:${builder.builderKind}`,
      label: builder.title,
      kind: "builder",
      builderKind: builder.builderKind,
      progress: round(average(builderTopics.map((topic) => topic.masteryScore))),
      stateLabel: `${builder.practicedTopics}/${builder.totalTopics} active`,
      reviewDue: builderTopics.some((topic) => topic.reviewDueCount > 0),
      href: `/builders/${builderRouteSegment(builder.builderKind)}`,
    });
    edges.push({ source: "root", target: `builder:${builder.builderKind}`, kind: "builder" });
  }

  for (const topic of topics) {
    nodes.push({
      id: `topic:${topic.topicKey}`,
      label: topic.title,
      kind: "topic",
      builderKind: topic.builderKind,
      progress: topic.masteryScore,
      stateLabel: topic.stateLabel,
      reviewDue: topic.reviewDueCount > 0,
      href: `/builders/${builderRouteSegment(topic.builderKind)}/${topic.topicKey}`,
    });
    edges.push({
      source: `builder:${topic.builderKind}`,
      target: `topic:${topic.topicKey}`,
      kind: "builder",
    });
  }

  for (const topic of structureCatalog) {
    for (const prerequisite of topic.prerequisiteKeys) {
      edges.push({
        source: `topic:${prerequisite}`,
        target: `topic:${topic.key}`,
        kind: "prerequisite",
      });
    }
  }

  return {
    rootLabel: "Your English Map",
    builders,
    nodes,
    edges,
    topicPreviews: topics.map((topic) => ({
      topicKey: topic.topicKey,
      title: topic.title,
      builderKind: topic.builderKind,
      stateLabel: topic.stateLabel,
      masteryScore: topic.masteryScore,
      reviewDueCount: topic.reviewDueCount,
      lastPracticedAt: topic.lastPracticedAt,
      nextReviewAt: topic.nextReviewAt,
      practiceSessions: topic.practiceSessions,
      reviewSessions: topic.reviewSessions,
      attempts: topic.attempts,
      firstTryAccuracy: topic.firstTryAccuracy,
      repairSuccess: topic.repairSuccess,
      recentExercises: historyByTopic.get(topic.topicKey) ?? [],
      href: `/builders/${builderRouteSegment(topic.builderKind)}/${topic.topicKey}`,
    })),
  };
}
