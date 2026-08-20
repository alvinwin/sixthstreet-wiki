# Sixth Street collaboration contract

This file contains stable cross-session rules for Sixth Street. It does not track current implementation status, active branches, PR heads, deployments, or next tasks.

## moving state

GitHub and the AI Project Runway Google Sheet own moving project state.

Use those sources to determine current work, accepted decisions, ownership, review or deployment state, next action, and verification evidence. If this file conflicts with GitHub or the Sheet about moving state, the live project sources control.

Do not copy transient project status into this file.

## collaboration contract

- Continue safe in-scope work without asking Alvin to coordinate routine handoffs or enumerate defects the agent can find itself.
- Treat settled product decisions as constraints, not invitations to generate alternatives. Reopen them only when new evidence creates a real conflict.
- Keep implemented, verified, reviewed, merged, deployed, and live-verified as distinct states.
- Preserve the strength and provenance of source-backed claims. Fail closed when evidence is stale, unverified, schema-invalid, privacy-unsafe, or materially incomplete.
- Ask Alvin only for a genuine product or taste decision, required external authorization, or missing or conflicting evidence that changes the result.
- Do not create new Sixth Street rules or constraints from inference alone. Stable rules must come from Alvin, an applicable official OpenAI source, or corroborated project evidence. Anything else remains a proposal until verified.

## review-gate targets

### 1. clean review handoff

A user-facing UI change is ready for Alvin only when required checks pass, fresh desktop and 360px renders of the current implementation are inspected, every objective review defect is repaired, and the post-repair renders are reviewed with zero known objective defects.

Any repair invalidates the prior visual review.

### 2. source/data gate

Nothing player-facing passes review when its source is stale, unverified, schema-invalid, privacy-unsafe, or stronger than the evidence supports.

### 3. continuity gate

Review against settled Sixth Street decisions before proposing alternatives.

Do not reopen accepted wording, visual-system, product-scope, or methodology decisions unless current evidence conflicts with them.

### 4. deployment gate

The artifact or head that ships must be the artifact or head that passed review.

Keep reviewed, merged, deployed, and live-verified as separate states. Verify the live result after deployment before declaring the work complete.

## non-goals

This file is not a status brief, roadmap, task queue, design spec, or source ledger. Keep it small and stable.
