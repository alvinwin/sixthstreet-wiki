import test from 'node:test';
import assert from 'node:assert/strict';
import { validateDAData } from '../src/validate-da.js';

const NOW = new Date('2026-08-19T12:00:00.000Z');

function liveData() {
  return {
    status: 'live',
    window: { start: '2026-08-07T00:00:00.000Z', end: '2026-08-21T00:00:00.000Z' },
    checkedAt: '2026-08-19T11:00:00.000Z',
    hasAdversity: true,
    encounters: [
      { id: 'standard-1', category: 'standard', name: 'First', mechanics: 'Interrupt the charge.', mechanicReview: 'reviewed', weaknesses: ['Fire'], resistances: [] },
      { id: 'standard-2', category: 'standard', name: 'Second', mechanics: 'Watch the field.', mechanicReview: 'reviewed', weaknesses: [], resistances: ['Ice'] },
      { id: 'standard-3', category: 'standard', name: 'Third', mechanics: 'Break the shield.', mechanicReview: 'reviewed', weaknesses: ['Electric'], resistances: [] },
      { id: 'adversity-1', category: 'adversity', name: 'Adversity', mechanics: 'Survive the pressure.', mechanicReview: 'reviewed', weaknesses: ['Ether'], resistances: [] },
    ],
    buffs: ['Burst damage', 'Stun damage', 'Anomaly damage'],
    provenance: {
      sourceRepo: 'owner/repository',
      sourceSha: 'a'.repeat(40),
      upstreamSha: 'b'.repeat(40),
    },
  };
}

function hasError(data, text) {
  return validateDAData(data, { now: NOW }).some(error => error.includes(text));
}

test('accepts a current live payload', () => {
  assert.deepEqual(validateDAData(liveData(), { now: NOW }), []);
});

test('accepts awaiting-refresh with a status note', () => {
  assert.deepEqual(validateDAData({ status: 'awaiting-refresh', statusNote: 'Refresh required.' }, { now: NOW }), []);
});

test('rejects an expired live window', () => {
  const data = liveData();
  data.window.end = '2026-08-19T12:00:00.000Z';
  assert.equal(hasError(data, 'window.end must be in the future'), true);
});

test('rejects stale checkedAt', () => {
  const data = liveData();
  data.checkedAt = '2026-08-05T11:00:00.000Z';
  assert.equal(hasError(data, 'no older than 14 days'), true);
});

test('rejects empty and incorrect encounter cardinality', () => {
  const empty = liveData();
  empty.encounters = [];
  assert.equal(hasError(empty, 'exactly 3 standard encounters'), true);
  assert.equal(hasError(empty, 'exactly 1 adversity'), true);

  const incorrect = liveData();
  incorrect.encounters.pop();
  assert.equal(hasError(incorrect, 'exactly 1 adversity'), true);
});

test('rejects missing immutable provenance', () => {
  const data = liveData();
  delete data.provenance.sourceSha;
  delete data.provenance.upstreamSha;
  assert.equal(hasError(data, 'sourceSha must be a 40-hex SHA'), true);
  assert.equal(hasError(data, 'upstreamSha must be a 40-hex SHA'), true);
});

test('rejects an unreviewed mechanic', () => {
  const data = liveData();
  data.encounters[0].mechanicReview = 'pending';
  assert.equal(hasError(data, 'mechanicReview must be reviewed'), true);
});

test('rejects unknown statuses', () => {
  assert.equal(hasError({ status: 'draft' }, 'status must be live or awaiting-refresh'), true);
});
