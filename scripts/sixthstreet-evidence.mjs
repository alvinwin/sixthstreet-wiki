#!/usr/bin/env node

import { readFileSync } from "node:fs";
import process from "node:process";

function requiredSourceMap(snapshot) {
  return new Map(snapshot.projectDelivery.requiredSources.map(({ name, sha256 }) => [name, sha256]));
}

export function validateEvidence(snapshot, evidence) {
  const errors = [];
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return { pass: false, errors: ["evidence must be an object"] };
  }

  const project = evidence.projectActivation;
  if (project?.status !== "pass") errors.push("fresh Project activation receipt is missing or not pass");
  if (!project?.chatUrl?.startsWith("https://chatgpt.com/")) errors.push("Project activation chat URL is missing");
  const exactPacketRun = project?.packetRunId === snapshot.runId;
  const samePacketState =
    project?.localHead === snapshot.sources.localGit.head &&
    project?.workingTreeSha256 === snapshot.sources.localGit.workingTreeSha256;
  if (!exactPacketRun && !samePacketState) {
    errors.push("Project activation packet does not match the current local state");
  }
  if (project?.instructionsReadback !== true) errors.push("Project instructions readback is not proven");
  const expectedSources = requiredSourceMap(snapshot);
  const observedSources = new Map((project?.stableSources ?? []).map(({ name, sha256 }) => [name, sha256]));
  for (const [name, sha256] of expectedSources) {
    if (observedSources.get(name) !== sha256) errors.push(`Project source mismatch: ${name}`);
  }

  const attempts = Array.isArray(evidence.attempts) ? evidence.attempts : [];
  if (new Set(attempts.map(({ id }) => id)).size < 3) errors.push("fewer than three distinct representative attempts");
  for (const invariant of ["A1", "A2", "B1"]) {
    if (!attempts.some((attempt) => attempt.invariant === invariant && attempt.result === "pass")) {
      errors.push(`missing passing representative attempt for ${invariant}`);
    }
  }
  for (const attempt of attempts) {
    for (const key of ["id", "invariant", "scenario", "startingCondition", "observedBehavior", "result", "evidenceRef"]) {
      if (typeof attempt[key] !== "string" || !attempt[key].trim()) errors.push(`attempt ${attempt.id ?? "unknown"} is missing ${key}`);
    }
  }

  const checks = evidence.repositoryChecks;
  if (checks?.status !== "pass") errors.push("repository acceptance receipt is missing or not pass");
  if (checks?.localHead !== snapshot.sources.localGit.head) errors.push("repository-check head does not match current snapshot");
  if (checks?.workingTreeSha256 !== snapshot.sources.localGit.workingTreeSha256) {
    errors.push("repository-check working tree does not match current snapshot");
  }

  const writebacks = Array.isArray(evidence.writebacks) ? evidence.writebacks : [];
  for (const surface of ["sheet", "github"]) {
    if (!writebacks.some((item) => item.surface === surface && item.status === "pass" && item.expectedSha256 === item.rereadSha256)) {
      errors.push(`missing matching ${surface} write/reread receipt`);
    }
  }

  return { pass: errors.length === 0, errors };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [snapshotPath, evidencePath] = process.argv.slice(2);
  if (!snapshotPath || !evidencePath) {
    process.stderr.write("usage: sixthstreet-evidence.mjs SNAPSHOT EVIDENCE\n");
    process.exit(2);
  }
  const result = validateEvidence(
    JSON.parse(readFileSync(snapshotPath, "utf8")),
    JSON.parse(readFileSync(evidencePath, "utf8"))
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.pass ? 0 : 1);
}
