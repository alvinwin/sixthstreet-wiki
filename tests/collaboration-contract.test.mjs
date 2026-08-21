import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(name) {
  return readFile(new URL(name, root), "utf8");
}

test("keeps the P0 ledger limited to repeatedly corroborated active blockers", async () => {
  const ledger = await read("Sixth-Street-P0-friction-ledger.md");
  const sections = ledger.split(/^## P0-/m).slice(1);

  assert.equal(sections.length, 2, "the recent evidence admits exactly two active P0 contracts");

  for (const section of sections) {
    assert.match(section, /### Independent incident A/);
    assert.match(section, /### Independent incident B/);
    assert.match(section, /falsification/i);
    assert.match(section, /\*\*Act:\*\*/);
    assert.match(section, /\*\*Bound:\*\*/);
  }

  assert.match(ledger, /three persistent attempts are\s+strong trend evidence/i);
  assert.match(ledger, /not a\s+universal rule/i);
  assert.match(ledger, /### A1 — authoritative activation/);
  assert.match(ledger, /### A2 — terminal continuation/);
  assert.match(ledger, /## P0-B: settle consequential decisions/);
  assert.match(ledger, /one entry point generates a source-referenced read model/i);
  assert.match(ledger, /not a new authority, project tracker, resurrected triage framework/i);
});

test("keeps Project startup stable and routes moving state to live owners", async () => {
  const [brief, sourceMap] = await Promise.all([
    read("Sixth-Street-project-brief-current.md"),
    read("Sixth-Street-source-map-current.md")
  ]);

  for (const source of [
    "Sixth-Street-project-brief-current.md",
    "Sixth-Street-collaboration-contract-current.md",
    "Sixth-Street-P0-friction-ledger.md"
  ]) {
    assert.match(sourceMap, new RegExp(source.replaceAll(".", "\\.")));
  }

  assert.match(brief, /AI Project Runway Sheet and GitHub/i);
  assert.match(brief, /Codex-local files, Git state, tests, and renders as unknown/i);
  assert.doesNotMatch(brief, /current priority is/i);
  assert.doesNotMatch(brief, /PR\s*#\d+/i);
  assert.doesNotMatch(brief, /[a-f0-9]{40}/i);
  assert.match(await read("AGENTS.md"), /npm run sixthstreet:run/);
  assert.match(await read("AGENTS.md"), /not a\s+general-purpose task executor/i);
});

test("encodes positive actions with narrow bounds and rejects circular authority", async () => {
  const [agents, contract, brief] = await Promise.all([
    read("AGENTS.md"),
    read("Sixth-Street-collaboration-contract-current.md"),
    read("Sixth-Street-project-brief-current.md")
  ]);
  const combined = `${agents}\n${contract}\n${brief}`;

  assert.doesNotMatch(combined, /ChatGPT web owns the independent taste gate/i);
  assert.doesNotMatch(combined, /accepted taste reviews as binding/i);
  assert.match(combined, /ChatGPT proposal.*Codex implementation.*ChatGPT fidelity/s);
  assert.match(combined, /circular approval/i);

  const actCount = (contract.match(/\*\*Act:\*\*/g) ?? []).length;
  const boundCount = (contract.match(/\*\*Bound:\*\*/g) ?? []).length;
  assert.ok(actCount >= 6, "the contract should lead with operative behavior");
  assert.equal(boundCount, actCount, "each operative action should have a narrow bound");
});
