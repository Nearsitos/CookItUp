//Expiration calculation helper functions for recipes and ingredients
/**
 * Whole days from `today` until an ISO date string (YYYY-MM-DD).
 * Negative means already expired.
 */
export function daysUntil(expiryISO, today = new Date()) {
  const [year, month, day] = expiryISO.split('-').map(Number);
  const expiry = Date.UTC(year, month - 1, day);
  const start = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((expiry - start) / 86_400_000);
}

/** Maps days remaining to a badge status: 'expired' | 'soon' | 'fresh'. */
export function expiryStatus(days) {
  if (days < 0) return 'expired';
  if (days <= 3) return 'soon';
  return 'fresh';
}

/** Human-readable text for a badge, e.g. "Expires tomorrow". */
export function expiryLabel(days) {
  if (days < -1) return `Expired ${-days} days ago`;
  if (days === -1) return 'Expired yesterday';
  if (days === 0) return 'Expires today';
  if (days === 1) return 'Expires tomorrow';
  return `${days} days left`;
}

/** True for a real calendar date in YYYY-MM-DD form (what <input type="date"> gives). */
export function isISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Sort comparator: soonest expiry first, items with no date last. */
export function compareExpiry(a, b) {
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;
  return a.localeCompare(b);
}

