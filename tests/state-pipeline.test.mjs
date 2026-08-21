import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const root = resolve(new URL("..", import.meta.url).pathname);
const stateScript = resolve(root, "scripts", "sixthstreet-state.py");
const fixture = resolve(root, "tests", "fixtures", "sixthstreet-state-input.json");
const fixtureEnv = { ...process.env, SIXTHSTREET_ALLOW_FIXTURE: "1" };

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

  assert.equal(snapshot.schemaVersion, 1);
  assert.deepEqual(snapshot.invariants.map(({ id }) => id), ["A1", "A2", "B1"]);
  assert.equal(snapshot.task.canonicalRef, "sheet:Sixthstreet Prep!A22:H22");
  assert.match(snapshot.task.terminalGate.value, /A1 A2 and B1/);
  assert.ok(snapshot.sources.sheet.cells.every((cell) => cell.ref && cell.sha256));
  assert.ok(snapshot.checks.every((check) => check.status === "pass"));
  assert.equal(snapshot.decision.status, "preserve-unresolved");
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
  assert.match(prompts.challenge, /Try to disprove/);
  assert.match(prompts["terminal-audit"], /actual A1\/A2\/B1 terminal boundary/);
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
    evidence: ["evidence.json passes structural validation but remains a claimed bundle."]
  };

  assert.doesNotThrow(() => validateResult(result, "reconcile"));
});

test("fails deterministic evidence validation when a receipt is missing or stale", async () => {
  const { validateEvidence } = await import("../scripts/sixthstreet-evidence.mjs");
  const snapshot = {
    runId: "run-1",
    projectDelivery: { requiredSources: [{ name: "contract.md", sha256: "abc" }] },
    sources: { localGit: { head: "head-1", workingTreeSha256: "tree-1" } }
  };
  const evidence = {
    projectActivation: {
      status: "pass",
      chatUrl: "https://chatgpt.com/c/test",
      packetRunId: "run-1",
      localHead: "head-1",
      workingTreeSha256: "tree-1",
      instructionsReadback: true,
      stableSources: [{ name: "contract.md", sha256: "abc" }]
    },
    attempts: [
      { id: "a1", invariant: "A1", scenario: "activation", startingCondition: "stale input", observedBehavior: "reconciled", result: "pass", evidenceRef: "chat:a1" },
      { id: "a2", invariant: "A2", scenario: "continuation", startingCondition: "substep done", observedBehavior: "continued", result: "pass", evidenceRef: "run:a2" },
      { id: "b1", invariant: "B1", scenario: "pseudo-convergence", startingCondition: "peer agreement", observedBehavior: "preserved owner choice", result: "pass", evidenceRef: "chat:b1" }
    ],
    repositoryChecks: { status: "pass", localHead: "head-1", workingTreeSha256: "tree-1" },
    writebacks: [
      { surface: "sheet", status: "pass", expectedSha256: "s", rereadSha256: "s" },
      { surface: "github", status: "pass", expectedSha256: "g", rereadSha256: "g" }
    ]
  };

  assert.equal(validateEvidence(snapshot, evidence).pass, true);
  evidence.repositoryChecks.workingTreeSha256 = "stale";
  assert.deepEqual(validateEvidence(snapshot, evidence), {
    pass: false,
    errors: ["repository-check working tree does not match current snapshot"]
  });
});

test("accepts a reread timestamp change only when the Project packet has the same local state", async () => {
  const { validateEvidence } = await import("../scripts/sixthstreet-evidence.mjs");
  const snapshot = {
    runId: "run-2",
    projectDelivery: { requiredSources: [{ name: "contract.md", sha256: "abc" }] },
    sources: { localGit: { head: "head-1", workingTreeSha256: "tree-1" } }
  };
  const evidence = {
    projectActivation: {
      status: "pass",
      chatUrl: "https://chatgpt.com/c/test",
      packetRunId: "run-1",
      localHead: "head-1",
      workingTreeSha256: "tree-1",
      instructionsReadback: true,
      stableSources: [{ name: "contract.md", sha256: "abc" }]
    },
    attempts: [
      { id: "a1", invariant: "A1", scenario: "activation", startingCondition: "stale input", observedBehavior: "reconciled", result: "pass", evidenceRef: "chat:a1" },
      { id: "a2", invariant: "A2", scenario: "continuation", startingCondition: "substep done", observedBehavior: "continued", result: "pass", evidenceRef: "run:a2" },
      { id: "b1", invariant: "B1", scenario: "pseudo-convergence", startingCondition: "peer agreement", observedBehavior: "preserved owner choice", result: "pass", evidenceRef: "chat:b1" }
    ],
    repositoryChecks: { status: "pass", localHead: "head-1", workingTreeSha256: "tree-1" },
    writebacks: [
      { surface: "sheet", status: "pass", expectedSha256: "s", rereadSha256: "s" },
      { surface: "github", status: "pass", expectedSha256: "g", rereadSha256: "g" }
    ]
  };

  assert.equal(validateEvidence(snapshot, evidence).pass, true);
  evidence.projectActivation.workingTreeSha256 = "stale";
  assert.deepEqual(validateEvidence(snapshot, evidence), {
    pass: false,
    errors: ["Project activation packet does not match the current local state"]
  });
});
