const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const SHA_RE = /^[0-9a-f]{40}$/i;
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

function nonEmptyText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isoTime(value) {
  return typeof value === 'string' && ISO_DATE_RE.test(value) && !Number.isNaN(Date.parse(value));
}

function arrayField(encounter, plural, singular) {
  if (Object.prototype.hasOwnProperty.call(encounter, plural)) return encounter[plural];
  return encounter[singular];
}

function validBuff(buff) {
  if (nonEmptyText(buff)) return true;
  if (!buff || typeof buff !== 'object' || Array.isArray(buff)) return false;
  return Object.values(buff).some(nonEmptyText);
}

export function validateDAData(data, { now = new Date() } = {}) {
  const errors = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return ['data must be an object'];
  }

  if (data.status === 'awaiting-refresh') {
    if (!nonEmptyText(data.statusNote)) {
      errors.push('statusNote must be nonempty when status is awaiting-refresh');
    }
    return errors;
  }

  if (data.status !== 'live') {
    return [`status must be live or awaiting-refresh (received ${String(data.status)})`];
  }

  const nowTime = now instanceof Date ? now.getTime() : NaN;
  if (!Number.isFinite(nowTime)) errors.push('now must be a valid Date');

  if (!data.window || typeof data.window !== 'object' || Array.isArray(data.window)) {
    errors.push('window must be an object with ISO start and end');
  } else {
    const startValid = isoTime(data.window.start);
    const endValid = isoTime(data.window.end);
    if (!startValid) errors.push('window.start must be a valid ISO timestamp');
    if (!endValid) errors.push('window.end must be a valid ISO timestamp');
    if (startValid && endValid) {
      const startTime = Date.parse(data.window.start);
      const endTime = Date.parse(data.window.end);
      if (startTime >= endTime) errors.push('window.start must be before window.end');
      if (Number.isFinite(nowTime) && nowTime >= endTime) errors.push('window.end must be in the future');
    }
  }

  if (!isoTime(data.checkedAt)) {
    errors.push('checkedAt must be a valid ISO timestamp');
  } else if (Number.isFinite(nowTime)) {
    const checkedTime = Date.parse(data.checkedAt);
    if (nowTime - checkedTime > MAX_AGE_MS) errors.push('checkedAt must be no older than 14 days');
    if (checkedTime - nowTime > FUTURE_TOLERANCE_MS) errors.push('checkedAt must not be materially in the future');
  }

  if (typeof data.hasAdversity !== 'boolean') {
    errors.push('hasAdversity must be boolean');
  }

  if (!Array.isArray(data.encounters)) {
    errors.push('encounters must be an array');
  } else {
    const standard = data.encounters.filter(encounter => encounter?.category === 'standard');
    const adversity = data.encounters.filter(encounter => encounter?.category === 'adversity');
    if (standard.length !== 3) errors.push(`encounters must contain exactly 3 standard encounters (found ${standard.length})`);
    const expectedAdversity = data.hasAdversity === true ? 1 : 0;
    if (adversity.length !== expectedAdversity) {
      errors.push(`encounters must contain exactly ${expectedAdversity} adversity encounter(s) (found ${adversity.length})`);
    }
    const expectedTotal = 3 + expectedAdversity;
    if (data.encounters.length !== expectedTotal) {
      errors.push(`encounters must contain exactly ${expectedTotal} encounters (found ${data.encounters.length})`);
    }

    const ids = new Set();
    data.encounters.forEach((encounter, index) => {
      if (!encounter || typeof encounter !== 'object' || Array.isArray(encounter)) {
        errors.push(`encounters[${index}] must be an object`);
        return;
      }
      const id = encounter.id;
      if (id === undefined || id === null || String(id).trim() === '') {
        errors.push(`encounters[${index}].id must be nonempty`);
      } else {
        const key = String(id);
        if (ids.has(key)) errors.push(`encounters[${index}].id must be unique (duplicate ${key})`);
        ids.add(key);
      }
      if (encounter.category !== 'standard' && encounter.category !== 'adversity') {
        errors.push(`encounters[${index}].category must be standard or adversity`);
      }
      if (!nonEmptyText(encounter.name)) errors.push(`encounters[${index}].name must be nonempty`);
      const mechanics = encounter.mechanics ?? encounter.mechanic;
      if (!nonEmptyText(mechanics)) errors.push(`encounters[${index}].mechanic must be nonempty`);
      if (encounter.mechanicReview !== 'reviewed') errors.push(`encounters[${index}].mechanicReview must be reviewed`);

      const weaknesses = arrayField(encounter, 'weaknesses', 'weakness');
      const resistances = arrayField(encounter, 'resistances', 'resistance');
      if (!Array.isArray(weaknesses) || weaknesses.some(item => !nonEmptyText(item))) {
        errors.push(`encounters[${index}].weaknesses must be an array of strings`);
      }
      if (!Array.isArray(resistances) || resistances.some(item => !nonEmptyText(item))) {
        errors.push(`encounters[${index}].resistances must be an array of strings`);
      }
    });
  }

  if (!Array.isArray(data.buffs) || data.buffs.length !== 3) {
    errors.push('buffs must contain exactly 3 entries');
  } else if (data.buffs.some(buff => !validBuff(buff))) {
    errors.push('buffs must contain only nonempty entries');
  }

  const provenance = data.provenance;
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    errors.push('provenance must include immutable sourceRepo, sourceSha, and upstreamSha');
  } else {
    if (!nonEmptyText(provenance.sourceRepo)) errors.push('provenance.sourceRepo must be nonempty');
    if (!SHA_RE.test(provenance.sourceSha ?? '')) errors.push('provenance.sourceSha must be a 40-hex SHA');
    if (!SHA_RE.test(provenance.upstreamSha ?? '')) errors.push('provenance.upstreamSha must be a 40-hex SHA');
  }

  return errors;
}
