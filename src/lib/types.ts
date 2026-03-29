export type LevelBand = "A2" | "B1" | "B2" | "C1";
export type SkillArea = "grammar" | "vocabulary" | "sentence_building";
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
export type UserFacingStage =
  | "Needs work"
  | "Improving"
  | "Nearly stable"
  | "Strong"
  | "Needs review"
  | "Close to moving up";

export interface StructureUnit {
  key: string;
  title: string;
  family: string;
  description: string;
  skillArea: SkillArea;
  baseLevel: LevelBand;
  supportObjective: string;
}

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
