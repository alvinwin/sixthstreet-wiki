#!/usr/bin/env node

import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { isAbsolute, relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(new URL("..", import.meta.url).pathname);

function requiredSourceMap(snapshot) {
  return new Map(snapshot.projectDelivery.requiredSources.map(({ name, sha256 }) => [name, sha256]));
}

function fileInside(directory, path) {
  if (!existsSync(directory)) return null;
  const candidate = isAbsolute(path) ? resolve(path) : resolve(directory, path);
  if (!existsSync(candidate) || !statSync(candidate).isFile()) return null;
  const realDirectory = realpathSync(directory);
  const realCandidate = realpathSync(candidate);
  const offset = relative(realDirectory, realCandidate);
  if (!offset || offset.startsWith("..") || isAbsolute(offset)) return null;
  return realCandidate;
}

function hasCodexContinuationSpan(token, sessionRoot, currentHead) {
  const match = token.match(/^codex-session (.+\.jsonl)#L(\d+)-L(\d+)$/);
  if (!match) return false;
  const path = fileInside(sessionRoot, match[1]);
  if (!path) return false;

  const lines = readFileSync(path, "utf8").trimEnd().split(/\r?\n/);
  const start = Number(match[2]);
  const end = Number(match[3]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end <= start || end > lines.length) {
    return false;
  }

  try {
    const metadata = JSON.parse(lines[0]);
    if (
      metadata.type !== "session_meta" ||
      typeof metadata.payload?.id !== "string" ||
      metadata.payload?.git?.commit_hash !== currentHead
    ) return false;
    lines.slice(start - 1, end).forEach((line) => JSON.parse(line));
    return true;
  } catch {
    return false;
  }
}

function hasPassingRepositoryCheckSpan(token, sessionRoot, currentHead) {
  const match = token.match(/^codex-session (.+\.jsonl)#L(\d+)-L(\d+)$/);
  if (!match) return false;
  const path = fileInside(sessionRoot, match[1]);
  if (!path) return false;

  const lines = readFileSync(path, "utf8").trimEnd().split(/\r?\n/);
  const start = Number(match[2]);
  const end = Number(match[3]);
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 1 || end <= start || end > lines.length) {
    return false;
  }

  try {
    const metadata = JSON.parse(lines[0]);
    if (
      metadata.type !== "session_meta" ||
      typeof metadata.payload?.id !== "string" ||
      metadata.payload?.git?.commit_hash !== currentHead
    ) return false;

    const items = lines.slice(start - 1, end).map((line) => JSON.parse(line));
    const call = items.find((item) =>
      item.type === "response_item" &&
      item.payload?.type === "custom_tool_call" &&
      item.payload?.name === "exec" &&
      /(?:cmd|["']cmd["'])\s*:\s*\\?["']npm run check\\?["']/.test(item.payload?.input ?? "")
    );
    if (!call?.payload?.call_id) return false;
    const output = items.find((item) =>
      item.type === "response_item" &&
      item.payload?.type === "custom_tool_call_output" &&
      item.payload?.call_id === call.payload.call_id
    );
    return Boolean(output && /\\?"exit_code\\?":0/.test(JSON.stringify(output.payload.output)));
  } catch {
    return false;
  }
}

function hasChatGptExchange(token, exchangeRoot) {
  const match = token.match(/^chatgpt-exchange (.+)$/);
  if (!match) return false;
  const path = fileInside(exchangeRoot, match[1]);
  return Boolean(path && readFileSync(path, "utf8").trim());
}

export function validateEvidence(snapshot, evidence, options = {}) {
  const errors = [];
  const codexSessionRoot = options.codexSessionRoot ?? resolve(homedir(), ".codex", "sessions");
  const exchangeRoot = options.exchangeRoot ?? resolve(root, ".sixthstreet-state", "attempts");
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return { pass: false, errors: ["evidence must be an object"] };
  }

  const project = evidence.projectActivation;
  if (project?.status !== "pass") errors.push("fresh Project activation receipt is missing or not pass");
  if (!project?.chatUrl?.startsWith("https://chatgpt.com/")) errors.push("Project activation chat URL is missing");
  if (typeof project?.packetRunId !== "string" || !project.packetRunId.trim()) {
    errors.push("Project activation packet run is missing");
  }
  const samePacketState =
    project?.localHead === snapshot.sources.localGit.head &&
    project?.workingTreeSha256 === snapshot.sources.localGit.workingTreeSha256;
  if (!samePacketState) errors.push("Project activation local state does not match current snapshot");
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
    const evidenceRef = typeof attempt.evidenceRef === "string" ? attempt.evidenceRef : "";
    const tokens = evidenceRef.split(";").map((token) => token.trim()).filter(Boolean);
    const hasChat = tokens.some((token) => /^https:\/\/chatgpt\.com\/(?:[^?#]+\/)?c\/[^/?#]+/.test(token));
    const hasCodexSpan = tokens.some((token) => hasCodexContinuationSpan(token, codexSessionRoot, snapshot.sources.localGit.head));
    const hasExchange = tokens.some((token) => hasChatGptExchange(token, exchangeRoot));
    const hasCurrentCommit = tokens.some((token) => token === `commit ${snapshot.sources.localGit.head}`);
    if (attempt.invariant === "A1" && evidenceRef !== project?.chatUrl) {
      errors.push(`attempt ${attempt.id} A1 evidence does not match the fresh Project activation chat`);
    }
    if (attempt.invariant === "A2" && (!hasCodexSpan || !hasCurrentCommit)) {
      errors.push(`attempt ${attempt.id} A2 evidence is not bound to a real Codex session span and current commit`);
    }
    if (attempt.invariant === "B1" && (!hasChat || !hasExchange)) {
      errors.push(`attempt ${attempt.id} B1 evidence is not bound to a ChatGPT working exchange and exported content`);
    }
  }

  const checks = evidence.repositoryChecks;
  if (checks?.status !== "pass") errors.push("repository acceptance receipt is missing or not pass");
  if (checks?.command !== "npm run check") errors.push("repository-check command is not the complete acceptance suite");
  if (checks?.localHead !== snapshot.sources.localGit.head) errors.push("repository-check head does not match current snapshot");
  if (checks?.workingTreeSha256 !== snapshot.sources.localGit.workingTreeSha256) {
    errors.push("repository-check working tree does not match current snapshot");
  }
  const checkTokens = typeof checks?.evidenceRef === "string"
    ? checks.evidenceRef.split(";").map((token) => token.trim()).filter(Boolean)
    : [];
  const hasPassingCheck = checkTokens.some((token) =>
    hasPassingRepositoryCheckSpan(token, codexSessionRoot, snapshot.sources.localGit.head)
  );
  const hasCheckCommit = checkTokens.some((token) => token === `commit ${snapshot.sources.localGit.head}`);
  if (!hasPassingCheck || !hasCheckCommit) {
    errors.push("repository-check evidence is not bound to a passing Codex session span and current commit");
  }

  const writebacks = Array.isArray(evidence.writebacks) ? evidence.writebacks : [];
  const sheetReceipt = writebacks.find((item) => item.surface === "sheet" && item.status === "pass");
  const sheetItems = Array.isArray(sheetReceipt?.items) ? sheetReceipt.items : [];
  const sheetCells = new Map(snapshot.sources.sheet.cells.map(({ ref, sha256 }) => [ref, sha256]));
  if (!sheetItems.length) {
    errors.push("missing exact Sheet write/reread items");
  } else {
    for (const item of sheetItems) {
      const liveSha = sheetCells.get(item.ref);
      if (!liveSha || item.expectedSha256 !== liveSha || item.rereadSha256 !== liveSha) {
        errors.push(`Sheet write/reread mismatch: ${item.ref ?? "unknown"}`);
      }
    }
    for (const ref of ["sheet:Sixthstreet Prep!D22", "sheet:Sixthstreet Prep!H22"]) {
      if (!sheetItems.some((item) => item.ref === ref)) errors.push(`Sheet write/reread target missing: ${ref}`);
    }
  }

  const githubReceipt = writebacks.find((item) => item.surface === "github" && item.status === "pass");
  const githubTarget = `${snapshot.sources.github.repo}#${snapshot.sources.github.issue}`;
  if (
    githubReceipt?.target !== githubTarget ||
    githubReceipt?.expectedSha256 !== snapshot.sources.github.bodySha256 ||
    githubReceipt?.rereadSha256 !== snapshot.sources.github.bodySha256
  ) {
    errors.push("GitHub write/reread receipt does not match the live issue target and body");
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
