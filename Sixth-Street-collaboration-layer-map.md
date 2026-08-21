# Sixth Street collaboration layer map

This map separates producers, activation consumers, moving-state owners,
evidence stores, runtime controls, and executable enforcement. It is a routing
reference, not another copy of the collaboration contract.

| Layer | Live role | Treatment |
| --- | --- | --- |
| ChatGPT system/developer runtime | platform and tool boundary | Read-only; verify behavior, do not shadow it. |
| ChatGPT Project instructions | fresh-session activator | Thin pointer to the current source map, contract, product principles, and generated state packet. |
| ChatGPT Project sources | ChatGPT-readable stable producers | Resolve current uploads by the Project inventory plus expected content hash. Prefer `-current` files; when the backend reserves a removed filename, record the exact replacement name. Do not make Project sources a moving-state mirror. |
| Project chats, Project memory, retained outside history | settled-decision and incident evidence | Search and challenge; never treat remembered moving state as current authority. |
| Codex system/developer runtime | platform and tool boundary | Read-only; test in fresh sessions. |
| `~/.codex/AGENTS.md` | cross-workspace activator | Keep only genuinely cross-workspace behavior. |
| nearest applicable `AGENTS.md` / `AGENTS.override.md` | workspace activator | Point to the current contract/state entry point and keep repo-local rules. Verify the actual root-to-cwd chain. |
| stable source files | collaboration, product-principle, and locator producers | Keep one semantic producer per knowledge class; generated views identify their producer. |
| Codex config, skills, plugins, permissions, sandbox | capability and effect controls | Inspect before relying on them; change only when a reproduced failure proves the need. |
| Codex hooks and `.rules` | optional mechanical enforcement | No relevant Sixth Street instances were found on 2026-08-20. Do not invent them for this slice. |
| Codex JSONLs and Codex memory | behavioral and continuity evidence | Read-only for this repair; memory is not the sole rule producer and is not updated without explicit authorization. |
| local Git/worktree | actual uncommitted implementation state | Read live on every state resolution. Do not flatten it into GitHub HEAD. |
| GitHub | committed state and durable issue/PR evidence | Read live; write through normal Git/issue/PR workflows; issue #24 is the repair ledger, not a second contract. |
| AI Project Runway | shared moving-state owner and domain tables | Read live; keep one active lifecycle row plus domain research/spec tables; programmatically validate and write transition state. |
| `.sixthstreet-state/current.json` and `.md` | disposable generated run-state index | Generate from live owners, include source references and hashes, reject drift, never treat as product authority; attach the packet to an active ChatGPT exchange when local-only state matters rather than storing it as a Project source. |
| scripted Codex exec phases | bounded semantic reconcile, challenge, and audit | Fresh read-only sessions with a JSON output schema; claims without source references fail validation. |
| active Codex task lifecycle | bounded authorized execution | Performs the task work between gates and records receipts. `npm run sixthstreet:run` deterministically audits those receipts; it is not an unsafe general-purpose task executor. Alvin never launches or coordinates either layer. |
| Pi/GLLA | optional durable execution loop | A live isolated proof on 2026-08-20 confirmed Codex auth, goal completion, and an independent detached auditor. The first verification-heavy goal was paused by GLLA's suspicious-objective shield, and the successful trivial goal also invoked an unnecessary Pi subagent. Keep it out of the v0 operator path; consider it only for long-running A2 continuation after disabling unrelated subagent expansion. Do not make it the project tracker. |
| Pi purpose-built agents | optional decision-time source activation and falsification | Read-only and non-authoritative; promote only after paired attempts show material context that normal activation misses. |

## Programmatic flow

From Alvin's perspective this is one workflow—`npm run sixthstreet:run`—and one
compact receipt. The resolver, model phases, Pi/GLLA candidate, and adapters are
internal details surfaced only when a check fails.

1. Resolve live Sheet, GitHub, local Git, stable source revisions, and expected
   Project-source hashes into the disposable state packet.
2. Reject missing authorities, stale P0 taxonomies, invalid schemas, and
   unresolved effect surfaces before consequential work.
3. Run fresh reconcile and challenge phases whose structured outputs expose
   assumptions, missing context, falsifiers, conflicts, and residual owner
   decisions.
4. Execute the bounded task through the active Codex lifecycle and record
   machine-readable Project, behavioral-attempt, test, and write/reread
   receipts. Pi/GLLA remains an optional long-running continuation adapter; the
   model output is not the lifecycle authority.
5. Write the result to each owning surface, re-read it, record receipts, and run
   the terminal audit. Partial write-back is not completion.

The first implementation deliberately keeps the existing Sheet and GitHub
owners. A new tracker becomes justified only when the resolver proves that the
existing owners cannot represent one lifecycle unambiguously or cannot be
updated safely without duplicated manual narratives.
