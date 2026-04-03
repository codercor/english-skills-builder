# ADR-002 Single Practice Engine Across Builders

## Context

Grammar, vocabulary, phrase/idiom, and sentence surfaces need different content but should not diverge into separate backends.

## Decision

Use one shared practice engine with builder-specific content and interaction metadata.

## Consequences

- consistent scoring, review, and mastery updates
- builder-specific UX can evolve without forking session creation logic
- new builder content should plug into the same practice contracts

## Non-goals

- making all builders feel identical at the content level
