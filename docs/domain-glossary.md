# Domain Glossary

## Builder
A top-level learning surface such as grammar, vocabulary, phrase & idiom, or sentence.

Use when:
- describing navigation and discovery
- grouping topic catalogs

Do not use when:
- referring to a separate runtime engine

Related type:
- `BuilderKind`

## Topic
The user-facing learning unit inside a builder. Topics are the main bridge between catalog, practice, review, and map/profile surfaces.

Related types:
- `StructureUnit`
- `TopicState`

## Structure
The internal catalog object behind a topic. In practice this repo often uses `structure` and `topic` together, but `StructureUnit` is the typed source object.

## Practice Item
A single prompt inside a practice session.

Related type:
- `PracticeItem`

## Session
A persisted bundle of practice items for a learner.

Related types:
- `PracticeSession`
- `SessionMode`
- `LearningMode`

## Learning Mode
User intent for a session: `learn`, `practice`, `review`, or `challenge`.

Use when:
- selecting blueprint order
- shaping UI support level

## Review Item
A due item scheduled for later recall after practice evidence.

Related type:
- `ReviewItem`

## Mastery Stage
Internal maturity of a topic or structure.

Related type:
- `MasteryStage`

## Progression State
The system’s current promotion/regression state for a topic.

Related type:
- `ProgressionState`

## Topic State
Learner-facing topic label such as `not_started`, `learning`, `stable`, or `strong`.

Related type:
- `TopicState`

## Vocabulary Target Item
An item-level vocabulary unit inside a vocabulary topic. It can be a word, collocation, phrase frame, or word family.

Related types:
- `VocabularyTargetItem`
- `VocabularyItemProgress`

## Grounded Feedback
Feedback tied to explicit task targets or learner response evidence. It should only mention errors or target forms actually present in the task contract.

## Safe Fallback
A restricted fallback practice mode used when a topic lacks fully authored open-ended content. Safe fallback only uses tasks that can be evaluated explicitly.

## Exact Rewrite
A follow-up mode that accepts normalized exact matches for a reference sentence before generic text evaluation.

Related type:
- `PracticeFollowUpMode`

## Hybrid Choice-Text
A recognition-first interaction where the learner chooses an option, receives immediate explanation, and then completes a required writing follow-up.

Related types:
- `PracticeInteractionType`
- `PracticeTaskStep`
