# ADR-001 Topic-Centric Learning System

## Context

The product spans builders, review, map, home, and profile. Without a shared learning unit, these surfaces drift into disconnected state.

## Decision

Use a topic-centric model as the top-level learning unit across recommendation, practice, review, and learner-facing summaries.

## Consequences

- all major surfaces can read from the same state model
- manual and guided practice can update the same records
- new features should attach to topics, not invent parallel state systems

## Non-goals

- replacing all item-level evidence with topic-only evidence
