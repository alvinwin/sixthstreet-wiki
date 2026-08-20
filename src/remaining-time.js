const MINUTE_MS = 60_000;
const HOUR_MINUTES = 60;
const DAY_MINUTES = 24 * HOUR_MINUTES;

export function formatRemaining(endsAt, now = Date.now()) {
  const endTime = strictIsoTimestamp(endsAt);
  const nowTime = now instanceof Date ? now.getTime() : Number(now);

  if (!Number.isFinite(endTime) || !Number.isFinite(nowTime)) {
    return { state: 'unavailable', text: 'Status unavailable' };
  }

  const remainingMs = endTime - nowTime;
  if (remainingMs <= 0) return { state: 'pending', text: 'Refresh pending' };

  const remainingMinutes = Math.ceil(remainingMs / MINUTE_MS);
  if (remainingMinutes >= DAY_MINUTES) {
    const days = Math.floor(remainingMinutes / DAY_MINUTES);
    const hours = Math.floor((remainingMinutes % DAY_MINUTES) / HOUR_MINUTES);
    return { state: 'current', text: `${days}d ${hours}h remaining` };
  }

  if (remainingMinutes >= HOUR_MINUTES) {
    const hours = Math.floor(remainingMinutes / HOUR_MINUTES);
    const minutes = remainingMinutes % HOUR_MINUTES;
    return { state: 'current', text: `${hours}h ${minutes}m remaining` };
  }

  return { state: 'current', text: `${remainingMinutes}m remaining` };
}

export function normalizedEndsAt(value) {
  if (typeof value !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const normalized = `${value}T00:00:00.000Z`;
    return Number.isFinite(strictIsoTimestamp(normalized)) ? normalized : null;
  }
  return Number.isFinite(strictIsoTimestamp(value)) ? value : null;
}

function strictIsoTimestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return NaN;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return NaN;
  const withoutZulu = value.slice(0, -1);
  const [whole, fraction = ''] = withoutZulu.split('.');
  const canonical = `${whole}.${fraction.padEnd(3, '0')}Z`;
  return new Date(parsed).toISOString() === canonical ? parsed : NaN;
}
