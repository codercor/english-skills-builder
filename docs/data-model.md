# Data Model

## Principles

- Auth and learning persistence share one Postgres database.
- Practice data is event-heavy.
- Home/profile/map/builders mostly consume derived read models.
- Topic-level state remains the top-level user-facing learning unit.
- Vocabulary adds item-level evidence under the topic layer.

## Auth Tables

- `users`
- `accounts`
- `sessions`
- `verification_tokens`
- `authenticators`

These support Auth.js.

## Learner Identity and Setup

- `profiles`
- `onboarding_profiles`
- `goals`
- `skill_profiles`

These hold learner profile, onboarding intent, and user-facing skill summaries.

## Catalog / Assessment

- `structure_catalog`
- `assessment_attempts`

Catalog is persisted for runtime compatibility, but the code-level catalog in `src/lib/catalog.ts` is still the semantic source used by the app.

## Practice Chain

The core evidence chain is:

1. `practice_sessions`
2. `practice_items`
3. `user_responses`
4. `feedback_events`
5. `error_events`

This chain captures:
- what was asked
- what the learner wrote
- how it was evaluated
- what error pattern was logged

## Review and Mastery

- `review_items`
- `mastery_records`
- `progression_decisions`
- `recommendation_events`

These tables turn practice evidence into future scheduling and learner state.

## League / Competition

- `league_weeks`
- `league_memberships`
- `league_scores`
- `structure_cups`
- `boss_sessions`
- `achievements`

These are secondary to the learning loop but share the same persistence layer.

## Vocabulary Item-Level Evidence

Vocabulary topics remain topic-centric at the surface level, but item-level progress is derived from:
- target item metadata
- relevant practice responses
- review outcomes

The app exposes item states such as:
- `new`
- `practising`
- `usable`
- `stable`
- `strong`

This item-level state should not replace topic-level mastery; it informs it.
