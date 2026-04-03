# ADR-006 Vocabulary Item-Level Evidence Model

## Context

Vocabulary learning quality cannot be captured by topic-level state alone. The system needs to know whether a learner can actually use specific items.

## Decision

Track vocabulary evidence at item level under the topic layer, using states such as `new`, `practising`, `usable`, `stable`, and `strong`.

## Consequences

- vocabulary topics can surface learned items, due review cards, and proof gaps
- topic mastery remains the surface-level unit, but item evidence informs it
- self-report is not enough; usage evidence drives progression

## Non-goals

- turning vocabulary into a separate flashcard product
