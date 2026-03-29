# English Practice Structure Gym

Adaptive, structure-first English practice MVP built with Next.js. The product is designed around one connected learning loop:

`onboarding -> placement -> best next practice -> self-repair feedback -> session summary -> review -> progress/profile -> recalibration -> league`

## Stack

- Next.js 16 App Router
- TypeScript + Tailwind CSS v4
- Auth.js v4
- Drizzle ORM
- Postgres
- OpenAI API
- Vercel-ready deployment shape

## What is implemented

- Marketing landing page with Google auth CTA
- Goal-first onboarding screen
- Quick placement flow with 10 prompts and scoring result
- Home dashboard with connected recommendation, review, mastery, league, and skill cards
- Interactive practice session UI with:
  - highlighted feedback
  - hint 1 / hint 2
  - accepted answer reveal after repeated misses
  - natural rewrite
  - level-up variants
- Review queue page
- Progress dashboard
- Profile dashboard with user-facing insights
- League page with weekly league, improvement board, structure cup, and boss-session concept
- Ops dashboard
- API routes for assessment, practice, review, personalization, profile insights, and league data
- Rule-first scoring, mastery, progression, and learning score engine
- Drizzle schema covering auth, learning events, mastery, recommendation logs, leagues, and achievements

## Runtime expectation

This app now expects real Auth.js, Postgres, and persistence-backed learning data. Workspace routes are no longer backed by shared in-memory learner state.

## Environment

Create `.env.local` from `.env.example`.

```bash
cp .env.example .env.local
```

Minimum useful setup:

- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Optional:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

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
```

## Database scripts

```bash
npm run db:generate
npm run db:push
npm run db:studio
```

## Local Postgres with Docker

Start Postgres:

```bash
docker compose up -d
```

Stop Postgres:

```bash
docker compose down
```

The included compose file starts PostgreSQL 16 with these defaults:

- host: `localhost`
- port: `5432`
- database: `english_practice_area`
- user: `postgres`
- password: `postgres`

This matches the example `DATABASE_URL`:

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/english_practice_area
```

## Notes

- Auth is wired for Google sign-in through Auth.js.
- The runtime database client is configured for standard Postgres, including local Docker Postgres.
- Practice evaluation uses OpenAI when `OPENAI_API_KEY` is present and falls back to deterministic scoring when it is not.
- Personalization currently uses bounded recommendation candidates and can be upgraded later to LLM ranking or ML ranking without breaking the data model.
