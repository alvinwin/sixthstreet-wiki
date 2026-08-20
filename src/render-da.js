export function renderDA(container, data) {
  if (data.status === 'awaiting-refresh') {
    container.innerHTML = `
      <div class="window-bar">
        <span class="version-badge">v${escapeHtml(data.version)}</span>
        <span class="freshness">Updated ${escapeHtml(data.lastRefreshed)}</span>
      </div>
      <div class="awaiting-refresh">
        <div class="status-label">Awaiting fresh source</div>
        <div class="status-note">${escapeHtml(data.statusNote)}</div>
        <div class="da-modes">${renderModes(data.modes)}</div>
      </div>
    `;
    return;
  }

  const standard = data.encounters.filter(encounter => encounter.category === 'standard');
  const adversity = data.encounters.filter(encounter => encounter.category === 'adversity');

  container.innerHTML = `
    <div class="window-bar">
      <span class="version-badge">v${escapeHtml(data.version)}</span>
      <span class="dates">${escapeHtml(data.phaseName)} · ${formatDate(data.window.start)} – ${formatDate(data.window.end)}</span>
      <span class="freshness">Checked ${formatDate(data.checkedAt)}</span>
    </div>
    <div class="da-modes">${renderModes(data.modes)}</div>
    <section class="quick-read" aria-labelledby="da-quick-read">
      <div class="quick-read-heading">
        <div>
          <span class="kicker">Make the call</span>
          <h3 id="da-quick-read">Trial encounters</h3>
        </div>
        <span class="quick-read-note">Reviewed mechanics only</span>
      </div>
      <div class="encounter-grid">${standard.map(renderEncounter).join('')}</div>
    </section>
    ${adversity.length ? `
      <section class="adversity-block">
        <div class="quick-read-heading">
          <div>
            <span class="kicker">Nine Trial stars required</span>
            <h3>Adversity Mode</h3>
          </div>
        </div>
        ${adversity.map(renderEncounter).join('')}
      </section>
    ` : ''}
    <section class="buffs-block">
      <h3>Selectable buffs</h3>
      ${data.buffs.map(renderBuff).join('')}
    </section>
  `;
}

export function renderDABossTrends(container, data) {
  if (!container) return;

  const bosses = Array.isArray(data?.bosses) ? data.bosses : [];
  if (!bosses.length) {
    container.innerHTML = `
      <div class="data-status da-trends__error" role="status">
        <strong>Trend record unavailable</strong>
        <span>No verified boss records are available to show.</span>
      </div>
    `;
    return;
  }

  const methodology = data.methodology || {};
  container.innerHTML = `
    <div class="da-trends__meta">
      <span>${escapeHtml(data.cohortLabel || 'Observed submitted/public-profile clears')}</span>
      <span>${bosses.length} boss records · descriptive aggregate</span>
    </div>
    <div class="trend-shelf">
      ${bosses.map((boss, index) => renderTrendBoss(boss, index)).join('')}
    </div>
    <details class="trend-method">
      <summary>Method &amp; source pins</summary>
      <div class="trend-method__body">
        <p><strong>Inclusion:</strong> ${escapeHtml(methodology.inclusion || 'Observed submitted/public-profile clears only.')}</p>
        <p><strong>Exclusion:</strong> ${escapeHtml((methodology.exclusions || []).join(' ') || 'Incomplete three-character teams.')}</p>
        <p><strong>Boundary:</strong> Appearance rates describe this observed cohort; they are not recommendations, rankings, or a tier list.</p>
      </div>
    </details>
  `;
}

function renderTrendBoss(boss, index) {
  const phases = Array.isArray(boss?.phases) ? boss.phases : [];
  const prior = phases[0] || {};
  const current = phases[phases.length - 1] || {};
  const currentCharacters = Array.isArray(current.characters) ? current.characters : [];
  const highest = currentCharacters.reduce((best, character) => (
    !best || character.appearanceRate > best.appearanceRate ? character : best
  ), null);
  const remaining = currentCharacters.slice(5);
  const status = boss?.status === 'suppressed' ? 'suppressed' : 'observed';

  return `
    <article class="trend-card">
      <div class="trend-card__topline">
        <div>
          <span class="trend-card__index">${String(index + 1).padStart(2, '0')}</span>
          <h4>${escapeHtml(boss?.displayName)}</h4>
          <p class="trend-card__source-name">${escapeHtml(boss?.currentSourceName || boss?.displayName)}</p>
        </div>
        <span class="trend-card__status trend-card__status--${status}">${escapeHtml(status)}</span>
      </div>
      <div class="trend-card__summary">
        <div class="trend-stat">
          <span>Current sample</span>
          <strong>${formatSampleSize(current.sampleSize)}</strong>
          <small>${escapeHtml(current.version)} · ${escapeHtml(current.phase)} observed clears</small>
        </div>
        <div class="trend-stat trend-stat--highest">
          <span>Highest observed current appearance</span>
          ${highest ? `
            <strong>${escapeHtml(highest.name)}</strong>
            <small>${formatRate(highest.appearanceRate)} appearance · ${formatDelta(highest.priorAppearanceChange)}</small>
          ` : `
            <strong>No rows shown</strong>
            <small>Current sample is below the reporting threshold.</small>
          `}
        </div>
      </div>
      <details class="trend-card__details">
        <summary>Open prior/current samples and character rows</summary>
        <div class="trend-card__details-body">
          <div class="trend-samples" aria-label="Prior and current sample sizes">
            ${renderTrendSample('Prior sample', prior)}
            ${renderTrendSample('Current sample', current)}
          </div>
          ${currentCharacters.length ? `
            <section class="trend-rows" aria-labelledby="trend-rows-${escapeHtml(boss?.canonicalId)}">
              <h5 id="trend-rows-${escapeHtml(boss?.canonicalId)}">Top five current rows</h5>
              <ol>${currentCharacters.slice(0, 5).map((character, rowIndex) => renderTrendRow(character, rowIndex)).join('')}</ol>
            </section>
            ${remaining.length ? `
              <details class="trend-remaining">
                <summary>Show remaining ${remaining.length} rows</summary>
                <ol>${remaining.map((character, rowIndex) => renderTrendRow(character, rowIndex + 5)).join('')}</ol>
              </details>
            ` : ''}
          ` : `
            <p class="trend-empty">Character rows are withheld because the current sample is below the reporting threshold.</p>
          `}
          ${renderTrendSource(boss, prior, current)}
        </div>
      </details>
    </article>
  `;
}

function renderTrendSample(label, phase) {
  return `
    <div class="trend-sample">
      <span>${escapeHtml(label)}</span>
      <strong>${formatSampleSize(phase.sampleSize)}</strong>
      <small>${escapeHtml(phase.version)} · ${escapeHtml(phase.phase)}</small>
    </div>
  `;
}

function renderTrendRow(character, index) {
  const direction = typeof character.priorAppearanceChange === 'number'
    ? character.priorAppearanceChange > 0 ? 'up' : character.priorAppearanceChange < 0 ? 'down' : 'flat'
    : 'na';
  return `
    <li class="trend-row">
      <span class="trend-row__rank" aria-hidden="true">${index + 1}</span>
      <span class="trend-row__name">${escapeHtml(character.name)}</span>
      <span class="trend-row__count">${formatSampleSize(character.clearCount)} clears</span>
      <span class="trend-row__rate">${formatRate(character.appearanceRate)}</span>
      <span class="trend-row__delta trend-row__delta--${direction}">${formatDelta(character.priorAppearanceChange)}</span>
    </li>
  `;
}

function renderTrendSource(boss, prior, current) {
  const priorSource = prior.provenance || {};
  const currentSource = current.provenance || {};
  return `
    <details class="trend-source">
      <summary>Method &amp; source</summary>
      <div class="trend-source__body">
        <p>Observed submitted/public-profile clears; incomplete three-character teams excluded.</p>
        ${renderSourcePin('Current', currentSource)}
        ${renderSourcePin('Prior', priorSource)}
        <p>Record: ${escapeHtml(boss?.canonicalId)}</p>
      </div>
    </details>
  `;
}

function renderSourcePin(label, source) {
  const sourceFile = source.sourceUrl
    ? `<a href="${escapeHtml(source.sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(source.sourceFile)}</a>`
    : escapeHtml(source.sourceFile);
  return `<p><strong>${escapeHtml(label)}:</strong> ${sourceFile} · rev ${escapeHtml(shortRevision(source.sourceRevision))} · retrieved ${escapeHtml(source.retrievedAt)}<br><span>SHA-256: <code>${escapeHtml(source.sourceSha256)}</code></span></p>`;
}

function formatSampleSize(value) {
  return Number.isFinite(value) ? `n = ${value.toLocaleString('en-US')}` : 'n unavailable';
}

function formatRate(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : 'rate unavailable';
}

function formatDelta(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'no prior comparison';
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(1)} pp vs prior`;
}

function shortRevision(value) {
  return typeof value === 'string' ? value.slice(0, 12) : 'unavailable';
}

function renderEncounter(encounter) {
  const weakness = encounter.weaknesses.length
    ? `Favor ${encounter.weaknesses.map(escapeHtml).join(' / ')}`
    : 'No listed elemental weakness';
  const resistance = encounter.resistances.length
    ? `Avoid ${encounter.resistances.map(escapeHtml).join(' / ')}`
    : 'No listed resistance';

  return `
    <article class="encounter-card">
      <div class="encounter-heading">
        <span class="specialty-badge">${escapeHtml(encounter.specialty)}</span>
        <h4>${escapeHtml(encounter.name)}</h4>
      </div>
      <div class="matchup-line"><strong>${weakness}</strong><span>${resistance}</span></div>
      <p>${escapeHtml(encounter.mechanic)}</p>
    </article>
  `;
}

function renderBuff(buff) {
  return `
    <div class="buff-item">
      <div class="buff-name">${escapeHtml(buff.name)}</div>
      <div class="buff-desc">${escapeHtml(buff.description)}</div>
    </div>
  `;
}

function renderModes(modes = []) {
  return modes.map(mode => `<span class="mode-chip">${escapeHtml(mode)}</span>`).join('');
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
