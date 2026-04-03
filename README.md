# English Practice Area

English Practice Area is a topic-centric English learning product built with Next.js. The app is designed around one connected loop:

`onboarding -> assessment -> recommendation -> practice -> feedback -> review -> profile/map/progress`

This repository is intentionally structured so product surfaces, learning logic, and persistence all flow through the same core engine instead of splitting into disconnected feature silos.

## Fast Orientation

Read these files in order:

1. [AGENTS.md](./AGENTS.md)
2. [llms-full.txt](./llms-full.txt)
3. [docs/architecture.md](./docs/architecture.md)
4. [docs/codebase-map.md](./docs/codebase-map.md)
5. [design.md](./design.md) for visual rules

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Auth.js v4
- Drizzle ORM
- Postgres
- OpenAI API with deterministic fallback evaluation
- Vercel deployment target

## Product Surfaces

- `/` marketing landing page and Google auth entry
- `/onboarding` goal and learner profile setup
- `/assessment` placement and recalibration flow
- `/home` recommendation-first dashboard
- `/builders` builders hub
- `/builders/[builder]` builder catalog
- `/builders/[builder]/[topicKey]` topic detail and history
- `/practice/[sessionId]` focus-mode practice runtime
- `/review` due review queue
- `/profile` overview, learning map, and progress insights
- `/league` league and competition layer
- `/ops` internal operations dashboard

Compatibility redirects still exist for `/progress` and `/map`, but both route into profile tabs.

## Core Runtime Shape

- `src/lib/catalog.ts` is the topic and builder catalog source of truth.
- `src/lib/data/practice-bank.ts` holds authored practice blueprints and safe fallbacks.
- `src/lib/server/learning.ts` composes sessions, recommendations, review scheduling, and workspace snapshots.
- `src/lib/server/topic-views.ts` builds builder hub, topic detail, and learning map snapshots.
- `src/lib/engine/evaluator.ts` evaluates practice responses and shapes user-facing feedback.
- `src/lib/engine/scoring.ts` handles response, session, weekly, and speed-bonus scoring.
- `src/lib/db/schema.ts` is the persistence source of truth.

## Environment

Create a local env file from the example:

```bash
cp .env.example .env.local
```

Required for a useful production-like run:

- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Optional:

- `DATABASE_URL_UNPOOLED`
- `PGHOST`
- `PGHOST_UNPOOLED`
- `AUTH_RESEND_KEY`
- `AUTH_EMAIL_FROM`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

See [docs/auth-and-deploy.md](./docs/auth-and-deploy.md) for local vs production rules, Neon notes, and Google OAuth setup.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm run build
npm run docs:check
```

## Database

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

`drizzle.config.ts` reads `DATABASE_URL`, so local and production migrations use the same variable name with different values.

## Documentation Map

- [AGENTS.md](./AGENTS.md): canonical agent operating guide
- [llms.txt](./llms.txt): short machine-readable overview
- [llms-full.txt](./llms-full.txt): long machine-readable digest
- [docs/architecture.md](./docs/architecture.md): product and runtime architecture
- [docs/domain-glossary.md](./docs/domain-glossary.md): canonical domain language
- [docs/codebase-map.md](./docs/codebase-map.md): ownership map
- [docs/practice-contracts.md](./docs/practice-contracts.md): practice/evaluator contracts
- [docs/data-model.md](./docs/data-model.md): persistence model
- [docs/auth-and-deploy.md](./docs/auth-and-deploy.md): env, auth, deploy, and Neon
- [docs/troubleshooting.md](./docs/troubleshooting.md): known failure modes
- [docs/examples/README.md](./docs/examples/README.md): representative fixtures
- [docs/adr](./docs/adr): key architecture decisions
- [design.md](./design.md): visual system source of truth
