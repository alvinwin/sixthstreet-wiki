import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = resolve(appRoot, 'data/terms.json');
const interactionKinds = new Set(['Base system', 'Attribute-specific', 'Agent skill']);

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function validate(data) {
  const errors = [];
  if (data?.schemaVersion !== 2) errors.push('schemaVersion must be 2');
  if (!Array.isArray(data?.terms) || data.terms.length === 0) errors.push('terms must be a non-empty array');

  const slugs = new Set();
  for (const [index, term] of (data?.terms ?? []).entries()) {
    const path = `terms[${index}]`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(term?.slug ?? '')) errors.push(`${path}.slug must be URL-safe`);
    if (slugs.has(term?.slug)) errors.push(`${path}.slug must be unique`);
    slugs.add(term?.slug);
    for (const field of ['title', 'summary', 'whyItMatters', 'distinctionTitle', 'distinction', 'checkedOn', 'freshnessNote']) {
      if (typeof term?.[field] !== 'string' || term[field].trim() === '') errors.push(`${path}.${field} is required`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(term?.checkedOn ?? '')) errors.push(`${path}.checkedOn must be YYYY-MM-DD`);
    if (!Array.isArray(term?.steps) || term.steps.length < 2) errors.push(`${path}.steps must contain at least two items`);
    if (!Array.isArray(term?.statNotes) || term.statNotes.length === 0) errors.push(`${path}.statNotes must be non-empty`);
    if (!Array.isArray(term?.related) || term.related.length === 0) errors.push(`${path}.related must be non-empty`);
    if (!Array.isArray(term?.sources) || term.sources.length < 2) errors.push(`${path}.sources must contain at least two sources`);
    for (const [stepIndex, step] of (term?.steps ?? []).entries()) {
      if (typeof step !== 'string' || step.trim() === '') errors.push(`${path}.steps[${stepIndex}] must be a non-empty string`);
    }
    for (const [noteIndex, note] of (term?.statNotes ?? []).entries()) {
      if (typeof note?.name !== 'string' || note.name.trim() === '' || typeof note?.description !== 'string' || note.description.trim() === '') {
        errors.push(`${path}.statNotes[${noteIndex}] needs string name and description`);
      }
    }
    const relatedSlugs = new Set();
    for (const [relatedIndex, item] of (term?.related ?? []).entries()) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item?.slug ?? '')) {
        errors.push(`${path}.related[${relatedIndex}].slug must be URL-safe`);
      }
      if (item?.slug === term?.slug) errors.push(`${path}.related[${relatedIndex}].slug cannot reference itself`);
      if (relatedSlugs.has(item?.slug)) errors.push(`${path}.related[${relatedIndex}].slug must be unique within the term`);
      relatedSlugs.add(item?.slug);
      if (typeof item?.name !== 'string' || item.name.trim() === '' || typeof item?.description !== 'string' || item.description.trim() === '') {
        errors.push(`${path}.related[${relatedIndex}] needs string name and description`);
      }
    }
    const sourceUrls = new Set();
    for (const [sourceIndex, source] of (term?.sources ?? []).entries()) {
      if (!/^https:\/\/[a-z0-9.-]+(?:\/[^\s]*)?$/i.test(source?.url ?? '')) {
        errors.push(`${path}.sources[${sourceIndex}].url must be an HTTPS URL`);
      }
      if (sourceUrls.has(source?.url)) errors.push(`${path}.sources[${sourceIndex}].url must be unique within the term`);
      sourceUrls.add(source?.url);
      if (typeof source?.label !== 'string' || source.label.trim() === '' || typeof source?.publisher !== 'string' || source.publisher.trim() === '' || typeof source?.sourceType !== 'string' || source.sourceType.trim() === '' || typeof source?.scope !== 'string' || source.scope.trim() === '') {
        errors.push(`${path}.sources[${sourceIndex}] needs string label, publisher, sourceType, and scope`);
      }
    }

    if (term?.hub != null) {
      const hub = term.hub;
      if (typeof hub?.gauge?.label !== 'string' || hub.gauge.label.trim() === '' || typeof hub?.gauge?.caption !== 'string' || hub.gauge.caption.trim() === '') {
        errors.push(`${path}.hub.gauge needs string label and caption`);
      }
      for (const field of ['applicationRules', 'effects', 'interactions', 'formulaNotes']) {
        if (!Array.isArray(hub?.[field]) || hub[field].length === 0) errors.push(`${path}.hub.${field} must be non-empty`);
      }
      for (const [itemIndex, item] of (hub?.applicationRules ?? []).entries()) {
        for (const field of ['name', 'status', 'description']) {
          if (typeof item?.[field] !== 'string' || item[field].trim() === '') errors.push(`${path}.hub.applicationRules[${itemIndex}].${field} is required`);
        }
      }
      for (const [itemIndex, item] of (hub?.effects ?? []).entries()) {
        for (const field of ['attribute', 'effect', 'description']) {
          if (typeof item?.[field] !== 'string' || item[field].trim() === '') errors.push(`${path}.hub.effects[${itemIndex}].${field} is required`);
        }
      }
      for (const [itemIndex, item] of (hub?.interactions ?? []).entries()) {
        for (const field of ['name', 'kind', 'description']) {
          if (typeof item?.[field] !== 'string' || item[field].trim() === '') errors.push(`${path}.hub.interactions[${itemIndex}].${field} is required`);
        }
        if (!interactionKinds.has(item?.kind)) errors.push(`${path}.hub.interactions[${itemIndex}].kind must use the interaction ownership schema`);
        if (item?.slug != null && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) errors.push(`${path}.hub.interactions[${itemIndex}].slug must be URL-safe`);
      }
      for (const [itemIndex, item] of (hub?.formulaNotes ?? []).entries()) {
        for (const field of ['name', 'formula', 'status']) {
          if (typeof item?.[field] !== 'string' || item[field].trim() === '') errors.push(`${path}.hub.formulaNotes[${itemIndex}].${field} is required`);
        }
      }
    }
  }

  if (errors.length) throw new Error(`term data validation failed:\n- ${errors.join('\n- ')}`);
  return data;
}

export function findOrphanedSlugs(existingSlugs, terms) {
  const expectedSlugs = new Set(terms.map(term => term.slug));
  return existingSlugs.filter(slug => !expectedSlugs.has(slug));
}

export function renderTerm(term, availableSlugs) {
  const steps = term.steps.map(step => `<li>${escapeHtml(step)}</li>`).join('\n              ');
  const stats = term.statNotes.map(note => `
            <div>
              <dt>${escapeHtml(note.name)}</dt>
              <dd>${escapeHtml(note.description)}</dd>
            </div>`).join('');
  const availableRelated = term.related.filter(item => availableSlugs.has(item.slug));
  const related = availableRelated.map(item => {
    return `
          <a class="related-card" href="../${escapeHtml(item.slug)}/">
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.description)}</p>
            <span>Read term <span aria-hidden="true">→</span></span>
          </a>`;
  }).join('');
  const relatedNav = availableRelated.length && !term.hub ? '          <a href="#related">Related</a>\n' : '';
  const relatedSection = availableRelated.length ? `            <section class="term-section" id="related" aria-labelledby="related-title">
              <p class="section-number">Related terms</p>
              <h2 id="related-title">Continue from here</h2>
              <div class="related-grid">${related}
              </div>
            </section>\n\n` : '';
  const sources = term.sources.map(source => `
            <li>
              <a href="${escapeHtml(source.url)}">
                <strong>${escapeHtml(source.label)}</strong>
                <span>${escapeHtml(source.publisher)} · ${escapeHtml(source.sourceType)}</span>
                <small>${escapeHtml(source.scope)}</small>
              </a>
            </li>`).join('');
  const hubNav = term.hub ? '          <a href="#effects">Effects</a>\n          <a href="#application">Application</a>\n          <a href="#interactions">Interactions</a>\n' : '';
  const gaugeVisual = term.hub ? `
              <figure class="buildup-figure">
                <div class="buildup-meter" role="img" aria-label="Schematic full Anomaly Buildup gauge">
                  <span>100%</span>
                </div>
                <figcaption><strong>${escapeHtml(term.hub.gauge.label)}</strong>${escapeHtml(term.hub.gauge.caption)}</figcaption>
              </figure>` : '';
  const ruleCards = (term.hub?.applicationRules ?? []).map(item => `
                <article class="rule-card">
                  <p class="card-status">${escapeHtml(item.status)}</p>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                </article>`).join('');
  const effectCards = (term.hub?.effects ?? []).map(item => `
                <article class="effect-card effect-${escapeHtml(item.attribute.toLowerCase())}">
                  <p class="effect-attribute">${escapeHtml(item.attribute)}</p>
                  <h3>${escapeHtml(item.effect)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                </article>`).join('');
  const interactionCards = (term.hub?.interactions ?? []).map(item => {
    const tag = item.slug && availableSlugs.has(item.slug) ? 'a' : 'article';
    const href = tag === 'a' ? ` href="../${escapeHtml(item.slug)}/"` : '';
    const action = tag === 'a' ? '<span>Read term <span aria-hidden="true">→</span></span>' : '<span>Dedicated page pending</span>';
    return `
                <${tag} class="interaction-card"${href}>
                  <p class="card-status">${escapeHtml(item.kind)}</p>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                  ${action}
                </${tag}>`;
  }).join('');
  const formulaCards = (term.hub?.formulaNotes ?? []).map(item => `
                <article class="formula-card">
                  <p class="card-status formula-status">${escapeHtml(item.status)}</p>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p class="formula-line">${escapeHtml(item.formula)}</p>
                </article>`).join('');
  const hubSections = term.hub ? `
            <section class="term-section" id="effects" aria-labelledby="effects-title">
              <p class="section-number">Attribute effects</p>
              <h2 id="effects-title">What the trigger inflicts</h2>
              <p>These are the standard effect families. Special Attributes and individual kits can change the route or the calculation.</p>
              <div class="effect-grid">${effectCards}
              </div>
            </section>

            <section class="term-section" id="application" aria-labelledby="application-title">
              <p class="section-number">Application rules</p>
              <h2 id="application-title">Why a full gauge may not fire</h2>
              <p>“Diminishing returns” mixes several different limits. Keep the cooldown, resistance, contributor mix, and repeat-trigger research separate.</p>
              <div class="rule-grid">${ruleCards}
              </div>
            </section>

            <section class="term-section" id="interactions" aria-labelledby="interactions-title">
              <p class="section-number">Reactions and exceptions</p>
              <h2 id="interactions-title">What happens after the trigger</h2>
              <p>Base reactions, special Attributes, and Agent mechanics are related—but they are not interchangeable layers of the system.</p>
              <div class="interaction-grid">${interactionCards}
              </div>
            </section>

            <section class="term-section" id="formula" aria-labelledby="formula-title">
              <p class="section-number">Calculation map</p>
              <h2 id="formula-title">What the math is made from</h2>
              <p>The formulas below are a map of the inputs, not a promise that every special mechanic uses the same coefficients.</p>
              <div class="formula-grid">${formulaCards}
              </div>
            </section>
` : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${escapeHtml(term.summary)}">
    <title>${escapeHtml(term.title)} — sixthstreet.wiki</title>
    <link rel="stylesheet" href="../../styles.css">
    <link rel="stylesheet" href="../../terms.css">
  </head>
  <body>
    <a class="skip-link" href="#term-content">Skip to the term</a>
    <header class="site-header">
      <div class="shell masthead">
        <a class="brand" href="../../" aria-label="sixthstreet.wiki home">
          <span class="brand-mark" aria-hidden="true">S</span>
          <span>sixthstreet.wiki</span>
        </a>
        <nav class="primary-nav term-nav" aria-label="Term navigation">
          <a href="#meaning">Definition</a>
${hubNav}${relatedNav}          <a href="#sources">Sources</a>
        </nav>
      </div>
    </header>
    <main id="term-content">
      <article class="term-page">
        <header class="term-hero">
          <div class="shell term-hero-grid">
            <div>
              <p class="eyebrow">Combat mechanic</p>
              <h1>${escapeHtml(term.title)}</h1>
              <p class="term-summary">${escapeHtml(term.summary)}</p>
              <p class="term-review-meta">
                <span>${term.sources.length} linked sources checked</span>
                <time datetime="${escapeHtml(term.checkedOn)}">${escapeHtml(term.checkedOn)}</time>
              </p>
            </div>
          </div>
        </header>

        <div class="shell term-layout${term.hub ? ' term-layout-hub' : ''}">
          <div class="term-main">
            <section class="term-section" id="meaning" aria-labelledby="meaning-title">
              <p class="section-number">Definition</p>
              <h2 id="meaning-title">How it works</h2>
              <div class="term-flow${term.hub ? ' term-flow-with-meter' : ''}">
                <ol class="term-steps">
                ${steps}
                </ol>${gaugeVisual}
              </div>
            </section>

${hubSections}

            <section class="term-section" aria-labelledby="why-title">
              <p class="section-number">Why it matters</p>
              <h2 id="why-title">What it changes</h2>
              <p>${escapeHtml(term.whyItMatters)}</p>
              <dl class="stat-notes">${stats}
              </dl>
            </section>

            <section class="term-section distinction" aria-labelledby="distinction-title">
              <p class="section-number">Common confusion</p>
              <h2 id="distinction-title">${escapeHtml(term.distinctionTitle)}</h2>
              <p>${escapeHtml(term.distinction)}</p>
            </section>

${relatedSection}          </div>

          <aside class="term-source-panel" id="sources" aria-labelledby="sources-title">
            <p class="eyebrow">Review boundary</p>
            <h2 id="sources-title">Sources and scope</h2>
            <p>${escapeHtml(term.freshnessNote)}</p>
            <ul>${sources}
            </ul>
          </aside>
        </div>
      </article>
    </main>
    <footer class="site-footer">
      <div class="shell footer-inner">
        <p class="term-footer-label">sixthstreet.wiki</p>
        <p class="disclaimer">Fan-made reference site. Not affiliated with HoYoverse, Zenless Zone Zero, or their partners.</p>
      </div>
    </footer>
  </body>
</html>
`;
}

async function main() {
  const checkOnly = process.argv.includes('--check');
  const data = validate(JSON.parse(await readFile(dataPath, 'utf8')));
  const termsRoot = resolve(appRoot, 'terms');
  let failures = 0;

  let existingSlugs = [];
  try {
    existingSlugs = (await readdir(termsRoot, { withFileTypes: true })).filter(entry => entry.isDirectory()).map(entry => entry.name);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const orphanedSlugs = findOrphanedSlugs(existingSlugs, data.terms);
  if (orphanedSlugs.length) {
    console.error(`orphaned generated term routes: ${orphanedSlugs.join(', ')}; remove their directories`);
    failures += 1;
  }

  const availableSlugs = new Set(data.terms.map(term => term.slug));
  for (const term of data.terms) {
    const outputPath = resolve(termsRoot, term.slug, 'index.html');
    const expected = renderTerm(term, availableSlugs);
    if (checkOnly) {
      let actual = '';
      try {
        actual = await readFile(outputPath, 'utf8');
      } catch {
        console.error(`missing generated term page: ${outputPath}`);
        failures += 1;
        continue;
      }
      if (actual !== expected) {
        console.error(`stale generated term page: ${outputPath}; run npm run build:terms`);
        failures += 1;
      }
    } else {
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, expected);
      console.log(`generated ${outputPath}`);
    }
  }

  if (failures) process.exitCode = 1;
  else if (checkOnly) console.log(`term pages current: ${data.terms.length}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
