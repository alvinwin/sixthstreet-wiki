import { renderDA, renderDABossTrends } from './render-da.js';
import { renderSD } from './render-sd.js';
import { validateDAData } from './validate-da.js';
import { validateDABossCharacterTrends } from './validate-da-boss-character-trends.js';
import { formatRemaining, normalizedEndsAt } from './remaining-time.js';

async function load(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.json();
}

async function init() {
  const daContent = document.getElementById('da-content');
  const trendContent = document.getElementById('da-trends');
  const sdContent = document.getElementById('sd-content');

  const daPromise = load('./data/deadly-assault.json').then(data => {
    const errors = validateDAData(data);
    if (errors.length) throw new Error(errors.join('; '));
    return data;
  });
  const sdPromise = load('./data/shiyu-defense.json');
  const trendPromise = load('./data/da-boss-character-trends.json').then(data => {
    const errors = validateDABossCharacterTrends(data);
    if (errors.length) throw new Error(errors.join('; '));
    return data;
  });

  const [daResult, sdResult] = await Promise.allSettled([daPromise, sdPromise]);

  if (daResult.status === 'fulfilled') {
    renderDA(daContent, daResult.value);
    renderTicker('da-ticker', 'DA', daResult.value, daResult.value?.window?.end);
  } else {
    renderUnavailable(daContent, 'Deadly Assault data could not be loaded.');
    renderTicker('da-ticker', 'DA');
  }

  if (sdResult.status === 'fulfilled') {
    renderSD(sdContent, sdResult.value);
    renderTicker('sd-ticker', 'SD', sdResult.value, sdResult.value?.window?.end);
  } else {
    renderUnavailable(sdContent, 'Shiyu Defense data could not be loaded.');
    renderTicker('sd-ticker', 'SD');
  }

  trendPromise
    .then(data => renderDABossTrends(trendContent, data))
    .catch(() => renderTrendUnavailable(trendContent));

  renderProvenance(document.getElementById('provenance'), {
    da: daResult.value,
    sd: sdResult.value,
  });
}

function renderTicker(id, label, data, rawEndsAt) {
  const el = document.getElementById(id);
  const isLive = data && data.status !== 'awaiting-refresh';
  const sourceDetail = isLive
    ? `${data.phaseName ? `${data.phaseName} · ` : ''}reviewed ${data.lastRefreshed}`
    : data ? 'awaiting fresh source' : 'data unavailable';
  const endsAt = isLive ? normalizedEndsAt(rawEndsAt) : null;
  const remaining = isLive
    ? endsAt ? formatRemaining(endsAt) : { state: 'unavailable', text: 'Status unavailable' }
    : null;
  const isCurrent = remaining?.state === 'current';

  el.innerHTML = `<span class="ticker__dot ticker__dot--${isCurrent ? 'live' : 'pending'}" aria-hidden="true"></span><span class="ticker__line"><strong class="ticker__label">${label}:</strong> <span class="ticker__source">${sourceDetail}</span>${remaining ? `<span class="ticker__divider" aria-hidden="true"> · </span><span class="ticker__remaining" aria-live="off">${remaining.text}</span>` : ''}</span>`;

  if (!endsAt) return;
  let priorText = remaining.text;
  const timer = window.setInterval(() => {
    const next = formatRemaining(endsAt);
    if (next.text === priorText) return;
    priorText = next.text;
    const remainingEl = el.querySelector('.ticker__remaining');
    if (remainingEl) remainingEl.textContent = next.text;
    const dot = el.querySelector('.ticker__dot');
    if (dot) dot.className = `ticker__dot ticker__dot--${next.state === 'current' ? 'live' : 'pending'}`;
    if (next.state !== 'current') window.clearInterval(timer);
  }, 60_000);
}

function renderUnavailable(container, message) {
  container.innerHTML = `
    <div class="data-status" role="status">
      <strong>Data unavailable</strong>
      <span>${message} Try again later; no cached rotation is being shown.</span>
    </div>
  `;
}

function renderTrendUnavailable(container) {
  container.innerHTML = `
    <div class="data-status da-trends__error" role="status">
      <strong>Trend record unavailable</strong>
      <span>The observed character record could not be verified. Current Deadly Assault and Shiyu Defense notes remain available.</span>
    </div>
  `;
}

function renderProvenance(el, { da, sd }) {
  const parts = [];

  if (sd?.provenance) {
    const p = sd.provenance;
    const shortSha = p.sourceSha.slice(0, 12);
    parts.push(`<div class="provenance-block">
      <strong>Shiyu Defense data</strong> from
      <a href="https://github.com/${p.sourceRepo}/tree/${p.sourceSha}" target="_blank" rel="noopener">${p.sourceRepo}</a>
      @ <span class="sha">${shortSha}</span>
      (${p.license}). ${p.note}
    </div>`);
  }

  if (da?.provenance?.sourceRepo && da?.provenance?.sourceSha) {
    const p = da.provenance;
    const sourceUrl = `https://github.com/${p.sourceRepo}/tree/${p.sourceSha}`;
    const officialLinks = (p.officialSources || [])
      .map(source => `<a href="${source.url}" target="_blank" rel="noopener">${source.label}</a>`)
      .join(', ');
    parts.push(`<div class="provenance-block">
      <strong>Deadly Assault data</strong> from
      <a href="${sourceUrl}" target="_blank" rel="noopener">${p.sourceRepo}</a>
      @ <span class="sha">${p.sourceSha.slice(0, 12)}</span>.
      ${p.note}${officialLinks ? ` Official corroboration: ${officialLinks}.` : ''}
    </div>`);
  }

  el.innerHTML = parts.join('');
}

init();
