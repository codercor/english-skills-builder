# Auth and Deploy

## Required Production Environment Variables

- `AUTH_SECRET`
- `NEXTAUTH_URL`
- `DATABASE_URL`
- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

Common optional variables:
- `DATABASE_URL_UNPOOLED`
- `PGHOST`
- `PGHOST_UNPOOLED`
- `AUTH_RESEND_KEY`
- `AUTH_EMAIL_FROM`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

## Local vs Production

### Local
- `NEXTAUTH_URL=http://localhost:3000`
- local DB may be Docker or local Postgres
- Google OAuth client must include localhost callback URLs if local Google sign-in is needed

### Production
- `NEXTAUTH_URL=https://your-production-domain`
- `DATABASE_URL` must point to a remote Postgres
- Google OAuth client must allow the production origin and callback URL

## Neon Notes

Recommended:
- pooled URL for runtime `DATABASE_URL`
- direct URL for optional `DATABASE_URL_UNPOOLED`

Do not deploy a localhost database URL to Vercel.

## Google OAuth Setup

Use a `Web application` OAuth client.

Required production settings:
- Authorized JavaScript origin:
  - `https://english-practice-area.vercel.app`
- Authorized redirect URI:
  - `https://english-practice-area.vercel.app/api/auth/callback/google`

Recommended local settings:
- `http://localhost:3000`
- `http://localhost:3000/api/auth/callback/google`

## Common Auth Failure Modes

### `invalid_client`
Usually means:
- wrong client ID
- deleted or wrong OAuth client
- wrong client type

### `OAuthCallback` with invalid secret
Usually means:
- wrong `AUTH_GOOGLE_SECRET`
- rotated secret no longer matches
- secret from another OAuth client

### `NO_SECRET`
Usually means:
- `AUTH_SECRET` missing in runtime env

## Deployment Workflow

1. configure env vars
2. confirm DB points to remote Postgres
3. deploy production
4. test Google sign-in and a DB-backed workspace route

## Useful Commands

```bash
npx vercel env list production
npx vercel deploy --prod --yes
npm run db:push
```
