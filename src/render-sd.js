export function renderSD(container, data) {
  const windowHtml = renderWindow(data);
  const quickReadHtml = renderQuickRead(data.stages);
  const buffsHtml = renderBuffs(data.buffs);
  const stagesHtml = data.stages.map(renderStage).join('');

  container.innerHTML = windowHtml + quickReadHtml + buffsHtml + `
    <div class="detail-heading">
      <h3>Wave details</h3>
      <span>Use these after choosing your sides.</span>
    </div>
  ` + stagesHtml;
}

function renderQuickRead(stages) {
  const rows = stages.map(stage => {
    const sides = stage.sides.map(side => {
      const favor = side.weakness.length ? side.weakness.join(' / ') : 'No listed weakness';
      const avoid = side.resistance.length ? `Avoid ${side.resistance.join(' / ')}` : 'No listed resistance';

      return `
        <div class="decision-side">
          <span class="decision-side-label">${stage.id}${side.label}</span>
          <strong>Favor ${favor}</strong>
          <span>${avoid}</span>
        </div>
      `;
    }).join('');

    return `<div class="decision-row">${sides}</div>`;
  }).join('');

  return `
    <section class="quick-read" aria-labelledby="sd-quick-read">
      <div class="quick-read-heading">
        <div>
          <span class="kicker">Make the call</span>
          <h3 id="sd-quick-read">Side matchups</h3>
        </div>
        <span class="quick-read-note">Weaknesses and resistances only</span>
      </div>
      ${rows}
    </section>
  `;
}

function renderWindow(data) {
  const start = formatDate(data.window.start);
  const end = formatDate(data.window.end);
  return `
    <div class="window-bar">
      <span class="version-badge">v${data.version}</span>
      <span class="dates">${start} – ${end}</span>
      <span class="freshness">Updated ${data.lastRefreshed}</span>
    </div>
  `;
}

function renderBuffs(buffs) {
  const items = buffs.map(b => `
    <div class="buff-item">
      <div class="buff-name">${b.name}</div>
      <div class="buff-desc">${b.description}</div>
    </div>
  `).join('');

  return `
    <div class="buffs-block">
      <h3>Buffs</h3>
      ${items}
    </div>
  `;
}

function renderStage(stage) {
  const isChallenge = stage.sides.length > 2;
  const sidesClass = isChallenge ? 'stage-sides three-sides' : 'stage-sides';
  const challengeBadge = isChallenge ? '<span class="challenge-badge">Challenge</span>' : '';

  const sidesHtml = stage.sides.map(renderSide).join('');

  return `
    <div class="stage-card">
      <div class="stage-header">Stage ${stage.id}${challengeBadge}</div>
      <div class="${sidesClass}">
        ${sidesHtml}
      </div>
    </div>
  `;
}

function renderSide(side) {
  const weakBadges = side.weakness
    .map(el => `<span class="element-badge weakness" data-element="${el}">${el}</span>`)
    .join('');
  const resistBadges = side.resistance
    .map(el => `<span class="element-badge resistance" data-element="${el}">${el}</span>`)
    .join('');

  const wavesHtml = side.waves.map((wave, i) => {
    const enemies = wave.map(e => {
      const nameClass = e.type === 'boss' ? 'enemy-name boss' : 'enemy-name';
      const typeBadge = e.type === 'boss' ? ' <span class="enemy-type-badge">Boss</span>' : '';
      const count = e.count > 1 ? ` <span class="enemy-count">&times;${e.count}</span>` : '';
      return `<span class="${nameClass}">${e.name}</span>${count}${typeBadge}`;
    }).join(', ');

    return `
      <li class="wave-item">
        <span class="wave-label">W${i + 1}</span> ${enemies}
      </li>
    `;
  }).join('');

  return `
    <div class="side-panel">
      <div class="side-label">Side ${side.label}</div>
      <div class="element-badges">
        ${weakBadges}${resistBadges}
      </div>
      <ul class="waves-list">
        ${wavesHtml}
      </ul>
      <div class="hp-mult">HP &times;${side.hpMult}%</div>
    </div>
  `;
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
