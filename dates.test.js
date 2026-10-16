import { describe, it, expect } from 'vitest';
import { daysUntil, expiryStatus } from './dates.js';

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
