import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRemaining, normalizedEndsAt } from '../src/remaining-time.js';

const NOW = Date.parse('2026-08-20T12:00:00.000Z');

test('formats time remaining across day, hour, and minute boundaries', () => {
  assert.equal(formatRemaining('2026-08-22T16:00:00.000Z', NOW).text, '2d 4h remaining');
  assert.equal(formatRemaining('2026-08-20T16:15:00.000Z', NOW).text, '4h 15m remaining');
  assert.equal(formatRemaining('2026-08-20T12:42:00.000Z', NOW).text, '42m remaining');
});

test('fails closed at expiry and for invalid input', () => {
  assert.deepEqual(formatRemaining('2026-08-20T12:00:00.000Z', NOW), { state: 'pending', text: 'Refresh pending' });
  assert.deepEqual(formatRemaining('not-a-date', NOW), { state: 'unavailable', text: 'Status unavailable' });
  assert.deepEqual(formatRemaining('2026-02-31T00:00:00.000Z', NOW), { state: 'unavailable', text: 'Status unavailable' });
});

test('normalizes date-only source cutovers to explicit UTC instants', () => {
  assert.equal(normalizedEndsAt('2026-08-21'), '2026-08-21T00:00:00.000Z');
  assert.equal(normalizedEndsAt('2026-08-28T00:00:00.000Z'), '2026-08-28T00:00:00.000Z');
  assert.equal(normalizedEndsAt('not-a-date'), null);
  assert.equal(normalizedEndsAt('2026-02-31'), null);
  assert.equal(normalizedEndsAt('2026-02-31T00:00:00.000Z'), null);
});
