import { describe, it, expect } from 'vitest';
import {
  daysUntil,
  expiryStatus,
  expiryLabel,
  isISODate,
  compareExpiry,
} from './dates.js';

const today = new Date(2026, 9, 15); // Oct 15, 2026

describe('daysUntil', () => {
  it('counts days until a future date', () => {
    expect(daysUntil('2026-10-20', today)).toBe(5);
  });

  it('returns 0 for today', () => {
    expect(daysUntil('2026-10-15', today)).toBe(0);
  });

  it('returns a negative number for past dates', () => {
    expect(daysUntil('2026-10-14', today)).toBe(-1);
  });
});

describe('expiryStatus', () => {
  it('flags expired items', () => {
    expect(expiryStatus(-1)).toBe('expired');
  });

  it('flags items expiring within 3 days as soon', () => {
    expect(expiryStatus(0)).toBe('soon');
    expect(expiryStatus(3)).toBe('soon');
  });

  it('treats everything else as fresh', () => {
    expect(expiryStatus(4)).toBe('fresh');
  });
});

describe('daysUntil across boundaries', () => {
  it('counts across a month end', () => {
    expect(daysUntil('2026-11-01', today)).toBe(17);
  });

  it('counts across a year end', () => {
    expect(daysUntil('2027-01-01', new Date(2026, 11, 31))).toBe(1);
  });
});

describe('expiryLabel', () => {
  it('describes past, present and future dates', () => {
    expect(expiryLabel(-4)).toBe('Expired 4 days ago');
    expect(expiryLabel(-1)).toBe('Expired yesterday');
    expect(expiryLabel(0)).toBe('Expires today');
    expect(expiryLabel(1)).toBe('Expires tomorrow');
    expect(expiryLabel(9)).toBe('9 days left');
  });
});

describe('isISODate', () => {
  it('accepts real YYYY-MM-DD dates', () => {
    expect(isISODate('2026-11-05')).toBe(true);
    expect(isISODate('2028-02-29')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isISODate('2026-02-30')).toBe(false);
    expect(isISODate('11/05/2026')).toBe(false);
    expect(isISODate('')).toBe(false);
    expect(isISODate(null)).toBe(false);
  });
});

describe('compareExpiry', () => {
  it('sorts soonest first and undated items last', () => {
    const dates = ['2026-12-01', null, '2026-11-02', undefined, '2026-11-20'];
    expect([...dates].sort(compareExpiry)).toEqual([
      '2026-11-02',
      '2026-11-20',
      '2026-12-01',
      null,
      undefined,
    ]);
  });
});
