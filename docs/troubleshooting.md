# Troubleshooting

## Google sign-in opens Google but returns `OAuthCallback`

Likely causes:
- invalid Google client secret
- callback succeeds to Google but fails in NextAuth token exchange

Check:
- `AUTH_GOOGLE_SECRET`
- `NEXTAUTH_URL`
- Google OAuth client type and callback URL

## Google shows `invalid_client`

Likely causes:
- wrong `AUTH_GOOGLE_ID`
- deleted or disabled OAuth client
- wrong client type

Fix:
- verify the exact OAuth client ID
- ensure it is a `Web application` client

## Production deploy works but workspace routes fail

Likely causes:
- `DATABASE_URL` still points to localhost
- remote Postgres not reachable

Fix:
- replace local DB URL with a remote production-safe URL

## Feedback mentions tokens or concepts not present in the learner response

Likely causes:
- ungrounded fallback evaluation
- stale session created before evaluator fixes

Fix:
- regenerate or reopen a fresh session
- confirm the topic has authored or safe-fallback practice content

## Exact rewrite remains rejected even when the learner typed the reference sentence

Likely causes:
- stale session or stale deployment
- incorrect follow-up mode wiring

Fix:
- confirm the item is `exact_rewrite`
- confirm normalized exact-match path is active
- retry with a fresh session

## `low_confidence` feedback looks too authoritative

Likely causes:
- UI still showing full score
- confidence metadata not respected by the renderer

Fix:
- check score visibility handling in the practice UI

## Old sessions still show strange evaluator behavior after a fix

Likely cause:
- practice items are persisted at session creation time

Fix:
- create a new session for the same topic to verify new blueprint or evaluator behavior
