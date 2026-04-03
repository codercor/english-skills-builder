# ADR-004 Recognition-First Hybrid Interactions

## Context

Some tasks are naturally recognition-first. Forcing them into free-text UI creates friction and confuses scoring.

## Decision

Use `hybrid_choice_text` for recognition-first tasks: choose, explain, retry if needed, then complete a writing follow-up.

## Consequences

- better task-to-UI alignment
- recognition gets low-weight evidence only
- writing follow-up remains the main proof of usable knowledge

## Non-goals

- converting every task into multiple choice
