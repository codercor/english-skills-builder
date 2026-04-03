# ADR-003 Grounded Feedback Over Speculative Fallback

## Context

Speculative feedback damages user trust, especially when the evaluator mentions errors not present in the learner response.

## Decision

Prefer grounded authored evaluation. When grounding is weak, degrade to safe fallback tasks and mark feedback confidence accordingly.

## Consequences

- fewer hallucinated corrections
- low-confidence feedback must not present itself as fully authoritative
- unsupported topics should stay controlled instead of pretending to be open-ended coaches

## Non-goals

- removing fallback evaluation entirely
