#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import { validateEvidence } from "./sixthstreet-evidence.mjs";

const root = resolve(new URL("..", import.meta.url).pathname);
const outputDir = resolve(root, ".sixthstreet-state", "phases");
const packetPath = resolve(root, ".sixthstreet-state", "current.json");
const schemaPath = resolve(root, "state", "phase-result.schema.json");
const evidencePath = resolve(root, ".sixthstreet-state", "evidence.json");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const challengeEngine = args.has("--challenge-engine=pi") ? "pi" : "codex";
const modelArg = process.argv.find((value) => value.startsWith("--model="));
const model = modelArg?.slice("--model=".length) || "gpt-5.6-sol";

const requiredKeys = [
  "phase",
  "status",
  "assumptions",
  "missingContext",
  "falsifiers",
  "authoritativeInputs",
  "conflicts",
  "residualOwnerDecisions",
  "nextActions",
  "terminalGate",
  "evidence"
];

function fail(message) {
  throw new Error(message);
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: 15 * 60 * 1000,
    ...options
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`${command} exited ${result.status}\n${result.stderr || result.stdout}`);
  }
  return result;
}

export function validateResult(result, phase) {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    fail(`${phase} did not return an object`);
  }
  for (const key of requiredKeys) {
    if (!(key in result)) fail(`${phase} is missing ${key}`);
  }
  if (result.phase !== phase) fail(`${phase} returned phase=${result.phase}`);
  for (const key of [
    "assumptions",
    "missingContext",
    "falsifiers",
    "authoritativeInputs",
    "conflicts",
    "residualOwnerDecisions",
    "nextActions",
    "evidence"
  ]) {
    if (!Array.isArray(result[key])) fail(`${phase}.${key} must be an array`);
  }
  if (!result.falsifiers.length) fail(`${phase} must expose at least one falsifier`);
  if (!result.authoritativeInputs.length) fail(`${phase} must cite authoritative inputs`);
  if (!result.evidence.length) fail(`${phase} must cite evidence`);
  const concreteRef = /(sheet:|github|local git|current\.json|evidence\.json|receipt\.json|project-upload-manifest\.json|Sixth-Street-|state\/|scripts\/|tests\/|package\.json|alvinwin\/imagination#24|[a-f0-9]{40,64})/i;
  for (const key of ["authoritativeInputs", "evidence"]) {
    for (const item of result[key]) {
      if (!concreteRef.test(item)) fail(`${phase}.${key} contains an uncited claim: ${item}`);
    }
  }
  if (result.status === "pass") {
    if (result.missingContext.length) fail(`${phase} cannot pass with missing context`);
    if (result.conflicts.some((item) => item.state === "unresolved")) {
      fail(`${phase} cannot pass with unresolved conflicts`);
    }
  }
  if (phase === "terminal-audit" && result.status === "pass" && result.residualOwnerDecisions.length) {
    fail("terminal-audit cannot pass with residual owner decisions");
  }
}

function phasePrompt(phase, previous) {
  const shared = `
You are one read-only phase in Sixth Street's programmatic state pipeline.
Read ${packetPath}, ${resolve(root, "Sixth-Street-collaboration-contract-current.md")},
${resolve(root, "Sixth-Street-product-principles-current.md")}, and
${resolve(root, "Sixth-Street-collaboration-layer-map.md")} completely.
If ${evidencePath} exists, treat it as a claimed receipt bundle that still
requires deterministic validation; absence is expected before the terminal gate.

Expose your assumptions, context you cannot see, and concrete evidence that
would falsify your current model. Distinguish live Sheet, GitHub, local Git,
stable source, and historical evidence. Models may reconcile and challenge but
cannot settle a consequential owner decision by agreement. Do not edit files,
run writes, or return prose outside the required JSON object.

Status is scoped to this phase, not to the whole task. Put only context whose
absence prevents this phase from reaching its own conclusion in missingContext;
put known later terminal work and receipts in nextActions or evidence. A pass
must have an empty missingContext array. If any listed missing context blocks
this phase, return blocked or fail instead of pass.
`;
  if (phase === "reconcile") {
    return `${shared}
Phase: reconcile. Resolve A1: active task, canonical owners, effect surfaces,
conflicts, next safe action, and observable terminal gate. Treat every generated
field as a read model backed by its source ref. Fail or block if an authority is
missing, stale, or materially contradictory.`;
  }
  if (phase === "challenge") {
    return `${shared}
Phase: challenge. Independently inspect the packet and the reconcile result at
${previous.reconcile}. Try to disprove the reconciled task model, surface product
principles or continuity it missed, test whether a proposed mechanism is doing
real boundary work, and preserve every unresolved B1 owner choice.`;
  }
  return `${shared}
Phase: terminal-audit. Independently inspect the packet, reconcile result at
${previous.reconcile}, and challenge result at ${previous.challenge}. Audit the
actual A1/A2/B1 terminal boundary and all deterministic/write-back/Project
delivery receipts. A model saying done, a friendly review, or partial write-back
cannot pass. Return pass only when the observable terminal gate and required
receipts actually pass; otherwise return fail or blocked with exact next actions.`;
}

function runCodexPhase(phase, prompt) {
  const output = resolve(outputDir, `${phase}.json`);
  const events = resolve(outputDir, `${phase}.events.jsonl`);
  const result = run(
    "codex",
    [
      "exec",
      "--ephemeral",
      "--json",
      "-s",
      "read-only",
      "-C",
      root,
      "-m",
      model,
      "--output-schema",
      schemaPath,
      "-o",
      output,
      "-"
    ],
    { input: prompt }
  );
  writeFileSync(events, result.stdout, "utf8");
  const parsed = JSON.parse(readFileSync(output, "utf8"));
  validateResult(parsed, phase);
  return output;
}

function extractJson(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) fail("Pi did not return a JSON object");
  return JSON.parse(text.slice(start, end + 1));
}

function runPiChallenge(prompt) {
  const output = resolve(outputDir, "challenge.json");
  const transcript = resolve(outputDir, "challenge.pi.txt");
  const schema = readFileSync(schemaPath, "utf8");
  const piPrompt = `${prompt}\n\nYour final response must be one JSON object matching this schema exactly:\n${schema}`;
  const result = run(
    "pi",
    [
      "--provider",
      "openai-codex",
      "--model",
      model,
      "--thinking",
      "high",
      "--no-session",
      "--no-extensions",
      "--no-context-files",
      "--tools",
      "read,grep,find,ls",
      "-p",
      piPrompt
    ]
  );
  writeFileSync(transcript, result.stdout, "utf8");
  const parsed = extractJson(result.stdout);
  validateResult(parsed, "challenge");
  writeFileSync(output, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return output;
}

function compactReceipt(results, snapshot, evidenceGate) {
  const statuses = Object.fromEntries(
    Object.entries(results).map(([phase, result]) => [phase, result.status])
  );
  const audit = results["terminal-audit"];
  return {
    schemaVersion: 1,
    runId: snapshot.runId,
    task: {
      id: snapshot.task.id,
      title: snapshot.task.title.value,
      source: snapshot.task.canonicalRef
    },
    state: audit.status === "pass" && evidenceGate.pass && Object.values(statuses).every((status) => status === "pass")
      ? "completed"
      : audit.status === "blocked" ? "blocked" : "fail",
    sources: {
      sheet: snapshot.sources.sheet.retrieval,
      github: `${snapshot.sources.github.repo}#${snapshot.sources.github.issue}`,
      local: `${snapshot.sources.localGit.branch}@${snapshot.sources.localGit.head}`
    },
    decision: audit.residualOwnerDecisions.length ? "owner-required" : "none",
    residualOwnerDecisions: audit.residualOwnerDecisions,
    terminalGate: audit.terminalGate,
    phases: statuses,
    evidenceGate,
    nextActions: audit.nextActions
  };
}

export function main() {
  mkdirSync(outputDir, { recursive: true });

  if (dryRun) {
  const previous = {
    reconcile: resolve(outputDir, "reconcile.json"),
    challenge: resolve(outputDir, "challenge.json")
  };
  const prompts = Object.fromEntries(
    ["reconcile", "challenge", "terminal-audit"].map((phase) => [phase, phasePrompt(phase, previous)])
  );
  writeFileSync(resolve(outputDir, "prompts.json"), `${JSON.stringify(prompts, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({ dryRun: true, challengeEngine, prompts: resolve(outputDir, "prompts.json") })}\n`);
    return;
  }

  run("python3", [resolve(root, "scripts", "sixthstreet-state.py"), "snapshot", "--strict"]);

  const previous = {};
  previous.reconcile = runCodexPhase("reconcile", phasePrompt("reconcile", previous));
  previous.challenge = challengeEngine === "pi"
    ? runPiChallenge(phasePrompt("challenge", previous))
    : runCodexPhase("challenge", phasePrompt("challenge", previous));
  const audit = runCodexPhase("terminal-audit", phasePrompt("terminal-audit", previous));

  const results = Object.fromEntries(
    Object.entries({ ...previous, "terminal-audit": audit }).map(([phase, path]) => [
      phase,
      JSON.parse(readFileSync(path, "utf8"))
    ])
  );
  writeFileSync(resolve(outputDir, "summary.json"), `${JSON.stringify(results, null, 2)}\n`, "utf8");
  const snapshot = JSON.parse(readFileSync(packetPath, "utf8"));
  const evidence = existsSync(evidencePath) ? JSON.parse(readFileSync(evidencePath, "utf8")) : {};
  const evidenceGate = validateEvidence(snapshot, evidence);
  const receipt = compactReceipt(results, snapshot, evidenceGate);
  writeFileSync(resolve(root, ".sixthstreet-state", "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

function failClosedReceipt(error) {
  const snapshot = existsSync(packetPath) ? JSON.parse(readFileSync(packetPath, "utf8")) : null;
  const evidence = snapshot && existsSync(evidencePath)
    ? JSON.parse(readFileSync(evidencePath, "utf8"))
    : {};
  const evidenceGate = snapshot
    ? validateEvidence(snapshot, evidence)
    : { pass: false, errors: ["state snapshot was not produced"] };
  const phaseNames = ["reconcile", "challenge", "terminal-audit"];
  const phases = Object.fromEntries(phaseNames.map((phase) => {
    const path = resolve(outputDir, `${phase}.json`);
    if (!existsSync(path)) return [phase, "not-run"];
    try {
      return [phase, JSON.parse(readFileSync(path, "utf8")).status || "invalid"];
    } catch {
      return [phase, "invalid"];
    }
  }));
  const message = error instanceof Error ? error.message : String(error);
  return {
    schemaVersion: 1,
    runId: snapshot?.runId ?? null,
    task: snapshot ? {
      id: snapshot.task.id,
      title: snapshot.task.title.value,
      source: snapshot.task.canonicalRef
    } : null,
    state: "fail",
    sources: snapshot ? {
      sheet: snapshot.sources.sheet.retrieval,
      github: `${snapshot.sources.github.repo}#${snapshot.sources.github.issue}`,
      local: `${snapshot.sources.localGit.branch}@${snapshot.sources.localGit.head}`
    } : {},
    decision: "none",
    residualOwnerDecisions: [],
    terminalGate: `FAIL: workflow validation aborted before a trusted terminal audit: ${message}`,
    phases,
    evidenceGate,
    nextActions: ["Repair the reported validation or execution defect, then rerun the single workflow."]
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    main();
  } catch (error) {
    const receipt = failClosedReceipt(error);
    mkdirSync(resolve(root, ".sixthstreet-state"), { recursive: true });
    writeFileSync(resolve(root, ".sixthstreet-state", "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
    process.stderr.write(`${receipt.terminalGate}\n`);
    process.exitCode = 1;
  }
}
