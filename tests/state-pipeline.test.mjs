import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const stateScript = resolve(root, "scripts", "sixthstreet-state.py");
const fixture = resolve(root, "tests", "fixtures", "sixthstreet-state-input.json");
const fixtureEnv = { ...process.env, SIXTHSTREET_ALLOW_FIXTURE: "1" };
const evidenceFixtureRoot = mkdtempSync(join(os.tmpdir(), "sixthstreet-evidence-test-"));
writeFileSync(join(evidenceFixtureRoot, "session.jsonl"), [
  { type: "session_meta", payload: { id: "session-1", git: { commit_hash: "head-1" } } },
  { type: "event_msg", payload: { type: "agent_message", message: "Intermediate substep complete." } },
  { type: "response_item", payload: { type: "message" } },
  { type: "response_item", payload: { type: "custom_tool_call", name: "exec", call_id: "check-1", input: "tools.exec_command({cmd:\"npm run check\"})" } },
  { type: "response_item", payload: { type: "custom_tool_call_output", call_id: "check-1", output: [{ type: "input_text", text: "{\"exit_code\":0}" }] } }
].map((value) => JSON.stringify(value)).join("\n") + "\n", "utf8");
writeFileSync(join(evidenceFixtureRoot, "stale-session.jsonl"), [
  { type: "session_meta", payload: { id: "session-old", git: { commit_hash: "old-head" } } },
  { type: "event_msg", payload: { type: "agent_message", message: "Intermediate substep complete." } },
  { type: "response_item", payload: { type: "message" } },
  { type: "response_item", payload: { type: "custom_tool_call", name: "exec" } }
].map((value) => JSON.stringify(value)).join("\n") + "\n", "utf8");
writeFileSync(join(evidenceFixtureRoot, "exchange.txt"), "Codex and ChatGPT challenge a recovered owner decision.\n", "utf8");
const validationOptions = { codexSessionRoot: evidenceFixtureRoot, exchangeRoot: evidenceFixtureRoot };

test("keeps the product principles view generated from one JSON producer", () => {
  execFileSync("python3", [stateScript, "render", "--check"], { cwd: root });
});

test("generates a source-referenced disposable state packet", () => {
  const output = mkdtempSync(join(os.tmpdir(), "sixthstreet-state-test-"));
  execFileSync("python3", [stateScript, "snapshot", "--fixture", fixture, "--output", output, "--strict"], {
    cwd: root,
    env: fixtureEnv
  });
  const snapshot = JSON.parse(readFileSync(join(output, "current.json"), "utf8"));
  const uploadManifest = JSON.parse(readFileSync(join(output, "project-upload-manifest.json"), "utf8"));

  assert.equal(snapshot.schemaVersion, 1);
  assert.deepEqual(snapshot.invariants.map(({ id }) => id), ["A1", "A2", "B1"]);
  assert.equal(snapshot.task.canonicalRef, "sheet:Sixthstreet Prep!A22:H22");
  assert.match(snapshot.task.terminalGate.value, /A1 A2 and B1/);
  assert.ok(snapshot.sources.sheet.cells.every((cell) => cell.ref && cell.sha256));
  assert.ok(snapshot.checks.every((check) => check.status === "pass"));
  assert.equal(snapshot.decision.status, "preserve-unresolved");
  assert.ok(uploadManifest.sources.every(({ path }) => existsSync(path)));
  assert.equal(
    uploadManifest.sources.find(({ name }) => name === "Sixth-Street-source-map-current(2).md").path,
    resolve(root, "Sixth-Street-source-map-current.md")
  );
});

test("rejects fixture bypass outside the test-only environment", () => {
  const output = mkdtempSync(join(os.tmpdir(), "sixthstreet-state-bypass-"));
  assert.throws(() => execFileSync("python3", [stateScript, "snapshot", "--fixture", fixture, "--output", output, "--strict"], {
    cwd: root,
    env: { ...process.env, SIXTHSTREET_ALLOW_FIXTURE: "" },
    stdio: "pipe"
  }));
});

test("fails closed on invalid task and GitHub authority states", () => {
  const base = JSON.parse(readFileSync(fixture, "utf8"));
  const cases = [
    ["blank-task-field", (value) => { value.sheet["Sixthstreet Prep!E22"] = ""; }],
    ["wrong-priority", (value) => { value.sheet["Sixthstreet Prep!F22"] = "P1"; }],
    ["closed-task", (value) => { value.sheet["Sixthstreet Prep!G22"] = "Done"; }],
    ["wrong-issue", (value) => { value.github.number = 25; }],
    ["closed-issue", (value) => { value.github.state = "CLOSED"; }],
    ["blank-issue", (value) => { value.github.body = ""; }]
  ];

  for (const [name, mutate] of cases) {
    const value = structuredClone(base);
    mutate(value);
    const directory = mkdtempSync(join(os.tmpdir(), `sixthstreet-state-${name}-`));
    const input = join(directory, "fixture.json");
    writeFileSync(input, `${JSON.stringify(value)}\n`, "utf8");
    assert.throws(() => execFileSync("python3", [stateScript, "snapshot", "--fixture", input, "--output", directory, "--strict"], {
      cwd: root,
      env: fixtureEnv,
      stdio: "pipe"
    }), name);
  }
});

test("does not couple live authority to magic strings in explanatory prose", () => {
  const value = JSON.parse(readFileSync(fixture, "utf8"));
  value.sheet["Paths!L3"] = "The current repair is blocked at its owner authorization boundary.";
  value.sheet["Sixthstreet Prep!D22"] = "Integrate the reviewed branch, then exercise the real product-decision boundary.";
  value.sheet["Sixthstreet Prep!E22"] = "Complete after fresh activation, continued execution, protected owner choice, and verified writeback.";
  value.sheet["Sixthstreet Prep!H22"] = "The lifecycle and decision-authority repairs remain open.";
  value.sheet["20x Experiment!D13"] = "The bounded lifecycle gate is under evaluation.";
  value.github.body = "# Current repair\nThe tracked P0 remains open pending its real terminal boundary.";
  const directory = mkdtempSync(join(os.tmpdir(), "sixthstreet-state-prose-"));
  const input = join(directory, "fixture.json");
  writeFileSync(input, `${JSON.stringify(value)}\n`, "utf8");

  assert.doesNotThrow(() => execFileSync("python3", [stateScript, "snapshot", "--fixture", input, "--output", directory, "--strict"], {
    cwd: root,
    env: fixtureEnv,
    stdio: "pipe"
  }));
});

test("builds three fresh-session phase prompts without invoking a model", () => {
  const raw = execFileSync("node", [resolve(root, "scripts", "run-sixthstreet-phases.mjs"), "--dry-run", "--challenge-engine=pi"], {
    cwd: root,
    encoding: "utf8"
  });
  const result = JSON.parse(raw);
  const prompts = JSON.parse(readFileSync(result.prompts, "utf8"));

  assert.equal(result.challengeEngine, "pi");
  assert.match(prompts.reconcile, /Resolve A1/);
  assert.match(prompts.reconcile, /Status is scoped to this phase/);
  assert.match(prompts.reconcile, /A pass\s+must have an empty missingContext array/);
  assert.match(prompts.reconcile, /Every authoritativeInputs and evidence item must contain its own concrete source\s+token/);
  assert.match(prompts.reconcile, /An unmet terminal condition or required external authorization is\s+not by itself an authority conflict/);
  assert.match(prompts.challenge, /Try to disprove/);
  assert.match(prompts["terminal-audit"], /actual A1\/A2\/B1 terminal boundary/);
  assert.match(prompts["terminal-audit"], /exact codex-session JSONL line span/);
  assert.match(prompts["terminal-audit"], /compact receipt cannot prove continuation by itself/);
  assert.match(prompts["terminal-audit"], /run-scoped chatgpt-exchange export/);
  assert.match(prompts["terminal-audit"], /two peers agree without owner evidence/);
});

test("accepts exact machine-readable receipt references in phase evidence", async () => {
  const { validateResult } = await import("../scripts/run-sixthstreet-phases.mjs");
  const result = {
    phase: "reconcile",
    status: "pass",
    assumptions: [],
    missingContext: [],
    falsifiers: ["A live Sheet reread changes sheet:Sixthstreet Prep!A22:H22."],
    authoritativeInputs: ["sheet:Sixthstreet Prep!A22:H22"],
    conflicts: [],
    residualOwnerDecisions: [],
    nextActions: ["Continue to challenge."],
    terminalGate: "Scoped reconcile gate passed.",
    evidence: ["codex-session /tmp/session.jsonl#L10-L12 is the exact bounded behavior source."]
  };

  assert.doesNotThrow(() => validateResult(result, "reconcile"));
});

function evidenceSnapshot(runId = "run-1") {
  return {
    runId,
    projectDelivery: { requiredSources: [{ name: "contract.md", sha256: "abc" }] },
    sources: {
      localGit: { head: "head-1", workingTreeSha256: "tree-1" },
      sheet: {
        cells: [
          { ref: "sheet:Sixthstreet Prep!D22", sha256: "sheet-d22" },
          { ref: "sheet:Sixthstreet Prep!H22", sha256: "sheet-h22" }
        ]
      },
      github: { repo: "alvinwin/imagination", issue: 24, bodySha256: "github-body" }
    }
  };
}

function validEvidence(packetRunId = "run-1") {
  const activationChat = "https://chatgpt.com/g/g-p-test/c/activation";
  return {
    projectActivation: {
      status: "pass",
      chatUrl: activationChat,
      packetRunId,
      localHead: "head-1",
      workingTreeSha256: "tree-1",
      instructionsReadback: true,
      stableSources: [{ name: "contract.md", sha256: "abc" }]
    },
    attempts: [
      { id: "a1", invariant: "A1", scenario: "activation", startingCondition: "stale input", observedBehavior: "reconciled", result: "pass", evidenceRef: activationChat },
      { id: "a2", invariant: "A2", scenario: "continuation", startingCondition: "substep done", observedBehavior: "continued", result: "pass", evidenceRef: "codex-session session.jsonl#L2-L4; commit head-1" },
      { id: "b1", invariant: "B1", scenario: "pseudo-convergence", startingCondition: "peer agreement", observedBehavior: "preserved owner choice", result: "pass", evidenceRef: "https://chatgpt.com/c/b1-exchange; chatgpt-exchange exchange.txt" }
    ],
    repositoryChecks: {
      status: "pass",
      command: "npm run check",
      localHead: "head-1",
      workingTreeSha256: "tree-1",
      evidenceRef: "codex-session session.jsonl#L4-L5; commit head-1"
    },
    writebacks: [
      {
        surface: "sheet",
        status: "pass",
        items: [
          { ref: "sheet:Sixthstreet Prep!D22", expectedSha256: "sheet-d22", rereadSha256: "sheet-d22" },
          { ref: "sheet:Sixthstreet Prep!H22", expectedSha256: "sheet-h22", rereadSha256: "sheet-h22" }
        ]
      },
      { surface: "github", status: "pass", target: "alvinwin/imagination#24", expectedSha256: "github-body", rereadSha256: "github-body" }
    ]
  };
}

test("fails deterministic evidence validation when a receipt is missing or stale", async () => {
  const { validateEvidence } = await import("../scripts/sixthstreet-evidence.mjs");
  const snapshot = evidenceSnapshot();
  const evidence = validEvidence();

  assert.equal(validateEvidence(snapshot, evidence, validationOptions).pass, true);
  evidence.repositoryChecks.workingTreeSha256 = "stale";
  assert.deepEqual(validateEvidence(snapshot, evidence, validationOptions), {
    pass: false,
    errors: ["repository-check working tree does not match current snapshot"]
  });
});

test("rejects a self-declared repository pass without an exact passing session span", async () => {
  const { validateEvidence } = await import("../scripts/sixthstreet-evidence.mjs");
  const snapshot = evidenceSnapshot();
  const evidence = validEvidence();
  evidence.repositoryChecks.evidenceRef = "npm run check passed";

  assert.ok(validateEvidence(snapshot, evidence, validationOptions).errors.includes(
    "repository-check evidence is not bound to a passing Codex session span and current commit"
  ));
});

test("accepts a reread timestamp change only when the Project packet has the same local state", async () => {
  const { validateEvidence } = await import("../scripts/sixthstreet-evidence.mjs");
  const snapshot = evidenceSnapshot("run-2");
  const evidence = validEvidence("run-1");

  assert.equal(validateEvidence(snapshot, evidence, validationOptions).pass, true);
  evidence.projectActivation.workingTreeSha256 = "stale";
  assert.deepEqual(validateEvidence(snapshot, evidence, validationOptions), {
    pass: false,
    errors: ["Project activation local state does not match current snapshot"]
  });
});

test("rejects self-consistent but unbound terminal receipts", async () => {
  const { validateEvidence } = await import("../scripts/sixthstreet-evidence.mjs");
  const snapshot = evidenceSnapshot();

  const exactRunStaleState = validEvidence();
  exactRunStaleState.projectActivation.localHead = "stale-head";
  assert.ok(validateEvidence(snapshot, exactRunStaleState, validationOptions).errors.includes(
    "Project activation local state does not match current snapshot"
  ));

  const unrelatedA2File = validEvidence();
  unrelatedA2File.attempts[1].evidenceRef = "tests/fixtures/sixthstreet-state-input.json; commit head-1";
  assert.ok(validateEvidence(snapshot, unrelatedA2File, validationOptions).errors.includes(
    "attempt a2 A2 evidence is not bound to a real Codex session span and current commit"
  ));

  const staleA2Commit = validEvidence();
  staleA2Commit.attempts[1].evidenceRef = "codex-session session.jsonl#L2-L4; commit old-head";
  assert.ok(validateEvidence(snapshot, staleA2Commit, validationOptions).errors.includes(
    "attempt a2 A2 evidence is not bound to a real Codex session span and current commit"
  ));

  const replayedA2Span = validEvidence();
  replayedA2Span.attempts[1].evidenceRef = "codex-session stale-session.jsonl#L2-L4; commit head-1";
  assert.ok(validateEvidence(snapshot, replayedA2Span, validationOptions).errors.includes(
    "attempt a2 A2 evidence is not bound to a real Codex session span and current commit"
  ));

  const urlOnlyB1 = validEvidence();
  urlOnlyB1.attempts[2].evidenceRef = "https://chatgpt.com/c/b1-exchange";
  assert.ok(validateEvidence(snapshot, urlOnlyB1, validationOptions).errors.includes(
    "attempt b1 B1 evidence is not bound to a ChatGPT working exchange and exported content"
  ));

  const arbitrarySheetHashes = validEvidence();
  arbitrarySheetHashes.writebacks[0].items[0].expectedSha256 = "self-matching";
  arbitrarySheetHashes.writebacks[0].items[0].rereadSha256 = "self-matching";
  assert.ok(validateEvidence(snapshot, arbitrarySheetHashes, validationOptions).errors.includes(
    "Sheet write/reread mismatch: sheet:Sixthstreet Prep!D22"
  ));

  const missingSheetTarget = validEvidence();
  missingSheetTarget.writebacks[0].items = missingSheetTarget.writebacks[0].items.slice(1);
  assert.ok(validateEvidence(snapshot, missingSheetTarget, validationOptions).errors.includes(
    "Sheet write/reread target missing: sheet:Sixthstreet Prep!D22"
  ));

  const staleGitHubReceipt = validEvidence();
  staleGitHubReceipt.writebacks[1].target = "alvinwin/imagination#25";
  assert.ok(validateEvidence(snapshot, staleGitHubReceipt, validationOptions).errors.includes(
    "GitHub write/reread receipt does not match the live issue target and body"
  ));
});
