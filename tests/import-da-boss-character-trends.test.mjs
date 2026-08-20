import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { CSV_HEADER, importDABossCharacterTrends } from '../scripts/import-da-boss-character-trends.mjs';

const row = (uid, boss, ch1, ch2, ch3) => `${uid},1,3,100,${boss},none,${ch1},1,${ch2},2,${ch3},3,Butler,10%`;
const currentCsv = `${CSV_HEADER}\n${row('c1', 'Current Alpha', 'Anby', 'Billy', 'Corin')}\n${row('c2', 'Current Alpha', 'Anby', 'Billy', 'Corin')}\n${row('c3', 'Current Beta', 'Anby', 'Billy', 'Nekomata')}\n${row('c4', 'Current Beta', 'Anby', 'Billy', 'Nekomata')}\n`;
const priorAlphaCsv = `${CSV_HEADER}\n${row('a1', 'Prior Alpha', 'Anby', 'Billy', 'Anby')}\n${row('a2', 'Prior Alpha', 'Anby', 'Billy', 'Billy')}\n`;
const priorBetaCsv = `${CSV_HEADER}\n${row('b1', 'Prior Beta', 'Anby', 'Billy', 'Nekomata')}\n${row('b2', 'Prior Beta', 'Anby', 'Billy', 'Nekomata')}\n`;

function descriptor(input, sourceFile, version, phase, revision, sourceUrl = `https://example.test/blob/${revision}/${sourceFile}`) {
  const sourceSha256 = createHash('sha256').update(input).digest('hex');
  return { input, sourceFile, sourceUrl, sourceRevision: revision, sourceSha256, retrievedAt: '2026-08-19T12:00:00Z', version, phase };
}

const current = descriptor(currentCsv, 'current.csv', '3.2', 'Phase 2', 'a'.repeat(40));
const priorAlpha = descriptor(priorAlphaCsv, 'prior-alpha.csv', '3.1', 'Phase 1', 'b'.repeat(40));
const priorBeta = descriptor(priorBetaCsv, 'prior-beta.csv', '3.1', 'Phase 1', 'c'.repeat(40));
const options = {
  current,
  suppressionThreshold: 1,
  bosses: [
    { canonicalId: 'alpha', displayName: 'Alpha', currentSourceName: 'Current Alpha', prior: { ...priorAlpha, sourceName: 'Prior Alpha' } },
    { canonicalId: 'beta', displayName: 'Beta', currentSourceName: 'Current Beta', prior: { ...priorBeta, sourceName: 'Prior Beta' } },
  ],
};

test('imports two bosses with phase-local provenance, prior name changes, and exact deltas', () => {
  const data = importDABossCharacterTrends(options);
  assert.equal(data.bosses.length, 2);
  assert.deepEqual(data.bosses[0].phases.map(phase => phase.provenance.sourceSha256), [priorAlpha.sourceSha256, current.sourceSha256]);
  assert.equal(data.bosses[0].phases[0].provenance.sourceFile, 'prior-alpha.csv');
  assert.equal(data.bosses[0].phases[0].provenance.sourceUrl, priorAlpha.sourceUrl);
  assert.equal(data.bosses[0].currentSourceName, 'Current Alpha');
  assert.equal(data.bosses[0].comparison.kind, 'previous-observed-appearance');
  const alphaCurrent = data.bosses[0].phases[1].characters;
  assert.equal(alphaCurrent.find(character => character.name === 'Corin').priorAppearanceChange, 1);
  assert.equal(alphaCurrent.find(character => character.name === 'Anby').priorAppearanceChange, 0);
  assert.equal(JSON.stringify(data).includes('uid'), false);
});

test('rejects duplicate mappings, unmapped current bosses, absent prior bosses, and bad pins', () => {
  assert.throws(() => importDABossCharacterTrends({ ...options, bosses: [options.bosses[0], { ...options.bosses[1], canonicalId: 'alpha' }] }), /duplicate canonicalId/);
  assert.throws(() => importDABossCharacterTrends({ ...options, bosses: [options.bosses[0]] }), /unmapped current boss/);
  assert.throws(() => importDABossCharacterTrends({ ...options, bosses: [{ ...options.bosses[0], prior: { ...priorAlpha, sourceName: 'Missing' } }, options.bosses[1]] }), /boss not found/);
  assert.throws(() => importDABossCharacterTrends({ ...options, current: { ...current, sourceSha256: 'd'.repeat(64) } }), /does not match/);
  assert.throws(() => importDABossCharacterTrends({ ...options, current: { ...current, sourceRevision: 'bad' } }), /40-hex/);
  assert.throws(() => importDABossCharacterTrends({ ...options, current: { ...current, sourceUrl: undefined } }), /sourceUrl.*HTTP\(S\)/);
  assert.throws(() => importDABossCharacterTrends({ ...options, current: { ...current, sourceUrl: 'ftp://example.test/current.csv' } }), /sourceUrl.*HTTP\(S\)/);
  const drifted = currentCsv.replace(CSV_HEADER, `${CSV_HEADER},extra`);
  assert.throws(() => importDABossCharacterTrends({ ...options, current: descriptor(drifted, 'current.csv', '3.2', 'Phase 2', 'a'.repeat(40)) }), /header must exactly/);
});

test('counts incomplete teams as exclusions and suppresses all output below threshold', () => {
  const incomplete = currentCsv.replace(`${row('c2', 'Current Alpha', 'Anby', 'Billy', 'Corin')}\n`, `${row('c2', 'Current Alpha', 'Anby', 'Billy', '')}\n`);
  const changedCurrent = descriptor(incomplete, 'current.csv', '3.2', 'Phase 2', 'a'.repeat(40));
  const data = importDABossCharacterTrends({ ...options, current: changedCurrent, suppressionThreshold: 3 });
  const alpha = data.bosses[0];
  assert.equal(alpha.status, 'suppressed');
  assert.equal(alpha.phases[1].inputRows, 2);
  assert.equal(alpha.phases[1].excludedRows, 1);
  assert.equal(alpha.phases[1].sampleSize, 1);
  assert.deepEqual(alpha.phases.flatMap(phase => phase.characters), []);
});

test('rejects malformed included rows', () => {
  const malformed = currentCsv.replace(`${row('c1', 'Current Alpha', 'Anby', 'Billy', 'Corin')}`, `${row('c1', 'Current Alpha', 'Anby', 'Billy', 'Corin').replace(',100,', ',bad,')}`);
  assert.throws(() => importDABossCharacterTrends({ ...options, current: descriptor(malformed, 'current.csv', '3.2', 'Phase 2', 'a'.repeat(40)) }), /score must be numeric/);
});
