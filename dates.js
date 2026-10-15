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
