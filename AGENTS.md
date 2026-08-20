# sixth street image workflow

## review readiness

For user-facing UI work, `ready for Alvin` means:

- required code and data checks pass;
- fresh desktop and 360px renders of the current implementation are inspected;
- objective defects found in review are repaired;
- any repair invalidates the prior visual review and requires a fresh render and review; and
- no known objective review defects remain.

Do not use Alvin as the mechanical QA pass for work the agent can inspect itself. Escalate only for a genuine product or taste decision, missing or conflicting evidence, required external authorization, or a blocker the agent cannot safely resolve.

Do not invent operating rules, constraints, or capability assumptions. Treat them as established only when they come from an explicit user instruction, an official OpenAI source, or corroborated evidence. Otherwise label them as inference or a proposal rather than acting as though they are settled.

Until Alvin explicitly restores Codex's taste authority for Sixth Street, Codex is execution-only for product-facing work and ChatGPT web owns the independent taste gate. Preserve the currently accepted candidate unless a concrete defect is proven. Do not invent or unilaterally implement headlines, slogans, labels, lore flavor, imagery, interaction patterns, or hierarchy changes. When a product-facing concern arises, provide evidence and at most one alternative to ChatGPT; implement only after Alvin, ChatGPT, and Codex have converged. Treat ChatGPT's accepted taste reviews as binding unless new evidence exposes a real problem. Routine engineering fixes may continue autonomously. “Know the fight before you queue” is the negative calibration example: superficially game-like language that is not native to how Deadly Assault or Shiyu Defense are discussed.

Sixth Street copy must use actual Zenless Zone Zero / New Eridu vocabulary and preserve previously accepted homepage voice. Do not invent game-like mechanics or verbs for flavor; in particular, do not describe Deadly Assault or Shiyu Defense as queueing or use “queue” as their call to action.

For iterative hero-image work in this repository:

1. Consult the current official OpenAI image-generation guidance before the first edit in a working sequence.
2. Make one controlled image change at a time with the image-generation skill.
3. Inspect the rendered output before proposing or generating another pass.
4. Name visible defects concretely, including pseudo-text, repeated micro-patterns, drift, crop safety, contrast, and material inconsistency.
5. Continue from the last user-accepted image, not automatically from the newest image.
6. Preserve explicit invariants on every edit and do not integrate an image into the site until Alvin accepts it.

Official guidance supports explicit change-versus-preserve constraints and small iterative edits:
https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
