import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { findOrphanedSlugs, renderTerm, validate } from '../scripts/build-terms.mjs';

const appRoot = resolve(import.meta.dirname, '..');

test('term data is source-backed and current page output is exact', async () => {
  const data = JSON.parse(await readFile(resolve(appRoot, 'data/terms.json'), 'utf8'));
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.terms.length, 5);
  const term = data.terms[0];
  assert.equal(term.slug, 'attribute-anomaly');
  assert.equal(term.checkedOn, '2026-08-20');
  assert.ok(term.sources.length >= 2);
  assert.ok(term.sources.every(source => /^https:\/\//.test(source.url)));
  assert.ok(term.hub.applicationRules.some(rule => /ICD/.test(rule.name)));
  assert.ok(term.hub.effects.some(effect => effect.attribute === 'Wind'));
  execFileSync(process.execPath, ['scripts/build-terms.mjs', '--check'], { cwd: appRoot, stdio: 'pipe' });
});

test('homepage consumes the term route', async () => {
  const home = await readFile(resolve(appRoot, 'index.html'), 'utf8');
  assert.match(home, /href="terms\/attribute-anomaly\/"/);
  assert.match(home, />Read Attribute Anomaly <span aria-hidden="true">→<\/span>/);
});

test('generated term page has stable navigation, headings, and source URLs', async () => {
  const page = await readFile(resolve(appRoot, 'terms/attribute-anomaly/index.html'), 'utf8');
  assert.match(page, /href="\.\.\/\.\.\/styles\.css"/);
  assert.match(page, /href="\.\.\/\.\.\/terms\.css"/);
  assert.match(page, /href="\.\.\/\.\.\/" aria-label="sixthstreet\.wiki home"/);
  assert.match(page, /<h1>Attribute Anomaly<\/h1>/);
  assert.match(page, /<h2 id="meaning-title">How it works<\/h2>/);
  assert.match(page, /<h2 id="sources-title">Sources and scope<\/h2>/);
  assert.match(page, /<h2 id="distinction-title">Buildup is not the trigger<\/h2>/);
  assert.match(page, /href="#related"|id="related"/);
  assert.match(page, /8 linked sources checked/);
  assert.match(page, /id="effects"/);
  assert.match(page, /id="application"/);
  assert.match(page, /id="interactions"/);
  assert.match(page, /id="formula"/);
  assert.match(page, /ICD — internal cooldown/);
  assert.match(page, /current v3\.1 regression test is still needed/);
  assert.match(page, /Base Anomaly DMG × \(AP × 0\.01\)/);
  assert.doesNotMatch(page, /there are five attributes/i);
  assert.ok((page.match(/https:\/\//g) ?? []).length >= 8);
  for (const slug of ['disorder', 'abloom', 'polarized-assault', 'polarity-disorder']) {
    const relatedPage = await readFile(resolve(appRoot, 'terms', slug, 'index.html'), 'utf8');
    assert.match(relatedPage, /href="\.\.\/attribute-anomaly\/"|href="\.\.\/disorder\/"/);
  }
});

test('term validation fails closed on malformed nested content', () => {
  const base = {
    schemaVersion: 2,
    terms: [{
      slug: 'example', title: 'Example', summary: 'Summary', whyItMatters: 'Why', distinctionTitle: 'Difference', distinction: 'Distinct',
      checkedOn: '2026-08-19', freshnessNote: 'Freshness', steps: ['One', 'Two'],
      statNotes: [{ name: 'Stat', description: 'Description' }],
      related: [{ slug: 'related', name: 'Related', description: 'Description' }],
      sources: [
        { label: 'One', publisher: 'HoYoLAB', sourceType: 'Article', scope: 'Scope', url: 'https://www.hoyolab.com/article/1' },
        { label: 'Two', publisher: 'HoYoLAB', sourceType: 'Article', scope: 'Scope', url: 'https://www.hoyolab.com/article/2' },
      ],
    }],
  };
  for (const mutate of [
    data => { data.terms[0].steps[0] = { unsafe: true }; },
    data => { delete data.terms[0].statNotes[0].name; },
    data => { data.terms[0].related[0].slug = 'Not URL Safe'; },
    data => { data.terms[0].related.push({ ...data.terms[0].related[0] }); },
    data => { data.terms[0].related[0].slug = 'example'; },
    data => { data.terms[0].sources[1].url = data.terms[0].sources[0].url; },
    data => { data.terms[0].related[0].description = 7; },
    data => { data.terms[0].sources[0].label = {}; },
  ]) {
    const data = structuredClone(base);
    mutate(data);
    assert.throws(() => validate(data), /term data validation failed/);
  }
});

test('hub validation fails closed on missing or malformed mechanics modules', () => {
  const base = {
    schemaVersion: 2,
    terms: [{
      slug: 'example', title: 'Example', summary: 'Summary', whyItMatters: 'Why', distinctionTitle: 'Difference', distinction: 'Distinct',
      checkedOn: '2026-08-20', freshnessNote: 'Freshness', steps: ['One', 'Two'],
      statNotes: [{ name: 'Stat', description: 'Description' }],
      related: [{ slug: 'related', name: 'Related', description: 'Description' }],
      sources: [
        { label: 'One', publisher: 'Publisher', sourceType: 'Article', scope: 'Scope', url: 'https://example.com/one' },
        { label: 'Two', publisher: 'Publisher', sourceType: 'Article', scope: 'Scope', url: 'https://example.com/two' },
      ],
      hub: {
        gauge: { label: 'Gauge', caption: 'Caption' },
        applicationRules: [{ name: 'Rule', status: 'Current', description: 'Description' }],
        effects: [{ attribute: 'Fire', effect: 'Burn', description: 'Description' }],
        interactions: [{ slug: 'related', name: 'Reaction', kind: 'Base system', description: 'Description' }],
        formulaNotes: [{ name: 'Map', formula: 'A × B', status: 'Open' }],
      },
    }],
  };
  assert.doesNotThrow(() => validate(structuredClone(base)));
  for (const mutate of [
    data => { data.terms[0].hub.effects = []; },
    data => { delete data.terms[0].hub.applicationRules[0].status; },
    data => { data.terms[0].hub.interactions[0].slug = 'Not URL Safe'; },
    data => { data.terms[0].hub.interactions[0].kind = 'Clever exception'; },
    data => { data.terms[0].hub.formulaNotes[0].formula = ''; },
  ]) {
    const data = structuredClone(base);
    mutate(data);
    assert.throws(() => validate(data), /term data validation failed/);
  }
});

test('generated related navigation appears only when the target term exists', () => {
  const source = { label: 'One', publisher: 'HoYoLAB', sourceType: 'Article', scope: 'Scope', url: 'https://www.hoyolab.com/article/1' };
  const term = {
    slug: 'example', title: 'Example', summary: 'Summary', whyItMatters: 'Why', distinctionTitle: 'Difference', distinction: 'Distinct',
    checkedOn: '2026-08-19', freshnessNote: 'Freshness', steps: ['One', 'Two'],
    statNotes: [{ name: 'Stat', description: 'Description' }], related: [{ slug: 'target', name: 'Target', description: 'Description' }],
    sources: [source, { ...source, label: 'Two', url: 'https://www.hoyolab.com/article/2' }],
  };
  const unavailable = renderTerm(term, new Set(['example']));
  assert.doesNotMatch(unavailable, /href="#related"|id="related"|\.\.\/target\//);
  const available = renderTerm(term, new Set(['example', 'target']));
  assert.match(available, /href="#related"/);
  assert.match(available, /href="\.\.\/target\/"/);
});

test('term route inventory detects orphaned generated slugs', () => {
  assert.deepEqual(findOrphanedSlugs(['attribute-anomaly', 'stale-term'], [{ slug: 'attribute-anomaly' }]), ['stale-term']);
  assert.deepEqual(findOrphanedSlugs(['attribute-anomaly'], [{ slug: 'attribute-anomaly' }]), []);
});
