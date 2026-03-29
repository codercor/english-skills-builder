import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.provider, table.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
  }),
);

export const authenticators = pgTable(
  "authenticators",
  {
    credentialID: text("credential_id").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("provider_account_id").notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credential_device_type").notNull(),
    credentialBackedUp: boolean("credential_backed_up").notNull(),
    transports: text("transports"),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.userId, table.credentialID],
    }),
  }),
);

export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goal: varchar("goal", { length: 80 }).notNull(),
  weeklyTimeBudget: varchar("weekly_time_budget", { length: 30 }).notNull(),
  selfRating: varchar("self_rating", { length: 30 }).notNull(),
  supportLevel: varchar("support_level", { length: 30 }),
  frustrationPattern: varchar("frustration_pattern", { length: 40 }),
  preferredThemes: jsonb("preferred_themes"),
  wantsIelts: boolean("wants_ielts").default(false).notNull(),
  overallLevel: varchar("overall_level", { length: 4 }).default("A2").notNull(),
  grammarControl: varchar("grammar_control", { length: 4 }).default("A2").notNull(),
  vocabularyUsage: varchar("vocabulary_usage", { length: 4 }).default("A2").notNull(),
  sentenceBuilding: varchar("sentence_building", { length: 4 }).default("A2").notNull(),
  onboardingCompletedAt: timestamp("onboarding_completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const onboardingProfiles = pgTable("onboarding_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  goal: varchar("goal", { length: 80 }),
  timeCommitment: varchar("time_commitment", { length: 30 }),
  confidence: varchar("confidence", { length: 30 }),
  frustration: varchar("frustration", { length: 40 }),
  ieltsIntent: boolean("ielts_intent").default(false).notNull(),
  themes: jsonb("themes").$type<string[]>().default(sql`'[]'::jsonb`).notNull(),
  completionState: varchar("completion_state", { length: 24 })
    .default("draft")
    .notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const goals = pgTable("goals", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 80 }).notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const skillProfiles = pgTable("skill_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  area: varchar("area", { length: 30 }).notNull(),
  label: varchar("label", { length: 80 }).notNull(),
  levelBand: varchar("level_band", { length: 4 }).notNull(),
  score: real("score").notNull(),
  trend: jsonb("trend").notNull(),
});

export const structureCatalog = pgTable("structure_catalog", {
  key: varchar("key", { length: 80 }).primaryKey(),
  title: varchar("title", { length: 80 }).notNull(),
  family: varchar("family", { length: 80 }).notNull(),
  description: text("description").notNull(),
  skillArea: varchar("skill_area", { length: 30 }).notNull(),
  baseLevel: varchar("base_level", { length: 4 }).notNull(),
  supportObjective: text("support_objective").notNull(),
});

export const assessmentAttempts = pgTable("assessment_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 24 }).notNull(),
  overallLevel: varchar("overall_level", { length: 4 }).notNull(),
  grammarControl: varchar("grammar_control", { length: 4 }).notNull(),
  vocabularyUsage: varchar("vocabulary_usage", { length: 4 }).notNull(),
  sentenceBuilding: varchar("sentence_building", { length: 4 }).notNull(),
  topGrowthAreas: jsonb("top_growth_areas").notNull(),
  initialLane: varchar("initial_lane", { length: 40 }).notNull(),
  confidence: real("confidence").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: varchar("mode", { length: 20 }).notNull(),
  title: varchar("title", { length: 120 }).notNull(),
  primaryStructure: varchar("primary_structure", { length: 80 }).notNull(),
  supportObjective: text("support_objective").notNull(),
  targetLevel: varchar("target_level", { length: 4 }).notNull(),
  lane: varchar("lane", { length: 40 }).notNull(),
  learningScore: real("learning_score"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const practiceItems = pgTable("practice_items", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => practiceSessions.id, { onDelete: "cascade" }),
  structureKey: varchar("structure_key", { length: 80 }).notNull(),
  promptType: varchar("prompt_type", { length: 40 }).notNull(),
  prompt: text("prompt").notNull(),
  acceptedAnswer: text("accepted_answer").notNull(),
  metadata: jsonb("metadata").notNull(),
});

export const userResponses = pgTable("user_responses", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .notNull()
    .references(() => practiceSessions.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  rawUserResponse: text("raw_user_response").notNull(),
  normalizedResponse: text("normalized_response").notNull(),
  attemptNumber: integer("attempt_number").notNull(),
  hintCount: integer("hint_count").notNull(),
  retryCount: integer("retry_count").notNull(),
  responseLatencyMs: integer("response_latency_ms").notNull(),
  firstTrySuccess: boolean("first_try_success").notNull(),
  repairSuccess: boolean("repair_success").notNull(),
  acceptedAnswerShown: boolean("accepted_answer_shown").notNull(),
  qualityScore: real("quality_score").notNull(),
  responseScore: real("response_score").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const feedbackEvents = pgTable("feedback_events", {
  id: text("id").primaryKey(),
  responseId: text("response_id")
    .notNull()
    .references(() => userResponses.id, { onDelete: "cascade" }),
  highlightedSpans: jsonb("highlighted_spans").notNull(),
  hint1: text("hint_1").notNull(),
  hint2: text("hint_2").notNull(),
  naturalRewrite: text("natural_rewrite").notNull(),
  levelUpVariants: jsonb("level_up_variants").notNull(),
  whyItWorks: text("why_it_works").notNull(),
});

export const errorEvents = pgTable("error_events", {
  id: text("id").primaryKey(),
  responseId: text("response_id")
    .notNull()
    .references(() => userResponses.id, { onDelete: "cascade" }),
  structureKey: varchar("structure_key", { length: 80 }).notNull(),
  errorTags: jsonb("error_tags").notNull(),
  severity: varchar("severity", { length: 12 }).notNull(),
  repeatedError: boolean("repeated_error").notNull(),
});

export const reviewItems = pgTable("review_items", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  structureKey: varchar("structure_key", { length: 80 }).notNull(),
  source: varchar("source", { length: 40 }).notNull(),
  prompt: text("prompt").notNull(),
  dueAt: timestamp("due_at", { mode: "date" }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
});

export const masteryRecords = pgTable("mastery_records", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  structureKey: varchar("structure_key", { length: 80 }).notNull(),
  currentLevelBand: varchar("current_level_band", { length: 4 }).notNull(),
  masteryScore: real("mastery_score").notNull(),
  masteryStage: varchar("mastery_stage", { length: 20 }).notNull(),
  masteryConfidence: real("mastery_confidence").notNull(),
  firstTrySuccessRate14d: real("first_try_success_rate_14d").notNull(),
  repairSuccessRate14d: real("repair_success_rate_14d").notNull(),
  reviewSuccessRate30d: real("review_success_rate_30d").notNull(),
  repeatedErrorRate14d: real("repeated_error_rate_14d").notNull(),
  hintDependenceRate14d: real("hint_dependence_rate_14d").notNull(),
  promptTypeCoverage: real("prompt_type_coverage").notNull(),
  stabilityScore: real("stability_score").notNull(),
  progressionState: varchar("progression_state", { length: 40 }).notNull(),
  promotionEligible: boolean("promotion_eligible").notNull(),
  demotionRisk: boolean("demotion_risk").notNull(),
  nextReviewDueAt: timestamp("next_review_due_at", { mode: "date" }).notNull(),
});

export const progressionDecisions = pgTable("progression_decisions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  structureKey: varchar("structure_key", { length: 80 }).notNull(),
  decisionType: varchar("decision_type", { length: 40 }).notNull(),
  previousState: varchar("previous_state", { length: 40 }).notNull(),
  newState: varchar("new_state", { length: 40 }).notNull(),
  currentLevelBand: varchar("current_level_band", { length: 4 }).notNull(),
  targetLevelBand: varchar("target_level_band", { length: 4 }).notNull(),
  decisionConfidence: real("decision_confidence").notNull(),
  reasonCodes: jsonb("reason_codes").notNull(),
  inputSnapshot: jsonb("input_snapshot").notNull(),
  llmUsed: boolean("llm_used").notNull(),
  llmModel: varchar("llm_model", { length: 80 }).notNull(),
  llmRationale: text("llm_rationale").notNull(),
  expectedEffect: text("expected_effect").notNull(),
  observedEffect: varchar("observed_effect", { length: 24 }).notNull(),
  decisionQuality: varchar("decision_quality", { length: 16 }).notNull(),
  overriddenByRule: boolean("overridden_by_rule").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const recommendationEvents = pgTable("recommendation_events", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  selectedAction: jsonb("selected_action").notNull(),
  candidateActions: jsonb("candidate_actions").notNull(),
  rationale: text("rationale").notNull(),
  accepted: boolean("accepted").notNull(),
  upliftScore: real("uplift_score"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const leagueWeeks = pgTable("league_weeks", {
  id: text("id").primaryKey(),
  label: varchar("label", { length: 40 }).notNull(),
  bracket: varchar("bracket", { length: 40 }).notNull(),
  startsAt: timestamp("starts_at", { mode: "date" }).notNull(),
  endsAt: timestamp("ends_at", { mode: "date" }).notNull(),
});

export const leagueMemberships = pgTable("league_memberships", {
  id: text("id").primaryKey(),
  leagueWeekId: text("league_week_id")
    .notNull()
    .references(() => leagueWeeks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  levelBand: varchar("level_band", { length: 4 }).notNull(),
});

export const leagueScores = pgTable("league_scores", {
  id: text("id").primaryKey(),
  leagueWeekId: text("league_week_id")
    .notNull()
    .references(() => leagueWeeks.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weeklyLearningScore: real("weekly_learning_score").notNull(),
  masteryDelta: real("mastery_delta").notNull(),
  normalizedScore: real("normalized_score").notNull(),
});

export const structureCups = pgTable("structure_cups", {
  id: text("id").primaryKey(),
  leagueWeekId: text("league_week_id")
    .notNull()
    .references(() => leagueWeeks.id, { onDelete: "cascade" }),
  structureFamily: varchar("structure_family", { length: 80 }).notNull(),
  metadata: jsonb("metadata").notNull(),
});

export const bossSessions = pgTable("boss_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  structureFamily: varchar("structure_family", { length: 80 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  bonusScore: real("bonus_score"),
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 80 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  progress: real("progress").notNull(),
});
