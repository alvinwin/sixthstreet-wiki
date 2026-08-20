import test from 'node:test';
import assert from 'node:assert/strict';
import { importDABossCharacterTrends } from '../scripts/import-da-boss-character-trends.mjs';
import { validateDABossCharacterTrends } from '../src/validate-da-boss-character-trends.js';

const descriptor = (name, sha) => ({ sourceRevision: 'a'.repeat(40), sourceSha256: sha, sourceFile: name, retrievedAt: '2026-08-19T12:00:00Z', version: '3.1', phase: 'Phase 1' });
const provenance = name => ({ sourceRevision: 'a'.repeat(40), sourceSha256: 'b'.repeat(64), sourceFile: name, sourceUrl: `https://example.test/blob/a/${name}`, retrievedAt: '2026-08-19T12:00:00Z' });

function validData() {
  return {
    schemaVersion: '1.0',
    cohortLabel: 'Observed submitted/public-profile clears',
    methodology: { inclusion: 'Descriptive aggregate only; no recommendations.', exclusions: ['Incomplete three-character teams are excluded.'], suppressionThreshold: 10 },
    bosses: [{
      canonicalId: 'boss-1', displayName: 'Boss One', currentSourceName: 'Boss Current', status: 'live',
      comparison: { kind: 'previous-observed-appearance', priorVersion: '3.1', priorPhase: 'Phase 1', currentVersion: '3.2', currentPhase: 'Phase 2' },
      phases: [
        { version: '3.1', phase: 'Phase 1', provenance: provenance('prior.csv'), inputRows: 10, excludedRows: 0, sampleSize: 10, characters: [{ name: 'Anby', clearCount: 8, appearanceRate: 0.8, priorAppearanceChange: null }] },
        { version: '3.2', phase: 'Phase 2', provenance: provenance('current.csv'), inputRows: 10, excludedRows: 0, sampleSize: 10, characters: [{ name: 'Anby', clearCount: 9, appearanceRate: 0.9, priorAppearanceChange: 0.09999999999999998 }, { name: 'Billy', clearCount: 4, appearanceRate: 0.4, priorAppearanceChange: 0.4 }] },
      ],
    }],
  };
}

const hasError = (data, text) => validateDABossCharacterTrends(data).some(error => error.includes(text));

test('accepts exact two-phase collection with provenance and arithmetic', () => {
  assert.deepEqual(validateDABossCharacterTrends(validData()), []);
});

test('rejects duplicate bosses, wrong phase order, malformed provenance, and recommendation fields', () => {
  const data = validData();
  data.bosses.push(structuredClone(data.bosses[0]));
  assert.equal(hasError(data, 'canonicalId must be unique'), true);
  const single = validData();
  single.bosses[0].phases.reverse();
  assert.equal(hasError(single, 'must match comparison priorVersion'), true);
  const provenanceBad = validData();
  provenanceBad.bosses[0].phases[0].provenance.sourceSha256 = 'bad';
  assert.equal(hasError(provenanceBad, '64-hex SHA256'), true);
  const missingSourceUrl = validData();
  delete missingSourceUrl.bosses[0].phases[0].provenance.sourceUrl;
  assert.equal(hasError(missingSourceUrl, 'sourceUrl must be a valid HTTP(S) URL'), true);
  const invalidSourceUrl = validData();
  invalidSourceUrl.bosses[0].phases[0].provenance.sourceUrl = 'ftp://example.test/prior.csv';
  assert.equal(hasError(invalidSourceUrl, 'sourceUrl must be a valid HTTP(S) URL'), true);
  const recommendation = validData();
  recommendation.methodology.recommendations = ['use Anby'];
  assert.equal(hasError(recommendation, 'unknown key recommendations'), true);
});

test('rejects UID leakage, arithmetic drift, unsorted characters, and missing incomplete-team wording', () => {
  const data = validData();
  data.bosses[0].phases[1].provenance.uid = 'must-not-leak';
  data.bosses[0].phases[1].characters[0].priorAppearanceChange = 0;
  data.bosses[0].phases[1].characters.reverse();
  data.methodology.exclusions = ['Rows omitted.'];
  assert.equal(hasError(data, 'must not contain a uid key'), true);
  assert.equal(hasError(data, 'priorAppearanceChange must equal'), true);
  assert.equal(hasError(data, 'sorted by clearCount'), true);
  assert.equal(hasError(data, 'incomplete three-character teams'), true);
});

test('requires suppression when either phase is below threshold and allows zero samples', () => {
  const data = validData();
  data.bosses[0].status = 'live';
  data.bosses[0].phases[0].sampleSize = 0;
  data.bosses[0].phases[0].inputRows = 2;
  data.bosses[0].phases[0].excludedRows = 2;
  data.bosses[0].phases[0].characters = [];
  assert.equal(hasError(data, 'status must be suppressed'), true);
});
