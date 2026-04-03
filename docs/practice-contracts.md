# Practice Contracts

## Prompt Types

Prompt types describe pedagogical intent:

- `completion`
- `rewrite`
- `guided_generation`
- `free_production`
- `memory_anchor`
- `constraint_based`
- `error_correction`

Prompt type alone does not determine the UI.

## Interaction Types

Interaction types determine UI behavior:

- `choice`
- `completion`
- `text`
- `hybrid_choice_text`

The key invariant is `task type -> interaction type`, not “everything uses a textarea”.

## Follow-Up Modes

Hybrid items may open one of two writing follow-ups:

- `exact_rewrite`
- `open_production`

### Exact rewrite
- reference sentence stays visible
- normalized exact match is checked first
- case, repeated spaces, and trailing punctuation differences are tolerated
- paraphrase is not accepted

### Open production
- rubric and evaluator logic apply
- exact text match is not required

## Task Steps

`PracticeTaskStep` values:
- `recognition`
- `follow_up`
- `text`

These values matter for:
- evaluator behavior
- feedback rendering
- hybrid item state

## Recognition-First Flow

Standard hybrid flow:

1. show options
2. learner selects one
3. immediate feedback if wrong
4. allow one retry
5. reveal correct choice after second miss
6. open required writing follow-up

Recognition alone is low-weight proof. It must not be treated as full mastery evidence.

## Feedback Payload

Critical fields:
- `feedbackSource`
  - `authored_bank`
  - `safe_fallback`
  - `llm`
- `feedbackConfidence`
  - `grounded`
  - `low_confidence`
- `scoreVisible`
- `taskStep`
- `recognitionEvidence`
- `recognitionFeedback`
- `issues`
- `acceptedAnswer`
- `naturalRewrite`
- `qualityScore`
- `responseScore`
- `isAccepted`

## Confidence Rules

### Grounded
Use normal score visibility when:
- the task is explicitly authored or safely constrained
- the feedback only refers to grounded target forms or real response evidence

### Low confidence
Use lower authority when:
- the evaluator cannot confidently ground the explanation
- the task relies on weaker fallback logic

In low-confidence mode:
- normal score display should be reduced or hidden
- feedback should prioritize correction over precision theater

## Grounded vs Safe Fallback

### Authored bank
Preferred mode. Open production is allowed only when the evaluator can explain failure in grounded terms.

### Safe fallback
Fallback topics may use:
- choice
- completion
- exact rewrite
- tightly constrained guided generation

Safe fallback must not invent broad “write from your life” tasks for unsupported topics.

## Speed Bonus Rules

Speed bonus is informational and low-weight.

- only controlled tasks should receive it
- open production and memory-anchor tasks should not lose score for thinking longer
- speed never overrides correctness

## Exact Rewrite Rules

- the reference sentence must stay visible throughout the follow-up
- exact-rewrite scoring is guided, not free-production scoring
- reveal does not auto-pass the item
- after reveal, retyping the normalized reference should be accepted
