<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This project uses Next.js 16 App Router and React 19. Read the relevant guide in `node_modules/next/dist/docs/` when touching routing, rendering, or framework behavior. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Guide

This file is the canonical operating guide for repository-aware agents.

## First Read Order

1. [`README.md`](./README.md)
2. [`llms-full.txt`](./llms-full.txt)
3. [`docs/architecture.md`](./docs/architecture.md)
4. [`docs/codebase-map.md`](./docs/codebase-map.md)
5. [`docs/practice-contracts.md`](./docs/practice-contracts.md)
6. [`docs/auth-and-deploy.md`](./docs/auth-and-deploy.md)
7. [`design.md`](./design.md) if the task is visual

## Canonical Sources of Truth

- Product and runtime architecture: [`docs/architecture.md`](./docs/architecture.md)
- Domain language: [`docs/domain-glossary.md`](./docs/domain-glossary.md)
- Practice/evaluator contracts: [`docs/practice-contracts.md`](./docs/practice-contracts.md)
- Persistence model: [`src/lib/db/schema.ts`](./src/lib/db/schema.ts)
- Topic and builder catalog: [`src/lib/catalog.ts`](./src/lib/catalog.ts)
- Auth wiring: [`src/auth.ts`](./src/auth.ts)
- Visual system: [`design.md`](./design.md)

## High-Signal Invariants

- Builders are not separate engines. Grammar, vocabulary, phrase/idiom, and sentence surfaces all route into the same practice engine.
- Manual topic selection updates the same mastery, review, progress, and learning-map system as recommendation-driven practice.
- Ungrounded topics must not generate speculative open-ended prompts. Safe fallback means controlled tasks only.
- `exact_rewrite` and `open_production` are different evaluation contracts. Do not reuse one acceptance policy for the other.
- Low-confidence feedback must not look equally authoritative to grounded feedback. If confidence is low, numeric score visibility is reduced.
- Home, builders, review, map, and profile all consume the same topic-centric learning model.
- Compatibility routes like `/progress` and `/map` may exist, but profile is the real surface for progress and learning map.

## Ownership Map

- Auth and session setup: [`src/auth.ts`](./src/auth.ts), [`src/app/api/auth/[...nextauth]/route.ts`](./src/app/api/auth/[...nextauth]/route.ts)
- Database client and schema: [`src/lib/db/client.ts`](./src/lib/db/client.ts), [`src/lib/db/schema.ts`](./src/lib/db/schema.ts)
- Catalog and builder metadata: [`src/lib/catalog.ts`](./src/lib/catalog.ts)
- Practice content: [`src/lib/data/practice-bank.ts`](./src/lib/data/practice-bank.ts), [`src/lib/data/vocabulary-targets.ts`](./src/lib/data/vocabulary-targets.ts)
- Server learning composition: [`src/lib/server/learning.ts`](./src/lib/server/learning.ts)
- Topic snapshots and learning map data: [`src/lib/server/topic-views.ts`](./src/lib/server/topic-views.ts)
- Evaluator and scoring: [`src/lib/engine/evaluator.ts`](./src/lib/engine/evaluator.ts), [`src/lib/engine/scoring.ts`](./src/lib/engine/scoring.ts)
- Practice UI runtime: [`src/components/practice-session-client.tsx`](./src/components/practice-session-client.tsx), [`src/components/practice-drawer-nav.tsx`](./src/components/practice-drawer-nav.tsx)

## Common Task Recipes

### Change practice UI

Read:
- [`src/components/practice-session-client.tsx`](./src/components/practice-session-client.tsx)
- [`docs/practice-contracts.md`](./docs/practice-contracts.md)
- [`design.md`](./design.md)

Watch for:
- hybrid task flow
- exact rewrite center-stage behavior
- score visibility and low-confidence rendering
- drawer/focus-mode hierarchy

### Change evaluator or feedback

Read:
- [`src/lib/engine/evaluator.ts`](./src/lib/engine/evaluator.ts)
- [`src/lib/engine/scoring.ts`](./src/lib/engine/scoring.ts)
- [`docs/practice-contracts.md`](./docs/practice-contracts.md)
- [`docs/examples`](./docs/examples)

Watch for:
- grounded vs low-confidence feedback
- typo detection false positives
- task-step-specific messaging
- mastery/update side effects

### Add a new topic or builder content

Read:
- [`src/lib/catalog.ts`](./src/lib/catalog.ts)
- [`src/lib/data/practice-bank.ts`](./src/lib/data/practice-bank.ts)
- [`src/lib/server/topic-views.ts`](./src/lib/server/topic-views.ts)
- [`docs/domain-glossary.md`](./docs/domain-glossary.md)

Watch for:
- builder kind mapping
- topic detail and map visibility
- review queue compatibility
- grounded blueprint coverage

### Change auth or deploy

Read:
- [`src/auth.ts`](./src/auth.ts)
- [`middleware.ts`](./middleware.ts)
- [`docs/auth-and-deploy.md`](./docs/auth-and-deploy.md)
- [`docs/troubleshooting.md`](./docs/troubleshooting.md)

Watch for:
- `AUTH_SECRET`
- `NEXTAUTH_URL`
- Google callback URLs
- Neon runtime DB URL

## Known Footguns

- Older persisted sessions may continue showing pre-fix evaluator behavior because items are stored at session creation time.
- Production auth failures can come from Google credentials even when Vercel envs exist; `invalid_client` and `invalid secret` are distinct failure modes.
- `DATABASE_URL` must point to a remote Postgres in production. A localhost URL may still let builds pass while runtime fails.
- Generated docs indexes are versioned. If routes, env vars, or table names change, run `npm run docs:generate-indexes`.
- Do not add open-ended memory-anchor practice for topics that do not have grounded evaluation logic.

## Update Policy

When you change the repo, update docs in the same change if any of these are true:

- route or page ownership changes -> update architecture/codebase map/generated route index
- env var changes -> update auth-and-deploy/env index/.env.example
- evaluator contract changes -> update practice-contracts/examples
- new pedagogy or invariant -> add or revise an ADR
- new major subsystem -> update codebase map and llms digests

## Verification

Run at least:

```bash
npm run lint
npm run build
npm run docs:check
```
