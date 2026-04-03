# Examples

These fixtures are representative examples for agents and implementers. They are intentionally small, stable, and pedagogically opinionated.

Use them to answer questions like:
- what does a grounded feedback payload look like?
- what differs in low-confidence mode?
- how is an exact-rewrite hybrid item represented?
- what does vocabulary item evidence look like?

Files:

- [`practice-session.json`](./practice-session.json)
- [`feedback-grounded.json`](./feedback-grounded.json)
- [`feedback-low-confidence.json`](./feedback-low-confidence.json)
- [`vocabulary-item-progress.json`](./vocabulary-item-progress.json)
- [`topic-snapshot.json`](./topic-snapshot.json)
- [`learning-map-preview.json`](./learning-map-preview.json)
- [`hybrid-exact-rewrite-item.json`](./hybrid-exact-rewrite-item.json)
- [`recognition-first-item.json`](./recognition-first-item.json)

The fixtures are examples, not executable schema guarantees. When there is any conflict, the typed contracts in [`src/lib/types.ts`](../../src/lib/types.ts) and the runtime logic in [`src/lib/server/learning.ts`](../../src/lib/server/learning.ts) win.
