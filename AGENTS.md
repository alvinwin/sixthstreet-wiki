# sixth street image workflow

## review readiness

For user-facing UI work, `ready for Alvin` means:

- required code and data checks pass;
- fresh desktop and 360px renders of the current implementation are inspected;
- objective defects found in review are repaired;
- any repair invalidates the prior visual review and requires a fresh render and review; and
- no known objective review defects remain.

Complete the mechanical QA pass before presenting work to Alvin. **Bound:**
escalate only for a genuine product or taste decision, missing or conflicting
evidence, required external authorization, or a blocker the agent cannot safely
resolve.

Treat an operating rule, constraint, or capability as established when it comes
from Alvin's instruction, applicable official OpenAI guidance, or corroborated
project evidence. **Bound:** label other interpretations as proposals and test
them before making them durable.

For sustained or resumed Sixth Street work, begin with
`Sixth-Street-project-brief-current.md`, `Sixth-Street-source-map-current.md`,
`Sixth-Street-collaboration-contract-current.md`, and the applicable live sources.
Use `Sixth-Street-P0-friction-ledger.md` when a collaboration failure or its
repair is in scope. Identify the requested effect surface, accepted goal, and
observable terminal gate before acting.

Use `npm run sixthstreet:run` as the single operator-visible programmatic entry
point. Its generated state packet, structured internal phases, and compact
receipt are implementation details unless a check fails. Reconcile generated context against the
live Sheet, GitHub, ChatGPT Project, and local Git owners at the named transition
points; run the bounded reconcile, challenge, and terminal-audit phases rather
than manually copying state among prose surfaces. The active Codex task executes
authorized work; this command is the deterministic gate that rejects completion
without execution, Project, test, attempt, and write/reread receipts, not a
general-purpose task executor. **Bound:** generated state is a read model, not a
new product authority, and Alvin is not the operator or architect of the
synchronization path.

Validate machine-readable identity, freshness, execution, exact writeback, and
observable A1/A2/B1 behavior. Do not make human-facing Sheet or issue prose pass
by containing magic labels or matching an explanatory sentence. Treat the
structured contract as the machine definition and the Sheet/GitHub/local state
as its live evidence. **Bound:** do not add another invariant, state category,
receipt type, or validation rule unless a reproduced failure could let A1, A2,
or B1 pass incorrectly.

Advance the accepted goal through bounded, reversible, extensible increments.
Prefer an implementation that solves the present problem cleanly and can be
revised cheaply at the next review gate. Continue routine in-scope work through
the terminal gate. **Bound:** stop only at that passed gate, a genuine evidence
or access blocker, a consequential unresolved owner choice, or an external or
destructive authorization boundary. Speculative abstraction and hypothetical
future infrastructure stay outside the task unless current evidence requires
them.

Alvin owns Sixth Street's product decisions. Codex and ChatGPT web contribute as
coequal peers with different evidence and capabilities. Either collaborator may
widen the question, introduce missing context, challenge assumptions, or change
position. Preserve the accepted candidate until a concrete defect is proven;
for a consequential product change, recover Alvin's authority and conduct a
working exchange whose result genuinely incorporates all three perspectives.
Routine engineering fixes continue autonomously. **Bound:** neither peer has
seniority, central authority, or unilateral taste authority, and a peer proposal
cannot turn itself into an accepted headline, slogan, label, lore choice,
imagery, interaction, or hierarchy. “Know the fight before you queue” remains
the negative calibration example: superficially game-like language that is not
native to how Deadly Assault or Shiyu Defense are discussed.

For a new or revised label, headline, hierarchy, interaction, or other taste
decision, ChatGPT surfaces retained context and judgment that Codex did not
provide; Codex contributes verified local facts and challenges conflicts; both
respond until the reasoning that resolves disagreement is explicit. Represent
Alvin's product authority through current feedback and recovered settled
decisions. **Bound:** ChatGPT proposal → Codex implementation → ChatGPT fidelity
confirmation is circular approval, not convergence. Ask Alvin only when the
recovered authority and peer exchange leave a genuinely unresolved consequential
choice.

At the start of that exchange, each participant names the assumptions it is
bringing, the context it cannot see, and evidence that would change its view.
Use the exchange to deconstruct incompatible partial models before proposing a
result. **Bound:** agreement without exposed premises is weak evidence and cannot
settle a consequential choice.

Use actual Zenless Zone Zero / New Eridu vocabulary and preserve the previously
accepted homepage voice. **Bound:** flavor cannot invent game mechanics or verbs;
Deadly Assault and Shiyu Defense are not described as queueing and `queue` is not
their call to action.

For exact Operation Bagel facility prerequisites, upgrade costs, and blocked-progression evidence, search current official ZZZ/HoYoverse main-channel resources and HoYoLAB posts first, then Reddit discussions, before considering video evidence. Official main-channel resources are a first-pass source, not an afterthought. Prefer posts with legible screenshots or exact transcriptions that can be reconciled to current client-derived labels. Treat Reddit as a lead and observation surface rather than mechanics authority, preserve conflicts, and leave unmatched claims blocked. YouTube is inefficient for this evidence job and is not the default route.

For iterative hero-image work in this repository:

1. Consult the current official OpenAI image-generation guidance before the first edit in a working sequence.
2. Make one controlled image change at a time with the image-generation skill.
3. Inspect the rendered output before proposing or generating another pass.
4. Name visible defects concretely, including pseudo-text, repeated micro-patterns, drift, crop safety, contrast, and material inconsistency.
5. Continue from the last user-accepted image, not automatically from the newest image.
6. Preserve explicit invariants on every edit and do not integrate an image into the site until Alvin accepts it.

Official guidance supports explicit change-versus-preserve constraints and small iterative edits:
https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
