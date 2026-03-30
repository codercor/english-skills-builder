export type LevelBand = "A2" | "B1" | "B2" | "C1";
export type SkillArea = "grammar" | "vocabulary" | "sentence_building";
export type BuilderKind =
  | "grammar"
  | "vocabulary"
  | "phrase_idiom"
  | "sentence";
export type PracticeLane =
  | "Foundation"
  | "Controlled Production"
  | "Flexible Production"
  | "Advanced Expression"
  | "IELTS Precision";
export type PromptType =
  | "completion"
  | "rewrite"
  | "guided_generation"
  | "free_production"
  | "memory_anchor"
  | "constraint_based"
  | "error_correction";
export type MasteryStage = "fragile" | "emerging" | "developing" | "stable";
export type ProgressionState =
  | "locked"
  | "diagnosing"
  | "active_controlled"
  | "active_flexible"
  | "review_required"
  | "promotion_candidate"
  | "promoted_watch"
  | "stable_mastery"
  | "regression_watch";
export type DecisionType =
  | "promote"
  | "hold"
  | "assign_review"
  | "difficulty_up"
  | "difficulty_down"
  | "switch_prompt_type"
  | "prioritize_weakness"
  | "schedule_recalibration";
export type RecommendationKind =
  | "new_practice"
  | "weakness_repair"
  | "due_review"
  | "custom_structure"
  | "recalibration";
export type SessionMode = "practice" | "review";
export type LearningMode = "learn" | "practice" | "review" | "challenge";
export type UserFacingStage =
  | "Needs work"
  | "Improving"
  | "Nearly stable"
  | "Strong"
  | "Needs review"
  | "Close to moving up";
export type TopicState =
  | "not_started"
  | "learning"
  | "improving"
  | "unstable"
  | "stable"
  | "strong";

export interface StructureUnit {
  key: string;
  title: string;
  family: string;
  description: string;
  skillArea: SkillArea;
  builderKind: BuilderKind;
  baseLevel: LevelBand;
  supportObjective: string;
  categoryPath: string[];
  teachingSummary: string;
  whenToUse: string;
  whenNotToUse: string;
  examples: string[];
  commonMistakes: string[];
  prerequisiteKeys: string[];
  relatedKeys: string[];
}

export type LearningTopic = StructureUnit;

export interface CandidateAction {
  kind: RecommendationKind;
  title: string;
  structureKey?: string;
  levelBand?: LevelBand;
  reason: string;
  score: number;
  promptType?: PromptType;
  memoryAnchor?: boolean;
  href: string;
}

export interface RecommendationPayload {
  selected: CandidateAction;
  ranked: CandidateAction[];
  rationale: string;
}

export interface HighlightedSpan {
  text: string;
  reason: string;
  severity: "low" | "medium" | "high";
}

export interface FeedbackPayload {
  itemId: string;
  structureKey: string;
  highlightedSpans: HighlightedSpan[];
  errorTags: string[];
  hint1: string;
  hint2: string;
  acceptedAnswer: string;
  naturalRewrite: string;
  levelUpVariants: Array<{ level: LevelBand; text: string }>;
  whyItWorks: string;
  qualityScore: number;
  responseScore: number;
  shouldUpdateMastery: boolean;
  isAccepted: boolean;
  canRevealAnswer: boolean;
}

export interface PracticeItem {
  id: string;
  prompt: string;
  promptType: PromptType;
  structureKey: string;
  levelBand: LevelBand;
  supportObjective: string;
  topic: string;
  memoryAnchor: boolean;
  acceptedAnswer: string;
  whyItWorks: string;
  hint1: string;
  hint2: string;
  naturalRewrite: string;
  levelUpVariants: Array<{ level: LevelBand; text: string }>;
  evaluationRubric: {
    requiredTokens: string[];
    preferredPhrases?: string[];
    errorTag: string;
    commonSlip: string;
    severity: "low" | "medium" | "high";
  };
}

export interface PracticeSession {
  id: string;
  title: string;
  description: string;
  mode: SessionMode;
  learningMode: LearningMode;
  builderKind: BuilderKind;
  topicKey: string;
  primaryStructure: string;
  supportObjective: string;
  targetLevel: LevelBand;
  lane: PracticeLane;
  focusReason: string;
  items: PracticeItem[];
}

export interface ReviewItem {
  id: string;
  structureKey: string;
  topicTitle: string;
  builderKind: BuilderKind;
  prompt: string;
  targetLevel: LevelBand;
  dueAt: string;
  source:
    | "repeated_mistake"
    | "failed_structure"
    | "promotion_guardrail"
    | "boss_recovery"
    | "forgotten_pattern";
  note: string;
}

export interface AssessmentQuestion {
  id: string;
  kind: PromptType;
  prompt: string;
  targetStructure: string;
  targetLevel: LevelBand;
  rubric: string;
}

export interface AssessmentResult {
  overallLevel: LevelBand;
  grammarControl: LevelBand;
  vocabularyUsage: LevelBand;
  sentenceBuilding: LevelBand;
  topGrowthAreas: string[];
  initialLane: PracticeLane;
  confidence: number;
}

export interface SkillSnapshot {
  area: SkillArea;
  label: string;
  levelBand: LevelBand;
  score: number;
  trend: number[];
}

export interface MasteryRecord {
  userId: string;
  structureKey: string;
  currentLevelBand: LevelBand;
  masteryScore: number;
  masteryStage: MasteryStage;
  masteryConfidence: number;
  attemptCountTotal: number;
  attemptCountRecent: number;
  firstTrySuccessRate14d: number;
  repairSuccessRate14d: number;
  reviewSuccessRate30d: number;
  repeatedErrorRate14d: number;
  hintDependenceRate14d: number;
  promptTypeCoverage: number;
  promptTypes: PromptType[];
  stabilityScore: number;
  lastAttemptAt: string;
  lastReviewAt: string;
  nextReviewDueAt: string;
  promotionEligible: boolean;
  demotionRisk: boolean;
  progressionState: ProgressionState;
  masteryDelta7d: number;
  title: string;
  supportObjective: string;
}

export interface ProgressionDecisionPayload {
  decisionType: DecisionType;
  previousState: ProgressionState;
  newState: ProgressionState;
  targetLevelBand: LevelBand;
  confidence: number;
  reasonCodes: string[];
  expectedEffect: string;
}

export interface DecisionLog {
  decisionId: string;
  userId: string;
  sessionId: string;
  structureKey: string;
  decisionType: DecisionType;
  previousState: ProgressionState;
  newState: ProgressionState;
  currentLevelBand: LevelBand;
  targetLevelBand: LevelBand;
  decisionTimestamp: string;
  decisionConfidence: number;
  reasonCodes: string[];
  inputSnapshot: Record<string, number>;
  candidateActions: CandidateAction[];
  selectedAction: CandidateAction;
  llmUsed: boolean;
  llmModel: string;
  llmRationale: string;
  expectedEffect: string;
  evaluationWindowEnd: string;
  observedEffect: "positive" | "neutral" | "negative" | "insufficient_data";
  decisionQuality: "good" | "mixed" | "poor" | "pending";
  overriddenByRule: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  status: "earned" | "in_progress";
  progress: number;
}

export interface LeagueEntry {
  rank: number;
  learner: string;
  levelBand: LevelBand;
  weeklyLearningScore: number;
  masteryDelta: number;
  leagueStatus: "promote" | "stay" | "watch";
  isViewer?: boolean;
}

export interface LeagueSnapshot {
  name: string;
  weekLabel: string;
  bracket: string;
  viewerRank: number;
  totalMembers: number;
  entries: LeagueEntry[];
  improvementBoard: LeagueEntry[];
  structureCup: {
    structureFamily: string;
    entries: LeagueEntry[];
  };
  bossSessionReady: boolean;
}

export interface TodayMissionSnapshot {
  title: string;
  technicalLabel: string;
  modeLabel: string;
  targetLevel: LevelBand;
  promptCount: number;
  successDefinition: string;
  note: string;
  primaryAction: {
    label: string;
    href: string;
  };
  secondaryActions: Array<{
    label: string;
    href: string;
  }>;
}

export interface WhyNowSnapshot {
  whatKeepsSlipping: string;
  whatThisImproves: string;
  support: string;
}

export interface ProgressProofItem {
  id: string;
  label: string;
  value: string;
  note: string;
}

export interface ProgressProofSnapshot {
  items: ProgressProofItem[];
  fallbackTitle?: string;
  fallbackBody?: string;
}

export interface RecentWinSnapshot {
  structureTitle: string;
  beforeText: string;
  afterText: string;
  note: string;
}

export interface PracticeCoverageSnapshot {
  practiceSessions: number;
  reviewItems: number;
  topicsTouched: number;
  recentTopics: string[];
  builderCounts: Array<{
    builderKind: BuilderKind;
    label: string;
    count: number;
  }>;
}

export interface LearningMapSummaryItem {
  label: "Needs attention" | "Improving now" | "Strongest area";
  structureTitle: string;
  stageLabel: UserFacingStage;
  note: string;
  actionLabel: string;
  actionHref: string;
}

export interface NextUnlockSnapshot {
  structureTitle: string;
  currentStageLabel: UserFacingStage;
  nextStageLabel: UserFacingStage;
  requirement: string;
  note: string;
  actionLabel: string;
  actionHref: string;
}

export interface ReviewPressureSnapshot {
  dueCount: number;
  overdueCount: number;
  nextStructureTitle: string | null;
  note: string;
  actionLabel: string;
  actionHref: string;
}

export interface LeagueMiniSnapshot {
  viewerRank: number;
  totalMembers: number;
  weeklyLearningScore: number;
  movementLabel: string;
  href: string;
}

export interface TopicProgressSnapshot {
  topicKey: string;
  builderKind: BuilderKind;
  title: string;
  family: string;
  categoryPath: string[];
  levelBand: LevelBand;
  masteryScore: number;
  state: TopicState;
  stateLabel: string;
  practiceSessions: number;
  reviewSessions: number;
  attempts: number;
  firstTryAccuracy: number;
  repairSuccess: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  reviewDueCount: number;
  recommendedAction: LearningMode;
  lastActionLabel: string;
}

export interface BuilderQuickAccessItem {
  builderKind: BuilderKind;
  title: string;
  description: string;
  learnedTopics: number;
  activeTopics: number;
  dueReviews: number;
  weakestTopicTitle: string | null;
  href: string;
  recommendedHref: string;
  continueHref: string;
}

export interface UnderPracticedAreaSnapshot {
  builderKind: BuilderKind;
  title: string;
  note: string;
  href: string;
}

export interface ContinueLearningSnapshot {
  builderKind: BuilderKind;
  title: string;
  note: string;
  href: string;
}

export interface LearnedTopicSnapshot {
  topicKey: string;
  title: string;
  builderKind: BuilderKind;
  stateLabel: string;
  href: string;
}

export interface BuildersHubSnapshot {
  builderCards: BuilderQuickAccessItem[];
  continueLearning: ContinueLearningSnapshot[];
  underPracticedAreas: UnderPracticedAreaSnapshot[];
  recentlyLearnedTopics: LearnedTopicSnapshot[];
}

export interface BuilderCatalogSnapshot {
  builderKind: BuilderKind;
  title: string;
  description: string;
  spotlightTitle: string;
  spotlightBody: string;
  recommendedTopicKey: string | null;
  recommendedTopicHref: string | null;
  totalTopics: number;
  practicedTopics: number;
  dueReviews: number;
  categories: Array<{
    category: string;
    topics: TopicProgressSnapshot[];
  }>;
}

export interface TopicDetailSnapshot {
  topic: StructureUnit;
  progress: TopicProgressSnapshot;
  relatedTopics: TopicProgressSnapshot[];
  practiceHistory: TopicExerciseHistoryEntry[];
  nextActions: Array<{
    label: string;
    href: string;
  }>;
}

export interface TopicExerciseHistoryEntry {
  id: string;
  sessionId: string;
  createdAt: string;
  sessionTitle: string;
  learningScore: number | null;
  lane: PracticeLane;
  mode: SessionMode;
  prompt: string;
  userResponse: string;
  acceptedAnswer: string | null;
  naturalRewrite: string | null;
  feedbackSummary: string | null;
  whyItWorks: string | null;
  firstTrySuccess: boolean;
  repairSuccess: boolean;
  acceptedAnswerShown: boolean;
  responseScore: number;
}

export interface LearningMapTopicPreview {
  topicKey: string;
  title: string;
  builderKind: BuilderKind;
  stateLabel: string;
  masteryScore: number;
  reviewDueCount: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
  practiceSessions: number;
  reviewSessions: number;
  attempts: number;
  firstTryAccuracy: number;
  repairSuccess: number;
  recentExercises: TopicExerciseHistoryEntry[];
  href: string;
}

export interface LearningMapSnapshot {
  rootLabel: string;
  builders: Array<{
    builderKind: BuilderKind;
    title: string;
    description: string;
    practicedTopics: number;
    totalTopics: number;
  }>;
  nodes: Array<{
    id: string;
    label: string;
    kind: "root" | "builder" | "topic";
    builderKind?: BuilderKind;
    progress: number;
    stateLabel: string;
    reviewDue: boolean;
    href?: string;
  }>;
  edges: Array<{
    source: string;
    target: string;
    kind: "builder" | "prerequisite" | "related";
  }>;
  topicPreviews: LearningMapTopicPreview[];
}

export interface Viewer {
  id: string;
  name: string;
  email: string;
}

export interface DashboardSnapshot {
  viewer: Viewer;
  overallLevel: LevelBand;
  currentFocus: string;
  currentFocusReason: string;
  dueReviewCount: number;
  weeklyLearningScore: number;
  mostImprovedArea: string;
  momentumLabel: string;
  bestNextPractice: CandidateAction;
  weakestStructure: MasteryRecord;
  strongestStructure: MasteryRecord;
  masteryRecords: MasteryRecord[];
  reviewQueue: ReviewItem[];
  skillSnapshots: SkillSnapshot[];
  decisionLog: DecisionLog;
  league: LeagueSnapshot;
  todayMission: TodayMissionSnapshot;
  whyNow: WhyNowSnapshot;
  progressProof: ProgressProofSnapshot;
  recentWin: RecentWinSnapshot | null;
  practiceCoverage: PracticeCoverageSnapshot;
  learningMapSummary: LearningMapSummaryItem[];
  nextUnlock: NextUnlockSnapshot;
  reviewPressure: ReviewPressureSnapshot;
  leagueMini: LeagueMiniSnapshot;
  builderQuickAccess: BuilderQuickAccessItem[];
  underPracticedAreas: UnderPracticedAreaSnapshot[];
  continueLearning: ContinueLearningSnapshot[];
  recentlyLearnedTopics: LearnedTopicSnapshot[];
}

export interface ProfileSnapshot {
  viewer: Viewer;
  overallLevel: LevelBand;
  grammarControl: LevelBand;
  vocabularyUsage: LevelBand;
  sentenceBuilding: LevelBand;
  strengths: string[];
  growthAreas: string[];
  structureMap: MasteryRecord[];
  achievements: Achievement[];
  readinessSignals: string[];
  repeatedMistake: string;
  recommendation: RecommendationPayload;
}

export interface ProgressSnapshot {
  overallTrend: number[];
  accuracyTrend: number[];
  repairTrend: number[];
  reviewTrend: number[];
  repeatedErrorTrend: number[];
  structureMap: MasteryRecord[];
}

export interface OpsMetric {
  label: string;
  value: string;
  direction: "up" | "flat" | "down";
  note: string;
}

export interface OpsSnapshot {
  learningHealth: OpsMetric[];
  engineQuality: OpsMetric[];
  retentionAndMotivation: OpsMetric[];
  personalizationQuality: OpsMetric[];
}
