# Codebase Map

## Auth

- Entry: [`src/auth.ts`](../src/auth.ts)
- Route: [`src/app/api/auth/[...nextauth]/route.ts`](../src/app/api/auth/[...nextauth]/route.ts)
- Middleware: [`middleware.ts`](../middleware.ts)

Responsibility:
- provider setup
- adapter wiring
- session callbacks
- protected-route enforcement

Dangerous coupling:
- `AUTH_SECRET`, `NEXTAUTH_URL`, Google env vars, and DB availability all affect runtime auth behavior

## Database and Persistence

- Client: [`src/lib/db/client.ts`](../src/lib/db/client.ts)
- Schema: [`src/lib/db/schema.ts`](../src/lib/db/schema.ts)
- Drizzle config: [`drizzle.config.ts`](../drizzle.config.ts)

Responsibility:
- Postgres connectivity
- schema ownership
- migration target

Common edit scenarios:
- add table
- modify auth table shape
- trace learning event storage

## Catalog and Content

- Catalog: [`src/lib/catalog.ts`](../src/lib/catalog.ts)
- Practice bank: [`src/lib/data/practice-bank.ts`](../src/lib/data/practice-bank.ts)
- Vocabulary targets: [`src/lib/data/vocabulary-targets.ts`](../src/lib/data/vocabulary-targets.ts)

Responsibility:
- topic metadata
- builder metadata
- authored blueprints
- safe fallback definitions

Dangerous coupling:
- topic keys must stay consistent across catalog, practice content, review, and map/profile snapshots

## Learning Composition

- [`src/lib/server/learning.ts`](../src/lib/server/learning.ts)
- [`src/lib/server/topic-views.ts`](../src/lib/server/topic-views.ts)

Responsibility:
- create and load sessions
- compute snapshots for home/profile/review/builders/map
- assemble practice drawer payloads

Common edit scenarios:
- recommendation changes
- review scheduling changes
- topic detail/history changes
- profile snapshot composition

## Evaluator and Scoring

- [`src/lib/engine/evaluator.ts`](../src/lib/engine/evaluator.ts)
- [`src/lib/engine/scoring.ts`](../src/lib/engine/scoring.ts)
- related: [`src/lib/ai/service.ts`](../src/lib/ai/service.ts), [`src/lib/ai/schemas.ts`](../src/lib/ai/schemas.ts)

Responsibility:
- response evaluation
- feedback shaping
- confidence handling
- score and speed-bonus rules

Dangerous coupling:
- UI rendering depends on evaluator contracts
- review and mastery updates assume evaluator output semantics are stable

## Practice UI

- [`src/components/practice-session-client.tsx`](../src/components/practice-session-client.tsx)
- [`src/components/practice-drawer-nav.tsx`](../src/components/practice-drawer-nav.tsx)
- [`src/components/ui/text-input.tsx`](../src/components/ui/text-input.tsx)

Responsibility:
- task rendering
- hybrid flow
- exact rewrite handling
- hints and drawer controls
- timer and speed preview

Common edit scenarios:
- focus mode
- hybrid task UX
- reference sentence placement
- feedback compression

## Profile / Progress / Map

- `src/app/(workspace)/profile/page.tsx`
- [`src/components/profile-progress-insights.tsx`](../src/components/profile-progress-insights.tsx)
- [`src/components/learning-map-graph.tsx`](../src/components/learning-map-graph.tsx)

Responsibility:
- overview
- learning map
- progress insights

Note:
- `/progress` and `/map` remain compatibility routes, but profile is the canonical destination.
