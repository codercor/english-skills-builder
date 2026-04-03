# Architecture

## Product Loop

English Practice Area is built as one connected learning system:

1. onboarding establishes learner intent
2. assessment establishes baseline level and weak areas
3. recommendation selects the best next practice
4. practice collects response evidence
5. evaluator turns evidence into feedback and scores
6. review schedules future recall
7. profile, progress, and learning map render learner-facing summaries

The app is topic-centric. A topic is the unit that ties together:
- builder discovery
- practice generation
- review scheduling
- mastery updates
- map/profile/home visibility

## App Surfaces

### Entry and setup
- `/`
- `/onboarding`
- `/assessment`

### Workspace
- `/home`
- `/builders`
- `/builders/[builder]`
- `/builders/[builder]/[topicKey]`
- `/practice/[sessionId]`
- `/review`
- `/profile`
- `/league`
- `/ops`

### Compatibility redirects
- `/progress` -> `/profile?tab=progress`
- `/map` -> `/profile?tab=map`

## Runtime Layers

### Catalog layer
`src/lib/catalog.ts`

Defines:
- builder metadata
- topic metadata
- relationships between topics
- teaching summaries and examples

This is the semantic catalog source of truth. Builder and topic views derive labels and routes from here.

### Practice content layer
`src/lib/data/practice-bank.ts`
`src/lib/data/vocabulary-targets.ts`

Defines:
- authored practice blueprints
- safe fallback blueprints
- vocabulary target items
- interaction and follow-up metadata

This layer decides what can be asked safely.

### Server composition layer
`src/lib/server/learning.ts`
`src/lib/server/topic-views.ts`

Responsibilities:
- create practice sessions
- map DB rows to runtime session payloads
- produce home/profile/review snapshots
- produce builder, topic, and map snapshots
- compute practice drawer navigation payloads

### Engine layer
`src/lib/engine/evaluator.ts`
`src/lib/engine/scoring.ts`
`src/lib/engine/mastery.ts`
`src/lib/engine/progression.ts`
`src/lib/engine/recommendations.ts`

Responsibilities:
- evaluate learner responses
- compute response and session scores
- shape feedback
- update mastery and progression
- select future recommendations

### Persistence layer
`src/lib/db/schema.ts`
`src/lib/db/client.ts`

Responsibilities:
- define learning and auth tables
- define Drizzle runtime client

## Practice Engine Flow

1. user enters a session by recommendation or manual topic selection
2. server picks a topic, level, learning mode, and blueprint set
3. session rows and practice item rows are persisted
4. practice UI renders interaction type:
   - choice
   - completion
   - text
   - hybrid choice + text
5. evaluator returns feedback with confidence and score visibility metadata
6. accepted responses update review timing, mastery records, and summaries
7. downstream surfaces read the updated topic-centric state

## Derived vs Persisted Data

### Persisted
- auth users/sessions/accounts
- practice sessions and items
- user responses
- feedback and error events
- review queue
- mastery records
- progression decisions

### Derived snapshots
- home dashboard payloads
- builders hub
- builder catalog
- topic detail
- learning map
- profile and progress insights
- practice drawer shortcuts

Snapshots should be treated as read models, not new persistence sources.
