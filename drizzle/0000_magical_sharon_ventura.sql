CREATE TABLE "accounts" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"title" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"progress" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mode" varchar(24) NOT NULL,
	"overall_level" varchar(4) NOT NULL,
	"grammar_control" varchar(4) NOT NULL,
	"vocabulary_usage" varchar(4) NOT NULL,
	"sentence_building" varchar(4) NOT NULL,
	"top_growth_areas" jsonb NOT NULL,
	"initial_lane" varchar(40) NOT NULL,
	"confidence" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authenticators" (
	"credential_id" text NOT NULL,
	"user_id" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"credential_public_key" text NOT NULL,
	"counter" integer NOT NULL,
	"credential_device_type" text NOT NULL,
	"credential_backed_up" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticators_user_id_credential_id_pk" PRIMARY KEY("user_id","credential_id"),
	CONSTRAINT "authenticators_credential_id_unique" UNIQUE("credential_id")
);
--> statement-breakpoint
CREATE TABLE "boss_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"structure_family" varchar(80) NOT NULL,
	"status" varchar(20) NOT NULL,
	"bonus_score" real
);
--> statement-breakpoint
CREATE TABLE "error_events" (
	"id" text PRIMARY KEY NOT NULL,
	"response_id" text NOT NULL,
	"structure_key" varchar(80) NOT NULL,
	"error_tags" jsonb NOT NULL,
	"severity" varchar(12) NOT NULL,
	"repeated_error" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_events" (
	"id" text PRIMARY KEY NOT NULL,
	"response_id" text NOT NULL,
	"highlighted_spans" jsonb NOT NULL,
	"hint_1" text NOT NULL,
	"hint_2" text NOT NULL,
	"natural_rewrite" text NOT NULL,
	"level_up_variants" jsonb NOT NULL,
	"why_it_works" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"label" varchar(80) NOT NULL,
	"status" varchar(24) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_memberships" (
	"id" text PRIMARY KEY NOT NULL,
	"league_week_id" text NOT NULL,
	"user_id" text NOT NULL,
	"level_band" varchar(4) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"league_week_id" text NOT NULL,
	"user_id" text NOT NULL,
	"weekly_learning_score" real NOT NULL,
	"mastery_delta" real NOT NULL,
	"normalized_score" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "league_weeks" (
	"id" text PRIMARY KEY NOT NULL,
	"label" varchar(40) NOT NULL,
	"bracket" varchar(40) NOT NULL,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mastery_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"structure_key" varchar(80) NOT NULL,
	"current_level_band" varchar(4) NOT NULL,
	"mastery_score" real NOT NULL,
	"mastery_stage" varchar(20) NOT NULL,
	"mastery_confidence" real NOT NULL,
	"first_try_success_rate_14d" real NOT NULL,
	"repair_success_rate_14d" real NOT NULL,
	"review_success_rate_30d" real NOT NULL,
	"repeated_error_rate_14d" real NOT NULL,
	"hint_dependence_rate_14d" real NOT NULL,
	"prompt_type_coverage" real NOT NULL,
	"stability_score" real NOT NULL,
	"progression_state" varchar(40) NOT NULL,
	"promotion_eligible" boolean NOT NULL,
	"demotion_risk" boolean NOT NULL,
	"next_review_due_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "onboarding_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"goal" varchar(80),
	"time_commitment" varchar(30),
	"confidence" varchar(30),
	"frustration" varchar(40),
	"ielts_intent" boolean DEFAULT false NOT NULL,
	"themes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"completion_state" varchar(24) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"structure_key" varchar(80) NOT NULL,
	"prompt_type" varchar(40) NOT NULL,
	"prompt" text NOT NULL,
	"accepted_answer" text NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"mode" varchar(20) NOT NULL,
	"title" varchar(120) NOT NULL,
	"primary_structure" varchar(80) NOT NULL,
	"support_objective" text NOT NULL,
	"target_level" varchar(4) NOT NULL,
	"lane" varchar(40) NOT NULL,
	"learning_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"goal" varchar(80) NOT NULL,
	"weekly_time_budget" varchar(30) NOT NULL,
	"self_rating" varchar(30) NOT NULL,
	"support_level" varchar(30),
	"frustration_pattern" varchar(40),
	"preferred_themes" jsonb,
	"wants_ielts" boolean DEFAULT false NOT NULL,
	"overall_level" varchar(4) DEFAULT 'A2' NOT NULL,
	"grammar_control" varchar(4) DEFAULT 'A2' NOT NULL,
	"vocabulary_usage" varchar(4) DEFAULT 'A2' NOT NULL,
	"sentence_building" varchar(4) DEFAULT 'A2' NOT NULL,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progression_decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"structure_key" varchar(80) NOT NULL,
	"decision_type" varchar(40) NOT NULL,
	"previous_state" varchar(40) NOT NULL,
	"new_state" varchar(40) NOT NULL,
	"current_level_band" varchar(4) NOT NULL,
	"target_level_band" varchar(4) NOT NULL,
	"decision_confidence" real NOT NULL,
	"reason_codes" jsonb NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"llm_used" boolean NOT NULL,
	"llm_model" varchar(80) NOT NULL,
	"llm_rationale" text NOT NULL,
	"expected_effect" text NOT NULL,
	"observed_effect" varchar(24) NOT NULL,
	"decision_quality" varchar(16) NOT NULL,
	"overridden_by_rule" boolean NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommendation_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"selected_action" jsonb NOT NULL,
	"candidate_actions" jsonb NOT NULL,
	"rationale" text NOT NULL,
	"accepted" boolean NOT NULL,
	"uplift_score" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"structure_key" varchar(80) NOT NULL,
	"source" varchar(40) NOT NULL,
	"prompt" text NOT NULL,
	"due_at" timestamp NOT NULL,
	"status" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"area" varchar(30) NOT NULL,
	"label" varchar(80) NOT NULL,
	"level_band" varchar(4) NOT NULL,
	"score" real NOT NULL,
	"trend" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "structure_catalog" (
	"key" varchar(80) PRIMARY KEY NOT NULL,
	"title" varchar(80) NOT NULL,
	"family" varchar(80) NOT NULL,
	"description" text NOT NULL,
	"skill_area" varchar(30) NOT NULL,
	"base_level" varchar(4) NOT NULL,
	"support_objective" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "structure_cups" (
	"id" text PRIMARY KEY NOT NULL,
	"league_week_id" text NOT NULL,
	"structure_family" varchar(80) NOT NULL,
	"metadata" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text NOT NULL,
	"item_id" text NOT NULL,
	"raw_user_response" text NOT NULL,
	"normalized_response" text NOT NULL,
	"attempt_number" integer NOT NULL,
	"hint_count" integer NOT NULL,
	"retry_count" integer NOT NULL,
	"response_latency_ms" integer NOT NULL,
	"first_try_success" boolean NOT NULL,
	"repair_success" boolean NOT NULL,
	"accepted_answer_shown" boolean NOT NULL,
	"quality_score" real NOT NULL,
	"response_score" real NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"email_verified" timestamp,
	"image" text,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "achievements" ADD CONSTRAINT "achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticators" ADD CONSTRAINT "authenticators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boss_sessions" ADD CONSTRAINT "boss_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_events" ADD CONSTRAINT "error_events_response_id_user_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."user_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_events" ADD CONSTRAINT "feedback_events_response_id_user_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."user_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_league_week_id_league_weeks_id_fk" FOREIGN KEY ("league_week_id") REFERENCES "public"."league_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_memberships" ADD CONSTRAINT "league_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_scores" ADD CONSTRAINT "league_scores_league_week_id_league_weeks_id_fk" FOREIGN KEY ("league_week_id") REFERENCES "public"."league_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_scores" ADD CONSTRAINT "league_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mastery_records" ADD CONSTRAINT "mastery_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "onboarding_profiles" ADD CONSTRAINT "onboarding_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_items" ADD CONSTRAINT "practice_items_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progression_decisions" ADD CONSTRAINT "progression_decisions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendation_events" ADD CONSTRAINT "recommendation_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_items" ADD CONSTRAINT "review_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_profiles" ADD CONSTRAINT "skill_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "structure_cups" ADD CONSTRAINT "structure_cups_league_week_id_league_weeks_id_fk" FOREIGN KEY ("league_week_id") REFERENCES "public"."league_weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_responses" ADD CONSTRAINT "user_responses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_responses" ADD CONSTRAINT "user_responses_session_id_practice_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."practice_sessions"("id") ON DELETE cascade ON UPDATE no action;