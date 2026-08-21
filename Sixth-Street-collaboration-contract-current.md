# Sixth Street collaboration contract

This file contains stable cross-session rules for Sixth Street. It does not track current implementation status, active branches, PR heads, deployments, or next tasks.

## moving state

GitHub and the AI Project Runway Google Sheet own moving project state.

Use those sources to determine current work, accepted decisions, ownership, review or deployment state, next action, and verification evidence. If this file conflicts with GitHub or the Sheet about moving state, the live project sources control.

Do not copy transient project status into this file.

## collaboration contract

### P0-A: task lifecycle

#### A1 — authoritative activation

**Act:** Identify the requested effect surface and reconstruct current task state
from applicable Project history, retained ChatGPT history, the live Sheet and
GitHub, and Codex-local evidence before judging or acting.

**Bound:** Ask Alvin to reconstruct state only when a result-changing fact is
genuinely inaccessible, materially conflicting, or requires his judgment or
authorization.

#### A2 — terminal continuation

**Act:** Advance the accepted goal through bounded, reversible increments and
keep taking the next safe dependency-ordered action through review, repair,
handoff, and verification.

**Bound:** Stop only at the passed terminal gate, a genuine evidence/access
blocker, a consequential unresolved owner choice, or an external/destructive
authorization boundary. Speculative abstraction and hypothetical infrastructure
remain outside the task unless current evidence requires them.

#### Lifecycle support — direct evidence transfer

**Act:** Codex supplies relevant local-only facts to ChatGPT; ChatGPT supplies
retained context and independent challenge to Codex; shared moving state goes to
the Sheet or GitHub surface that owns it.

**Bound:** Alvin contributes product judgment and authorization rather than
serving as the mechanical transport layer between agents.

#### Lifecycle support — programmatic state path

**Act:** Represent each high-value state class in one machine-readable producer,
derive or validate its human and agent context views programmatically, and run
bounded reconcile, challenge, and terminal-audit phases at the transitions where
drift or premature closure has recurred.

**Bound:** Sheet, GitHub, ChatGPT Project, and local Git keep the authority each
actually owns. Generated context is a read model; a scripted or model-driven
phase can expose conflicts and residual decisions but cannot manufacture product
acceptance. Prefer existing Codex exec, Pi, skill, connector, and repository
capabilities before adding a new orchestration layer.

### preserve state and provenance

**Act:** Keep implemented, verified, reviewed, merged, deployed, and live-
verified as distinct states. Preserve the strength and provenance of every
source-backed claim, and treat a single behavioral inference as provisional
until independently corroborated. Weight a recurring behavioral repair that
persists across three independent representative attempts as strong trend
evidence.

**Bound:** Player-facing claims fail closed when evidence is stale, unverified,
schema-invalid, privacy-unsafe, or materially incomplete. Durable operating
rules require Alvin's steer, applicable official OpenAI guidance, or corroborated
project evidence. Corroboration and repeated success raise confidence; they are
evidence weights rather than a universal hard rule that overrides primary facts,
counterexamples, or task context.

## review-gate targets

### 1. clean review handoff

A user-facing UI change is ready for Alvin only when required checks pass, fresh desktop and 360px renders of the current implementation are inspected, every objective review defect is repaired, and the post-repair renders are reviewed with zero known objective defects.

Any repair invalidates the prior visual review.

### 2. source/data gate

Nothing player-facing passes review when its source is stale, unverified, schema-invalid, privacy-unsafe, or stronger than the evidence supports.

### 3. P0-B decision-authority gate

**Act:** Alvin supplies product authority through current feedback and recovered
settled decisions. ChatGPT and Codex participate as coequal peers with different
context and capabilities. Each can initiate, widen, challenge, and revise the
shared reasoning.

**Act:** Begin product/taste collaboration by recovering relevant Project
history and settled decisions. ChatGPT contributes retained context, tensions,
and product judgment that Codex did not provide. Codex contributes local facts,
implementation constraints, tests, and counterarguments. Continue the exchange
until disagreements are explicit and the shared result incorporates all three
perspectives.

**Act:** Expose each participant's starting assumptions, missing context, and
falsification conditions. Use the other perspectives to deconstruct those
partial models before forming a shared result.

**Bound:** An assumption, reviewer verdict, repeated agreement, or agent-generated
state remains evidence rather than authority. Only recovered settled owner
evidence or Alvin's new decision can settle a consequential choice.

**Bound:** Routine reversible execution within a settled decision continues
autonomously. Reopen accepted wording, visual-system, product-scope, or
methodology decisions only when current evidence creates a real conflict.

**Bound:** Prompts leave room for ChatGPT's independent context and judgment. A
prescribed candidate, expected verdict, `return only` shape, one-shot answer,
peer-authority label, or proposer-confirmed fidelity check cannot establish
convergence. Ask Alvin only for a consequential product conflict that recovered
authority and the peer exchange cannot resolve.

### 4. deployment gate

The artifact or head that ships must be the artifact or head that passed review.

Keep reviewed, merged, deployed, and live-verified as separate states. Verify the live result after deployment before declaring the work complete.

## non-goals

Keep this file small and stable as the cross-session collaboration contract.
Moving status, roadmap, task queue, design specification, and incident evidence
belong to their named live or ledger surfaces.
